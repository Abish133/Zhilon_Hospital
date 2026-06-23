import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Spin, Tag } from 'antd';
import { PrinterOutlined, DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { labOrderService, labOrderDetailService, labResultService, hospitalService, patientService } from '@/services';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { calculateAge } from '@utils/helpers';
import apiClient from '@config/api';
import dayjs from 'dayjs';

// Logos are served from the backend origin (not under /api). Build an absolute URL
// for a stored relative path like "/uploads/logos/logo-x.png".
const ASSET_BASE = (apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '');
const toLogoUrl = (u) => !u ? null : (/^https?:/i.test(u) ? u : `${ASSET_BASE}${u.startsWith('/') ? '' : '/'}${u}`);

const LabReport = () => {
  const { order_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [results, setResults] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [patientFull, setPatientFull] = useState(null);

  useEffect(() => {
    if (order_id) fetchReportData();
  }, [order_id]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [orderRes, detailsRes, resultsRes] = await Promise.all([
        labOrderService.getById(order_id),
        labOrderDetailService.getAll({ order_id }),
        labResultService.getAll({ order_id })
      ]);

      if (orderRes.success) setOrder(orderRes.data);
      if (detailsRes.success) setOrderDetails(detailsRes.data || []);
      if (resultsRes.success) setResults(resultsRes.data || []);

      // Full hospital branding (address, phone, email, logo) — the lab order only
      // carries the hospital name, so fetch the rest from the hospital master.
      if (user?.hospital_id) {
        try {
          const hRes = await hospitalService.getById(user.hospital_id);
          if (hRes?.success) setHospital(hRes.data);
        } catch { /* fall back to order.hospital */ }
      }

      // Full patient demographics (age, gender, blood group, contact) as a safety
      // net — the order's patient block is slim, so pull the master record too.
      const uhid = orderRes?.data?.uhid;
      if (uhid) {
        try {
          const pRes = await patientService.getByUHID(uhid);
          if (pRes?.success) setPatientFull(pRes.data);
        } catch { /* fall back to order.patient */ }
      }
    } catch (error) {
      message.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // result_data is a JSONB column — primitive, array, OR an object of analytes
  // (e.g. {WBC: 7.2, Platelets: 250}). Render each shape safely.
  const renderResultData = (data) => {
    if (data == null) return <span style={{ color: '#94a3b8' }}>—</span>;
    if (typeof data !== 'object') return <strong>{String(data)}</strong>;
    if (Array.isArray(data)) {
      return <div>{data.map((v, i) => <div key={i}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>)}</div>;
    }
    return (
      <div>
        {Object.entries(data).map(([k, v]) => (
          <div key={k}><strong>{k}:</strong> {v != null && typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</div>
        ))}
      </div>
    );
  };

  const interpColor = { Normal: 'green', Abnormal: 'red', High: 'orange', Low: 'blue' };

  const columns = [
    {
      title: 'Test', dataIndex: 'test_name', key: 'test_name',
      render: (_, record) => {
        const detail = orderDetails.find(d => d.detail_id === record.detail_id);
        return <span style={{ fontWeight: 600, color: '#0f172a' }}>{detail?.test_name || record.test?.test_name || 'N/A'}</span>;
      }
    },
    { title: 'Result', dataIndex: 'result_data', key: 'result_data', render: (r) => renderResultData(r) },
    {
      title: 'Interpretation', dataIndex: 'interpretation', key: 'interpretation',
      width: 150,
      render: (v) => v ? <Tag color={interpColor[v] || 'default'} style={{ fontWeight: 600 }}>{v}</Tag> : '—'
    },
    {
      title: 'Flag', dataIndex: 'critical_value', key: 'critical_value', width: 90, align: 'center',
      render: (c) => c ? <Tag color="red" style={{ fontWeight: 700 }}>CRITICAL</Tag> : <span style={{ color: '#94a3b8' }}>Normal</span>
    }
  ];

  if (loading && !order) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }
  if (!order) return null;

  // Resolve hospital fields with graceful fallbacks.
  const h = hospital || {};
  const hName = h.hospitalName || order.hospital?.hospitalName || 'Hospital';
  const hAddress = h.address || '';
  const hContact = [h.phone ? `Phone: ${h.phone}` : null, (h.hospitalEmail || h.email) ? `Email: ${h.hospitalEmail || h.email}` : null]
    .filter(Boolean).join('   |   ');
  const hExtra = [h.website || null, h.registration_number ? `Reg. No: ${h.registration_number}` : null].filter(Boolean).join('   |   ');
  const logo = toLogoUrl(h.logo_url);
  const initials = hName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Merge the slim order patient with the full master record (full wins).
  const patient = { ...(order.patient || {}), ...(patientFull || {}) };
  // Use the stored age if present (incl. 0 for infants), else derive from DOB.
  const ageVal = patient.age != null ? patient.age : (patient.date_of_birth ? calculateAge(patient.date_of_birth) : null);
  const ageStr = (ageVal == null || ageVal === '') ? '—' : `${ageVal}Y`;
  const ageGender = `${ageStr} / ${patient.gender || '—'}`;
  const contact = patient.mobile_number || patient.phone || '—';
  const bloodGroup = patient.blood_group || '—';
  const email = patient.email || '—';
  const hasCritical = results.some(r => r.critical_value);

  const Field = ({ label, value, span1 }) => (
    <div style={{ flex: span1 ? '1 1 50%' : '1 1 25%', minWidth: 160, padding: '6px 0' }}>
      <div style={{ fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );

  return (
    <div className="lab-report-page">
      <style>{`
        @media screen {
          .report-sheet { max-width: 920px; margin: 0 auto; background: #fff; padding: 34px 40px 28px;
            box-shadow: 0 10px 36px rgba(15,23,42,.12); border: 1px solid #e2e8f0; border-radius: 10px; }
        }
        @media print {
          .no-print { display: none !important; }
          .report-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
          .lab-report-page { padding: 0 !important; }
        }
        .lr-th th { background: #0f172a !important; color: #fff !important; font-weight: 600 !important; }
      `}</style>

      {/* Toolbar (not printed) */}
      <div className="no-print" style={{ maxWidth: 920, margin: '0 auto 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/lab')}>Back to Orders</Button>
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handlePrint}>Save as PDF</Button>
      </div>

      <div className="report-sheet">
        {/* Hospital letterhead */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 16, borderBottom: '3px solid #0f172a' }}>
          <div style={{ width: 76, height: 76, borderRadius: 12, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: logo ? '#fff' : 'linear-gradient(135deg,#0f172a,#4c1d95)', color: '#fff', fontWeight: 800, fontSize: 26, overflow: 'hidden',
            border: '1px solid #e2e8f0' }}>
            {logo ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 25, fontWeight: 800, color: '#0f172a', letterSpacing: 0.3, lineHeight: 1.1 }}>{hName}</div>
            {hAddress && <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3 }}>{hAddress}</div>}
            {hContact && <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>{hContact}</div>}
            {hExtra && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{hExtra}</div>}
          </div>
          <div style={{ textAlign: 'right', flex: 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', letterSpacing: 1 }}>LABORATORY</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Department of Pathology</div>
          </div>
        </div>

        {/* Title bar */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '10px 18px', borderRadius: 6, marginTop: 18,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, letterSpacing: 1, fontSize: 14 }}>LABORATORY INVESTIGATION REPORT</span>
          <span style={{ fontSize: 12, color: '#c7d2fe' }}>Report No: <strong style={{ color: '#fff' }}>LAB-{String(order.order_id).padStart(6, '0')}</strong></span>
        </div>

        {/* Patient + report meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 16, marginTop: 16, padding: '6px 16px',
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <Field label="Patient Name" value={`${patient.first_name || ''} ${patient.last_name || ''}`.trim() || '—'} />
          <Field label="UHID" value={order.uhid || '—'} />
          <Field label="Age / Gender" value={ageGender} />
          <Field label="Blood Group" value={bloodGroup} />
          <Field label="Contact" value={contact} />
          <Field label="Email" value={email} />
          <Field label="Referred By" value={order.orderedBy?.name || '—'} />
          <Field label="Visit Type" value={order.visit_type || '—'} />
          <Field label="Sample Date" value={order.order_date ? dayjs(order.order_date).format('DD MMM YYYY, HH:mm') : '—'} />
          <Field label="Report Date" value={dayjs().format('DD MMM YYYY, HH:mm')} />
        </div>

        {/* Critical banner */}
        {hasCritical && (
          <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', color: '#b91c1c', fontWeight: 600 }}>
            ⚠️ CRITICAL VALUES DETECTED — please contact the referring physician immediately.
          </div>
        )}

        {/* Results */}
        <div style={{ marginTop: 18 }}>
          <Table
            className="lr-th"
            columns={columns}
            dataSource={results}
            rowKey="result_id"
            pagination={false}
            bordered
            size="middle"
            locale={{ emptyText: 'No results entered yet' }}
          />
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 56 }}>
          <div style={{ width: 220 }}>
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, fontWeight: 600, color: '#0f172a' }}>Lab Technician</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{results[0]?.enteredBy?.name || 'Lab Staff'}</div>
          </div>
          <div style={{ width: 220, textAlign: 'right' }}>
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, fontWeight: 600, color: '#0f172a' }}>Verified By (Pathologist)</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{results[0]?.verifiedBy?.name || '—'}</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: 28, fontSize: 10.5, color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
          <strong>Note:</strong>
          <ul style={{ paddingLeft: 18, margin: '4px 0 0' }}>
            <li>This report is valid only with an authorized signature and hospital stamp.</li>
            <li>Results are based on the sample provided and the testing methodology used.</li>
            <li>For any queries, please contact the laboratory department.</li>
            <li>This is a computer-generated report; a physical signature is not required if digitally verified.</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 10, color: '#94a3b8' }}>
          *** End of Report ***  ·  Generated on {dayjs().format('DD MMM YYYY, HH:mm:ss')}
        </div>
      </div>
    </div>
  );
};

export default LabReport;
