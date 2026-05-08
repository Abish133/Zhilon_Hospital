import { Drawer, Empty, Tag, Space, Typography, Button, Card, Descriptions, Divider } from 'antd';
import {
  CalendarOutlined, FileTextOutlined, MedicineBoxOutlined, BankOutlined,
  HeartOutlined, ExperimentOutlined, CameraOutlined, ScissorOutlined,
  DollarOutlined, ArrowRightOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime, formatCurrency } from '@utils/helpers';

const { Title, Text } = Typography;

const TYPE_META = {
  appointment:     { label: 'OPD Appointment',  color: '#1677ff', icon: <CalendarOutlined /> },
  visit:           { label: 'OPD Visit',        color: '#13c2c2', icon: <CalendarOutlined /> },
  consultation:    { label: 'Consultation',     color: '#722ed1', icon: <FileTextOutlined /> },
  prescription:    { label: 'Prescription',     color: '#52c41a', icon: <MedicineBoxOutlined /> },
  admission:       { label: 'IPD Admission',    color: '#fa541c', icon: <BankOutlined /> },
  ipd_progress:    { label: 'IPD Progress',     color: '#faad14', icon: <FileTextOutlined /> },
  ipd_vital:       { label: 'IPD Vitals',       color: '#eb2f96', icon: <HeartOutlined /> },
  ipd_medication:  { label: 'IPD Medication',   color: '#52c41a', icon: <MedicineBoxOutlined /> },
  lab_order:       { label: 'Lab Order',        color: '#2f54eb', icon: <ExperimentOutlined /> },
  radiology_order: { label: 'Radiology Order',  color: '#0958d9', icon: <CameraOutlined /> },
  ot_booking:      { label: 'OT Booking',       color: '#cf1322', icon: <ScissorOutlined /> },
  pharmacy_sale:   { label: 'Pharmacy Sale',    color: '#389e0d', icon: <MedicineBoxOutlined /> },
  bill:            { label: 'Bill',             color: '#d48806', icon: <DollarOutlined /> },
  doctor_leave:    { label: 'Leave',            color: '#8c8c8c', icon: <ClockCircleOutlined /> },
  doctor_schedule: { label: 'Schedule',         color: '#1677ff', icon: <ClockCircleOutlined /> }
};

const SECTION_ORDER = [
  'appointment', 'visit', 'consultation', 'prescription',
  'admission', 'ipd_progress', 'ipd_vital', 'ipd_medication',
  'lab_order', 'radiology_order', 'ot_booking',
  'pharmacy_sale', 'bill', 'doctor_schedule', 'doctor_leave'
];

