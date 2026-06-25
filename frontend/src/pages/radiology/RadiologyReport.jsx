import { useState, useEffect } from 'react';
import { Button, Space, Spin, message, Form, Input, Select } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { useParams, useNavigate } from 'react-router-dom';
import { PrinterOutlined, DownloadOutlined, EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { radiologyOrderService, radiologyReportService, doctorService, hospitalService, patientService } from '@services';
import { useAuthStore } from '@store';
import { calculateAge } from '@utils/helpers';
import apiClient from '@config/api';
import dayjs from 'dayjs';

// Logos live on the backend origin (not under /api). Build an absolute URL
// for a stored relative path like "/uploads/logos/logo-x.png".
const ASSET_BASE = (apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '');
const toLogoUrl = (u) => !u ? null : (/^https?:/i.test(u) ? u : `${ASSET_BASE}${u.startsWith('/') ? '' : '/'}${u}`);

const RadiologyReport = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [report, setReport] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [patientFull, setPatientFull] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => { fetchData(); }, [orderId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const orderRes = await radiologyOrderService.getById(orderId);
      const orderData = orderRes.data?.data || orderRes.data;
      setOrder(orderData);

      try {
        const reportRes = await radiologyReportService.getByOrderId(orderId);
        const reportData = reportRes.data?.data || reportRes.data;
        setReport(Array.isArray(reportData) ? reportData[0] : reportData);
      } catch { setReport(null); }

      // Hospital branding for the letterhead.
      if (user?.hospital_id) {
        try {
          const hRes = await hospitalService.getById(user.hospital_id);
          if (hRes?.success) setHospital(hRes.data);
          else if (hRes?.data) setHospital(hRes.data?.data || hRes.data);
        } catch { /* fall back to order.hospital */ }
      }

      // Full patient demographics (age/gender/blood group/contact).
      const uhid = orderData?.uhid;
      if (uhid) {
        try {
          const pRes = await patientService.getByUHID(uhid);
          if (pRes?.success) setPatientFull(pRes.data);
          else if (pRes?.data) setPatientFull(pRes.data?.data || pRes.data);
        } catch { /* fall back to order.patient */ }
      }
    } catch {
      message.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const response = await doctorService.getAll();
      const doctorsList = response.data?.data || response.data || [];
      setDoctors(doctorsList);
      form.setFieldsValue({ reported_by: user?.id });
      setModalOpen(true);
    } catch {
      form.resetFields();
      setModalOpen(true);
    }
  };

  const handleSubmitReport = async () => {
    try {
      const values = await form.validateFields();
      await radiologyReportService.create({
        rad_order_id: parseInt(orderId),
        findings: values.findings,
        impression: values.impression,
        reported_by: values.reported_by,
        reported_at: new Date().toISOString(),
        hospital_id: user?.hospital_id
      });
      await radiologyOrderService.update(orderId, { status: 'Reported' });
      message.success('Report created successfully');
      form.resetFields();
      setModalOpen(false);
      fetchData();
    } catch {
      message.error('Failed to create report');
    }
  };

  if (loading && !order) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }
  if (!order) return null;

  // Hospital fields with graceful fallbacks.
  const h = hospital || order.hospital || {};
  const hName = h.hospitalName || order.hospital?.hospitalName || 'Hospital';
  const hAddress = h.address || '';
  const hContact = [h.phone ? `Phone: ${h.phone}` : null, (h.hospitalEmail || h.email) ? `Email: ${h.hospitalEmail || h.email}` : null]
    .filter(Boolean).join('   |   ');
  const hExtra = [h.website || null, h.registration_number ? `Reg. No: ${h.registration_number}` : null].filter(Boolean).join('   |   ');
  const logo = toLogoUrl(h.logo_url);
  const initials = hName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const patient = { ...(order.patient || {}), ...(patientFull || {}) };
  const ageVal = patient.age != null ? patient.age : (patient.date_of_birth ? calculateAge(patient.date_of_birth) : null);
  const ageStr = (ageVal == null || ageVal === '') ? '—' : `${ageVal}Y`;
  const ageGender = `${ageStr} / ${patient.gender || '—'}`;
  const contact = patient.mobile_number || patient.phone || '—';
  const bloodGroup = patient.blood_group || '—';
  const email = patient.email || '—';
  const radiologist = report?.reportedBy?.name || report?.radiologist_name || '—';
  const studyDate = order.scheduled_date
    ? `${dayjs(order.scheduled_date).format('DD MMM YYYY')}${order.scheduled_time ? ', ' + order.scheduled_time.slice(0, 5) : ''}`
    : (order.order_date ? dayjs(order.order_date).format('DD MMM YYYY, HH:mm') : '—');

  const Field = ({ label, value }) => (
    <div style={{ flex: '1 1 25%', minWidth: 160, padding: '6px 0' }}>
      <div style={{ fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );

  const Section = ({ label, text }) => (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: '#0f172a', textTransform: 'uppercase',
        borderBottom: '2px solid #0f172a', paddingBottom: 6, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {text || <span style={{ color: '#94a3b8' }}>Not recorded</span>}
      </div>
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
      `}</style>

      {/* Toolbar (not printed) */}
      <div className="no-print" style={{ maxWidth: 920, margin: '0 auto 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/radiology')}>Back to Orders</Button>
        {!report && order?.status === 'Completed' && (
          <Button icon={<EditOutlined />} type="primary" onClick={handleCreateReport}>Create Report</Button>
        )}
        {report && (
          <>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => window.print()}>Save as PDF</Button>
          </>
        )}
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
            <div style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', letterSpacing: 1 }}>RADIOLOGY</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Department of Radiology &amp; Imaging</div>
          </div>
        </div>

        {/* Title bar */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '10px 18px', borderRadius: 6, marginTop: 18,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, letterSpacing: 1, fontSize: 14 }}>RADIOLOGY INVESTIGATION REPORT</span>
          <span style={{ fontSize: 12, color: '#c7d2fe' }}>Report No: <strong style={{ color: '#fff' }}>RAD-{String(order.rad_order_id).padStart(6, '0')}</strong></span>
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
          <Field label="Study" value={order.test_name || '—'} />
          <Field label="Modality" value={order.modality || '—'} />
          <Field label="Room" value={order.room || '—'} />
          <Field label="Study Date" value={studyDate} />
          <Field label="Report Date" value={report?.reported_at ? dayjs(report.reported_at).format('DD MMM YYYY, HH:mm') : dayjs().format('DD MMM YYYY, HH:mm')} />
        </div>

        {/* Clinical indication */}
        {order.clinical_info && (
          <div style={{ marginTop: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#92400e' }}>Clinical Indication: </span>
            <span style={{ fontSize: 13, color: '#78350f' }}>{order.clinical_info}</span>
          </div>
        )}

        {/* Narrative report */}
        <Section label="Findings" text={report?.findings} />
        <Section label="Impression" text={report?.impression} />

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 56 }}>
          <div style={{ width: 240, textAlign: 'right' }}>
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, fontWeight: 600, color: '#0f172a' }}>Reported &amp; Verified By</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{radiologist !== '—' ? `Dr. ${radiologist}` : '—'} (Radiologist)</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: 28, fontSize: 10.5, color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
          <strong>Note:</strong>
          <ul style={{ paddingLeft: 18, margin: '4px 0 0' }}>
            <li>This report is valid only with an authorized signature and hospital stamp.</li>
            <li>Findings are based on the images acquired and the imaging technique used.</li>
            <li>Clinical correlation is recommended. For queries, contact the radiology department.</li>
            <li>This is a computer-generated report; a physical signature is not required if digitally verified.</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 10, color: '#94a3b8' }}>
          *** End of Report ***  ·  Generated on {dayjs().format('DD MMM YYYY, HH:mm:ss')}
        </div>
      </div>

      <SliderModal
        title="Create Radiology Report"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSubmitReport}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="reported_by" label="Radiologist" rules={[{ required: true, message: 'Please select radiologist' }]}>
            <Select placeholder="Select radiologist" showSearch optionFilterProp="children">
              {doctors.map(doc => (
                <Select.Option key={doc.id} value={doc.id}>
                  Dr. {doc.name}{doc.specialization ? ` - ${doc.specialization}` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="findings" label="Findings" rules={[{ required: true, message: 'Please enter findings' }]}>
            <Input.TextArea rows={6} placeholder="Enter detailed findings..." />
          </Form.Item>
          <Form.Item name="impression" label="Impression" rules={[{ required: true, message: 'Please enter impression' }]}>
            <Input.TextArea rows={4} placeholder="Enter clinical impression..." />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default RadiologyReport;