const fmtTime = (d) => {
  if (!d) return '';
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// Render the data-specific body for a single event. Kept narrow on purpose —
// summary line already states what happened; this fills in the clinically
// useful detail without dumping the whole record.
const EventBody = ({ type, ev }) => {
  switch (type) {
    case 'consultation':
      return (
        <Descriptions size="small" column={1} bordered={false}>
          {ev.chief_complaints && <Descriptions.Item label="Chief Complaints">{ev.chief_complaints}</Descriptions.Item>}
          {ev.examination_findings && <Descriptions.Item label="Examination">{ev.examination_findings}</Descriptions.Item>}
          {ev.diagnosis_description && <Descriptions.Item label="Diagnosis">{ev.diagnosis_description}</Descriptions.Item>}
          {ev.treatment_plan && <Descriptions.Item label="Treatment Plan">{ev.treatment_plan}</Descriptions.Item>}
          {ev.follow_up_date && <Descriptions.Item label="Follow-up">{formatDate(ev.follow_up_date)}</Descriptions.Item>}
        </Descriptions>
      );
    case 'prescription':
      return (
        <Space wrap>
          {ev.dosage && <Tag>Dosage: {ev.dosage}</Tag>}
          {ev.frequency && <Tag>Frequency: {ev.frequency}</Tag>}
          {ev.route && <Tag>Route: {ev.route}</Tag>}
          {ev.duration && <Tag>Duration: {ev.duration}</Tag>}
          {ev.quantity != null && <Tag>Qty: {ev.quantity}</Tag>}
          {ev.instructions && <div style={{ width: '100%', marginTop: 4 }}><Text type="secondary">{ev.instructions}</Text></div>}
        </Space>
      );
    case 'admission':
      return (
        <Descriptions size="small" column={2} bordered={false}>
          {ev.admission_type && <Descriptions.Item label="Type">{ev.admission_type}</Descriptions.Item>}
          {ev.status && <Descriptions.Item label="Status"><Tag color="orange">{ev.status}</Tag></Descriptions.Item>}
          {ev.ward?.ward_name && <Descriptions.Item label="Ward">{ev.ward.ward_name}</Descriptions.Item>}
          {ev.bed?.bed_number && <Descriptions.Item label="Bed">{ev.bed.bed_number}</Descriptions.Item>}
          {ev.admission_reason && <Descriptions.Item label="Reason" span={2}>{ev.admission_reason}</Descriptions.Item>}
          {ev.provisional_diagnosis && <Descriptions.Item label="Diagnosis" span={2}>{ev.provisional_diagnosis}</Descriptions.Item>}
        </Descriptions>
      );
    case 'ipd_progress':
      return (
        <Descriptions size="small" column={1} bordered={false}>
          {ev.note_type && <Descriptions.Item label="Type">{ev.note_type}</Descriptions.Item>}
          {ev.doctor_notes && <Descriptions.Item label="Doctor Notes">{ev.doctor_notes}</Descriptions.Item>}
          {ev.nursing_notes && <Descriptions.Item label="Nursing Notes">{ev.nursing_notes}</Descriptions.Item>}
        </Descriptions>
      );
    case 'ipd_vital':
      return (
        <Space wrap>
          <Tag color="magenta">BP {ev.systolic_bp || '-'}/{ev.diastolic_bp || '-'}</Tag>
          <Tag>Pulse {ev.pulse_rate || '-'}</Tag>
          <Tag>Temp {ev.temperature || '-'}</Tag>
          <Tag>RR {ev.respiratory_rate || '-'}</Tag>
          <Tag>SpO2 {ev.spo2 || '-'}</Tag>
          {ev.blood_sugar != null && <Tag>Sugar {ev.blood_sugar}</Tag>}
          {ev.pain_scale != null && <Tag>Pain {ev.pain_scale}/10</Tag>}
        </Space>
      );
    case 'ipd_medication':
      return (
        <Space wrap>
          <Tag>{ev.dosage}</Tag>
          <Tag>{ev.frequency}</Tag>
          <Tag>{ev.route}</Tag>
          {ev.duration_days && <Tag>{ev.duration_days} days</Tag>}
          {ev.status && <Tag color={ev.status === 'Active' ? 'green' : 'red'}>{ev.status}</Tag>}
        </Space>
      );
    case 'lab_order':
      return (
        <div>
          <div><Text strong>Tests:</Text> {(ev.details || []).map(d => d.test_name).filter(Boolean).join(', ') || '—'}</div>
          {(ev.results || []).length > 0 && (
            <div style={{ marginTop: 6 }}>
              <Text strong>Results:</Text>
              <ul style={{ marginTop: 4, marginBottom: 0 }}>
                {(ev.results || []).map(r => (
                  <li key={r.result_id}>
                    {r.test?.test_name || 'Test'} — {r.interpretation || '—'}
                    {r.critical_value ? <Tag color="red" style={{ marginLeft: 6 }}>CRITICAL</Tag> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    case 'radiology_order':
      return (
        <div>
          <Space wrap>
            {ev.modality && <Tag>{ev.modality}</Tag>}
            {ev.test_name && <Tag color="blue">{ev.test_name}</Tag>}
          </Space>
          {ev.clinical_info && <div style={{ marginTop: 4 }}><Text type="secondary">{ev.clinical_info}</Text></div>}
          {(ev.reports || []).length > 0 && (
            <div style={{ marginTop: 6 }}>
              {(ev.reports || []).map(r => (
                <div key={r.rad_report_id} style={{ marginTop: 4 }}>
                  <div><Text strong>Findings:</Text> {r.findings || '—'}</div>
                  <div><Text strong>Impression:</Text> {r.impression || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case 'ot_booking':
      return (
        <Descriptions size="small" column={2} bordered={false}>
          {ev.surgery_name && <Descriptions.Item label="Surgery">{ev.surgery_name}</Descriptions.Item>}
          {ev.surgery_type && <Descriptions.Item label="Type">{ev.surgery_type}</Descriptions.Item>}
          {ev.surgeon?.name && <Descriptions.Item label="Surgeon">{ev.surgeon.name}</Descriptions.Item>}
          {ev.anesthetist?.name && <Descriptions.Item label="Anesthetist">{ev.anesthetist.name}</Descriptions.Item>}
          {(ev.otRoom?.room_name || ev.otRoom?.name) && <Descriptions.Item label="OT Room">{ev.otRoom.room_name || ev.otRoom.name}</Descriptions.Item>}
          {ev.status && <Descriptions.Item label="Status"><Tag color="red">{ev.status}</Tag></Descriptions.Item>}
        </Descriptions>
      );
    case 'pharmacy_sale':
      return (
        <div>
          <Space wrap>
            <Tag>{(ev.details || []).length} items</Tag>
            <Tag color="green">Net: {formatCurrency(ev.net_amount)}</Tag>
            {ev.payment_mode && <Tag>{ev.payment_mode}</Tag>}
          </Space>
        </div>
      );
    case 'bill':
      return (
        <Space wrap>
          {ev.bill_number && <Tag color="gold">#{ev.bill_number}</Tag>}
          {ev.bill_type && <Tag>{ev.bill_type}</Tag>}
          <Tag>Net: {formatCurrency(ev.net_amount)}</Tag>
          <Tag color="green">Paid: {formatCurrency(ev.paid_amount)}</Tag>
          {Number(ev.balance_amount) > 0 && <Tag color="red">Balance: {formatCurrency(ev.balance_amount)}</Tag>}
          <Tag color={ev.payment_status === 'Paid' ? 'green' : ev.payment_status === 'Partial' ? 'orange' : 'red'}>{ev.payment_status}</Tag>
        </Space>
      );
    case 'doctor_schedule':
      return (
        <Space wrap>
          {ev.day_of_week && <Tag>{ev.day_of_week}</Tag>}
          {ev.start_time && <Tag>From: {ev.start_time}</Tag>}
          {ev.end_time && <Tag>To: {ev.end_time}</Tag>}
          {ev.location && <Tag>{ev.location}</Tag>}
        </Space>
      );
    case 'doctor_leave':
      return (
        <Space wrap>
          {ev.leave_type && <Tag color="default">{ev.leave_type}</Tag>}
          {ev.from_date && <Tag>From: {formatDate(ev.from_date)}</Tag>}
          {ev.to_date && <Tag>To: {formatDate(ev.to_date)}</Tag>}
          {ev.status && <Tag color={ev.status === 'Approved' ? 'green' : ev.status === 'Rejected' ? 'red' : 'orange'}>{ev.status}</Tag>}
          {ev.reason && <div style={{ width: '100%', marginTop: 4 }}><Text type="secondary">{ev.reason}</Text></div>}
        </Space>
      );
    default:
      return null;
  }
};

const DayDrillDownDrawer = ({ open, onClose, date, title, subtitle, events = [] }) => {
  const navigate = useNavigate();

  // Group events by type, preserving the curated section order so the drawer
  // reads top-down: appointments → visits → consultations → orders → bills.
  const grouped = {};
  for (const e of events) {
    const t = e.type || 'other';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(e);
  }
  const sections = SECTION_ORDER
    .filter(t => grouped[t]?.length)
    .map(t => ({ type: t, items: grouped[t] }));
  // Append any unknown-type buckets at the end so we never silently drop events.
  for (const t of Object.keys(grouped)) {
    if (!SECTION_ORDER.includes(t)) sections.push({ type: t, items: grouped[t] });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={Math.min(720, typeof window !== 'undefined' ? window.innerWidth - 40 : 720)}
      destroyOnClose
      title={
        <div>
          <Title level={5} style={{ margin: 0 }}>{title || 'Day Drill-Down'}</Title>
          <Space size={8} style={{ marginTop: 4 }}>
            <CalendarOutlined />
            <Text strong>{date ? formatDate(date) : '—'}</Text>
            {subtitle && <Text type="secondary">• {subtitle}</Text>}
            <Tag color="blue">{events.length} events</Tag>
          </Space>
        </div>
      }
    >
      {events.length === 0 ? (
        <Empty description="No activity on this day" />
      ) : (
        sections.map(({ type, items }, idx) => {
          const meta = TYPE_META[type] || { label: type, color: '#666', icon: <FileTextOutlined /> };
          return (
            <div key={type}>
              {idx > 0 && <Divider style={{ margin: '12px 0' }} />}
              <Space style={{ marginBottom: 8 }}>
                <span style={{ color: meta.color, fontSize: 16 }}>{meta.icon}</span>
                <Text strong>{meta.label}</Text>
                <Tag>{items.length}</Tag>
              </Space>
              {items.map((e, i) => (
                <Card
                  key={`${type}-${i}`}
                  size="small"
                  style={{ marginBottom: 8, borderLeft: `3px solid ${meta.color}` }}
                  bodyStyle={{ padding: 12 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{e.summary || meta.label}</div>
                      {fmtTime(e.timestamp || e.date) && (
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>
                          <ClockCircleOutlined /> {fmtTime(e.timestamp || e.date)}
                        </div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <EventBody type={type} ev={e.data || {}} />
                      </div>
                    </div>
                    {e.navigate?.path && (
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<ArrowRightOutlined />}
                        onClick={() => {
                          onClose?.();
                          navigate(e.navigate.path);
                        }}
                      >
                        {e.navigate.label || 'Open'}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          );
        })
      )}
    </Drawer>
  );
};

export default DayDrillDownDrawer;
