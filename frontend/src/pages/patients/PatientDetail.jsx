import { Card, Descriptions, Tabs, Table, Tag, Space, Avatar, Spin, Row, Col, Statistic, Timeline, Empty, Collapse, Typography, Tooltip } from 'antd';
import {
  UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, CalendarOutlined,
  MedicineBoxOutlined, ExperimentOutlined, CameraOutlined, ScissorOutlined,
  DollarOutlined, FileTextOutlined, HeartOutlined, BankOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useApiQuery } from '@hooks/useApi';
import { calculateAge, formatDate, formatDateTime, formatCurrency } from '@utils/helpers';
import PatientService from '@services/PatientService';
import MedicalHistory from '@components/common/MedicalHistory';
import ClinicalHistory from '@components/common/ClinicalHistory';
import MedicationHistory from '@components/common/MedicationHistory';
import DocumentUpload from '@components/common/DocumentUpload';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const eventColor = {
  appointment: '#1677ff',
  visit: '#13c2c2',
  consultation: '#722ed1',
  prescription: '#52c41a',
  admission: '#fa541c',
  ipd_progress: '#faad14',
  ipd_vital: '#eb2f96',
  ipd_medication: '#52c41a',
  lab_order: '#2f54eb',
  radiology_order: '#0958d9',
  ot_booking: '#cf1322',
  pharmacy_sale: '#389e0d',
  bill: '#d48806'
};

const eventIcon = {
  appointment: <CalendarOutlined />,
  visit: <CalendarOutlined />,
  consultation: <FileTextOutlined />,
  prescription: <MedicineBoxOutlined />,
  admission: <BankOutlined />,
  ipd_progress: <FileTextOutlined />,
  ipd_vital: <HeartOutlined />,
  ipd_medication: <MedicineBoxOutlined />,
  lab_order: <ExperimentOutlined />,
  radiology_order: <CameraOutlined />,
  ot_booking: <ScissorOutlined />,
  pharmacy_sale: <MedicineBoxOutlined />,
  bill: <DollarOutlined />
};

const PatientDetail = () => {
  const { uhid } = useParams();
  const { data, isLoading } = useApiQuery(
    ['patient-timeline', uhid],
    () => PatientService.getTimeline(uhid)
  );

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
  }

  const d = data?.data || {};
  const patient = d.patient || {};
  const stats = d.stats || {};
  const timeline = d.timeline || [];

  const appointmentColumns = [
    { title: 'Date', dataIndex: 'appointment_date', key: 'date', render: (v) => formatDate(v) },
    { title: 'Time', dataIndex: 'appointment_time', key: 'time' },
    { title: 'Doctor', key: 'doctor', render: (_, r) => r.doctor?.name || '—' },
    { title: 'Specialization', key: 'spec', render: (_, r) => r.doctor?.specialization || '—' },
    { title: 'Department', key: 'dept', render: (_, r) => r.department?.department_name || '—' },
    { title: 'Type', dataIndex: 'visit_type', key: 'type' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="blue">{s}</Tag> }
  ];

  const visitColumns = [
    { title: 'Visit Date', dataIndex: 'visit_date', key: 'date', render: (v) => formatDate(v) },
    { title: 'Token', dataIndex: 'token_number', key: 'token' },
    { title: 'Doctor', key: 'doctor', render: (_, r) => r.doctor?.name || '—' },
    { title: 'Department', key: 'dept', render: (_, r) => r.department?.department_name || '—' },
    { title: 'Visit Type', dataIndex: 'visit_type', key: 'type' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="cyan">{s}</Tag> },
    { title: 'Checked-in', dataIndex: 'checked_in_at', key: 'cin', render: (v) => v ? formatDateTime(v) : '—' }
  ];

  const consultationColumns = [
    { title: 'Date', dataIndex: 'consultation_date', key: 'date', render: (v) => formatDateTime(v) },
    { title: 'Doctor', key: 'doctor', render: (_, r) => r.doctor?.name || '—' },
    { title: 'Chief Complaints', dataIndex: 'chief_complaints', key: 'cc', ellipsis: true },
    { title: 'Diagnosis', dataIndex: 'diagnosis_description', key: 'dx', ellipsis: true },
    { title: 'Treatment Plan', dataIndex: 'treatment_plan', key: 'tx', ellipsis: true },
    { title: 'Follow-up', dataIndex: 'follow_up_date', key: 'fu', render: (v) => v ? formatDate(v) : '—' }
  ];

  const prescriptionColumns = [
    { title: 'Date', dataIndex: 'prescribed_at', key: 'date', render: (v, r) => formatDateTime(v || r.createdAt) },
    { title: 'Medicine', key: 'med', render: (_, r) => r.medicine?.medicine_name || r.medicine_name || '—' },
    { title: 'Strength', key: 'str', render: (_, r) => r.medicine?.strength || '—' },
    { title: 'Dosage', dataIndex: 'dosage', key: 'dosage' },
    { title: 'Frequency', dataIndex: 'frequency', key: 'freq' },
    { title: 'Route', dataIndex: 'route', key: 'route' },
    { title: 'Duration', dataIndex: 'duration', key: 'dur' },
    { title: 'Qty', dataIndex: 'quantity', key: 'qty' },
    { title: 'Prescribed By', key: 'doctor', render: (_, r) => r.prescribedBy?.name || '—' },
    { title: 'Instructions', dataIndex: 'instructions', key: 'instr', ellipsis: true }
  ];

  const admissionColumns = [
    { title: 'Admission Date', dataIndex: 'admission_date', key: 'date', render: (v) => formatDateTime(v) },
    { title: 'Doctor', key: 'doctor', render: (_, r) => r.admittingDoctor?.name || '—' },
    { title: 'Department', key: 'dept', render: (_, r) => r.department?.department_name || '—' },
    { title: 'Ward', key: 'ward', render: (_, r) => r.ward?.ward_name || r.ward?.name || '—' },
    { title: 'Bed', key: 'bed', render: (_, r) => r.bed?.bed_number || r.bed_number || '—' },
    { title: 'Room', dataIndex: 'room_number', key: 'room' },
    { title: 'Type', dataIndex: 'admission_type', key: 'type' },
    { title: 'Reason', dataIndex: 'admission_reason', key: 'reason', ellipsis: true },
    { title: 'Diagnosis', dataIndex: 'provisional_diagnosis', key: 'dx', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="orange">{s}</Tag> }
  ];

  const labColumns = [
    { title: 'Order Date', dataIndex: 'order_date', key: 'date', render: (v, r) => formatDateTime(v || r.createdAt) },
    { title: 'Visit Type', dataIndex: 'visit_type', key: 'vt' },
    { title: 'Ordered By', key: 'doc', render: (_, r) => r.orderedBy?.name || '—' },
    { title: 'Tests', key: 'tests', render: (_, r) => (r.details || []).map(d => d.test_name).filter(Boolean).join(', ') || '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="geekblue">{s}</Tag> },
    { title: 'Results', key: 'results', render: (_, r) => (r.results || []).length }
  ];

  const radColumns = [
    { title: 'Order Date', dataIndex: 'order_date', key: 'date', render: (v) => formatDateTime(v) },
    { title: 'Test', dataIndex: 'test_name', key: 'name' },
    { title: 'Modality', dataIndex: 'modality', key: 'mod' },
    { title: 'Ordered By', key: 'doc', render: (_, r) => r.orderedBy?.name || '—' },
    { title: 'Clinical Info', dataIndex: 'clinical_info', key: 'ci', ellipsis: true },
    { title: 'Scheduled', dataIndex: 'scheduled_date', key: 'sd', render: (v) => v ? formatDate(v) : '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="purple">{s}</Tag> },
    { title: 'Reports', key: 'reports', render: (_, r) => (r.reports || []).length }
  ];

  const otColumns = [
    { title: 'Date', dataIndex: 'surgery_date', key: 'date', render: (v) => formatDate(v) },
    { title: 'Time', dataIndex: 'surgery_time', key: 'time' },
    { title: 'Surgery', dataIndex: 'surgery_name', key: 'name' },
    { title: 'Type', dataIndex: 'surgery_type', key: 'type' },
    { title: 'Surgeon', key: 'surgeon', render: (_, r) => r.surgeon?.name || '—' },
    { title: 'Anesthetist', key: 'an', render: (_, r) => r.anesthetist?.name || '—' },
    { title: 'OT Room', key: 'room', render: (_, r) => r.otRoom?.room_name || r.otRoom?.name || '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="red">{s}</Tag> }
  ];

  const billColumns = [
    { title: 'Bill Date', dataIndex: 'bill_date', key: 'date', render: (v) => formatDate(v) },
    { title: 'Bill #', dataIndex: 'bill_number', key: 'no' },
    { title: 'Type', dataIndex: 'bill_type', key: 'type' },
    { title: 'Gross', dataIndex: 'gross_amount', key: 'gross', render: (v) => formatCurrency(v) },
    { title: 'Discount', dataIndex: 'discount_amount', key: 'disc', render: (v) => formatCurrency(v) },
    { title: 'Tax', dataIndex: 'tax_amount', key: 'tax', render: (v) => formatCurrency(v) },
    { title: 'Net', dataIndex: 'net_amount', key: 'net', render: (v) => formatCurrency(v) },
    { title: 'Paid', dataIndex: 'paid_amount', key: 'paid', render: (v) => formatCurrency(v) },
    { title: 'Balance', dataIndex: 'balance_amount', key: 'bal', render: (v) => formatCurrency(v) },
    { title: 'Status', dataIndex: 'payment_status', key: 'st', render: (s) => <Tag color={s === 'Paid' ? 'green' : s === 'Partial' ? 'orange' : 'red'}>{s}</Tag> }
  ];

  const pharmacyColumns = [
    { title: 'Sale Date', dataIndex: 'sale_date', key: 'date', render: (v) => formatDateTime(v) },
    { title: 'Visit Type', dataIndex: 'visit_type', key: 'vt' },
    { title: 'Items', key: 'items', render: (_, r) => (r.details || []).length },
    { title: 'Total', dataIndex: 'total_amount', key: 'tot', render: (v) => formatCurrency(v) },
    { title: 'Discount', dataIndex: 'discount_amount', key: 'disc', render: (v) => formatCurrency(v) },
    { title: 'Tax', dataIndex: 'tax_amount', key: 'tax', render: (v) => formatCurrency(v) },
    { title: 'Net', dataIndex: 'net_amount', key: 'net', render: (v) => formatCurrency(v) },
    { title: 'Payment', dataIndex: 'payment_mode', key: 'pm' }
  ];

  const ipdProgressColumns = [
    { title: 'Date', dataIndex: 'progress_date', key: 'date', render: (v) => formatDate(v) },
    { title: 'Time', dataIndex: 'progress_time', key: 'time' },
    { title: 'Type', dataIndex: 'note_type', key: 'type' },
    { title: 'Doctor Notes', dataIndex: 'doctor_notes', key: 'dn', ellipsis: true },
    { title: 'Nursing Notes', dataIndex: 'nursing_notes', key: 'nn', ellipsis: true }
  ];

  const ipdVitalColumns = [
    { title: 'Date', dataIndex: 'recorded_date', key: 'date', render: (v) => formatDate(v) },
    { title: 'Time', dataIndex: 'recorded_time', key: 'time' },
    { title: 'BP', key: 'bp', render: (_, r) => `${r.systolic_bp || '-'}/${r.diastolic_bp || '-'}` },
    { title: 'Pulse', dataIndex: 'pulse_rate', key: 'pulse' },
    { title: 'Temp', dataIndex: 'temperature', key: 'temp' },
    { title: 'RR', dataIndex: 'respiratory_rate', key: 'rr' },
    { title: 'SpO2', dataIndex: 'spo2', key: 'spo2' },
    { title: 'Sugar', dataIndex: 'blood_sugar', key: 'sugar' },
    { title: 'Pain', dataIndex: 'pain_scale', key: 'pain' },
    { title: 'Intake (ml)', dataIndex: 'intake_ml', key: 'in' },
    { title: 'Output (ml)', dataIndex: 'output_ml', key: 'out' }
  ];

  const ipdMedColumns = [
    { title: 'Start', dataIndex: 'start_date', key: 'sd', render: (v) => formatDateTime(v) },
    { title: 'End', dataIndex: 'end_date', key: 'ed', render: (v) => v ? formatDateTime(v) : '—' },
    { title: 'Medicine', key: 'med', render: (_, r) => r.medicine?.medicine_name || r.medicine_name },
    { title: 'Dosage', dataIndex: 'dosage', key: 'dose' },
    { title: 'Frequency', dataIndex: 'frequency', key: 'freq' },
    { title: 'Route', dataIndex: 'route', key: 'route' },
    { title: 'Duration (days)', dataIndex: 'duration_days', key: 'dur' },
    { title: 'Status', dataIndex: 'status', key: 'st', render: (s) => <Tag color={s === 'Active' ? 'green' : s === 'Stopped' ? 'red' : 'default'}>{s}</Tag> },
    { title: 'Instructions', dataIndex: 'instructions', key: 'instr', ellipsis: true }
  ];

  const renderEventDetail = (e) => {
    const { type, data: ev } = e;
    if (type === 'consultation') {
      return (
        <div>
          {ev.chief_complaints && <div><b>Chief Complaints:</b> {ev.chief_complaints}</div>}
          {ev.examination_findings && <div><b>Examination:</b> {ev.examination_findings}</div>}
          {ev.diagnosis_description && <div><b>Diagnosis:</b> {ev.diagnosis_description}</div>}
          {ev.treatment_plan && <div><b>Treatment Plan:</b> {ev.treatment_plan}</div>}
          {ev.follow_up_date && <div><b>Follow-up:</b> {formatDate(ev.follow_up_date)}</div>}
        </div>
      );
    }
    if (type === 'lab_order') {
      return (
        <div>
          <div><b>Tests:</b> {(ev.details || []).map(d => d.test_name).join(', ')}</div>
          {(ev.results || []).length > 0 && (
            <div style={{ marginTop: 6 }}>
              <b>Results:</b>{' '}
              {(ev.results || []).map(r => (
                <div key={r.result_id} style={{ marginLeft: 12 }}>
                  • {r.test?.test_name || 'Test'} — {r.interpretation || (r.result_data ? JSON.stringify(r.result_data) : '')} {r.critical_value ? <Tag color="red">CRITICAL</Tag> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (type === 'radiology_order') {
      return (
        <div>
          <div><b>Modality:</b> {ev.modality}</div>
          {ev.clinical_info && <div><b>Clinical Info:</b> {ev.clinical_info}</div>}
          {(ev.reports || []).length > 0 && (
            <div style={{ marginTop: 6 }}>
              {(ev.reports || []).map(r => (
                <div key={r.rad_report_id} style={{ marginLeft: 12 }}>
                  <div><b>Findings:</b> {r.findings}</div>
                  <div><b>Impression:</b> {r.impression}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (type === 'prescription') {
      return (
        <div>
          {ev.dosage} • {ev.frequency} • {ev.route} • {ev.duration} • Qty: {ev.quantity}
          {ev.instructions && <div><b>Instructions:</b> {ev.instructions}</div>}
        </div>
      );
    }
    if (type === 'admission') {
      return (
        <div>
          {ev.admission_reason && <div><b>Reason:</b> {ev.admission_reason}</div>}
          {ev.provisional_diagnosis && <div><b>Diagnosis:</b> {ev.provisional_diagnosis}</div>}
          <div><b>Status:</b> {ev.status}</div>
        </div>
      );
    }
    if (type === 'bill') {
      return (
        <div>
          Net: {formatCurrency(ev.net_amount)} • Paid: {formatCurrency(ev.paid_amount)} • Balance: {formatCurrency(ev.balance_amount)}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Header */}
      <Card style={{ borderRadius: 16 }}>
        <Space size="large" align="start">
          <Avatar size={80} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #0a0a0a 100%)' }} />
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0 }}>{patient.first_name} {patient.last_name}</Title>
            <Space style={{ marginTop: 8 }} wrap>
              <Tag color="blue">{patient.uhid}</Tag>
              <Tag>{calculateAge(patient.date_of_birth)}Y / {patient.gender}</Tag>
              {patient.blood_group && <Tag color="red">{patient.blood_group}</Tag>}
              <Tag icon={<PhoneOutlined />}>{patient.mobile_number}</Tag>
              {patient.email && <Tag icon={<MailOutlined />}>{patient.email}</Tag>}
              {patient.city && <Tag icon={<HomeOutlined />}>{patient.city}</Tag>}
            </Space>
          </div>
        </Space>
      </Card>

      {/* Stats summary */}
      <Card style={{ marginTop: 16, borderRadius: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="OPD Visits" value={stats.total_visits || 0} prefix={<CalendarOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Consultations" value={stats.total_consultations || 0} prefix={<FileTextOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Prescriptions" value={stats.total_prescriptions || 0} prefix={<MedicineBoxOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="IPD Admissions" value={stats.total_admissions || 0} prefix={<BankOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Lab Orders" value={stats.total_lab_orders || 0} prefix={<ExperimentOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Radiology" value={stats.total_radiology_orders || 0} prefix={<CameraOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="OT Cases" value={stats.total_ot_bookings || 0} prefix={<ScissorOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Bills" value={stats.total_bills || 0} prefix={<DollarOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Total Billed" value={stats.total_billed || 0} formatter={(v) => formatCurrency(v)} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Total Paid" value={stats.total_paid || 0} formatter={(v) => formatCurrency(v)} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Balance" value={stats.balance || 0} formatter={(v) => formatCurrency(v)} valueStyle={{ color: stats.balance > 0 ? '#cf1322' : '#3f8600' }} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Doctors Seen" value={(stats.unique_doctors || []).length} prefix={<UserOutlined />} /></Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 16, borderRadius: 16 }}>
        <Tabs
          defaultActiveKey="timeline"
          items={[
            {
              key: 'timeline',
              label: 'Timeline (All History)',
              children: timeline.length === 0 ? (
                <Empty description="No history records yet" />
              ) : (
                <Collapse defaultActiveKey={timeline.slice(0, 3).map(t => t.date)} ghost>
                  {timeline.map(day => (
                    <Panel
                      header={<Space><CalendarOutlined /><b>{formatDate(day.date)}</b><Tag>{day.events.length} events</Tag></Space>}
                      key={day.date}
                    >
                      <Timeline
                        items={day.events.map((e, idx) => ({
                          key: `${day.date}-${idx}`,
                          color: eventColor[e.type] || 'gray',
                          dot: eventIcon[e.type],
                          children: (
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                <Tag color={eventColor[e.type]}>{e.type.replace('_', ' ').toUpperCase()}</Tag>
                                {e.summary}
                              </div>
                              <div style={{ marginTop: 4, color: '#475569', fontSize: 13 }}>
                                {renderEventDetail(e)}
                              </div>
                            </div>
                          )
                        }))}
                      />
                    </Panel>
                  ))}
                </Collapse>
              )
            },
            {
              key: 'personal',
              label: 'Personal Info',
              children: (
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Name">{patient.first_name} {patient.last_name}</Descriptions.Item>
                  <Descriptions.Item label="UHID">{patient.uhid}</Descriptions.Item>
                  <Descriptions.Item label="DOB">{formatDate(patient.date_of_birth)}</Descriptions.Item>
                  <Descriptions.Item label="Age">{calculateAge(patient.date_of_birth)}</Descriptions.Item>
                  <Descriptions.Item label="Gender">{patient.gender}</Descriptions.Item>
                  <Descriptions.Item label="Blood Group">{patient.blood_group}</Descriptions.Item>
                  <Descriptions.Item label="Mobile">{patient.mobile_number}</Descriptions.Item>
                  <Descriptions.Item label="Alt Mobile">{patient.alternate_mobile || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Email">{patient.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Marital Status">{patient.marital_status || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Address" span={2}>{patient.address_line1} {patient.address_line2 ? ', ' + patient.address_line2 : ''} {patient.city ? ', ' + patient.city : ''} {patient.state ? ', ' + patient.state : ''} {patient.pincode ? ' - ' + patient.pincode : ''}</Descriptions.Item>
                  <Descriptions.Item label="Emergency Contact">{patient.emergency_contact_name || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Emergency Number">{patient.emergency_contact_number || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Insurance">{patient.insurance_status ? `Yes — ${patient.insurance_provider || ''}` : 'No'}</Descriptions.Item>
                  <Descriptions.Item label="Policy Number">{patient.policy_number || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Aadhaar">{patient.aadhaar_number || '—'}</Descriptions.Item>
                  <Descriptions.Item label="ABHA">{patient.abha_id || '—'}</Descriptions.Item>
                </Descriptions>
              )
            },
            {
              key: 'appointments',
              label: `Appointments (${(d.appointments || []).length})`,
              children: <Table columns={appointmentColumns} dataSource={d.appointments || []} rowKey="appointment_id" size="small" scroll={{ x: 1100 }} />
            },
            {
              key: 'visits',
              label: `OPD Visits (${(d.visits || []).length})`,
              children: <Table columns={visitColumns} dataSource={d.visits || []} rowKey="visit_id" size="small" scroll={{ x: 1100 }} />
            },
            {
              key: 'consultations',
              label: `Consultations (${(d.consultations || []).length})`,
              children: <Table columns={consultationColumns} dataSource={d.consultations || []} rowKey="consultation_id" size="small" scroll={{ x: 1200 }} expandable={{
                expandedRowRender: (r) => (
                  <div style={{ padding: 12, background: '#fafafa' }}>
                    <Row gutter={16}>
                      <Col span={12}><b>Clinical Notes:</b><div>{r.clinical_notes || '—'}</div></Col>
                      <Col span={12}><b>Examination:</b><div>{r.examination_findings || '—'}</div></Col>
                      <Col span={12} style={{ marginTop: 8 }}><b>Follow-up Instructions:</b><div>{r.follow_up_instructions || '—'}</div></Col>
                    </Row>
                  </div>
                )
              }} />
            },
            {
              key: 'prescriptions',
              label: `Prescriptions (${(d.prescriptions || []).length})`,
              children: <Table columns={prescriptionColumns} dataSource={d.prescriptions || []} rowKey="prescription_id" size="small" scroll={{ x: 1400 }} />
            },
            {
              key: 'admissions',
              label: `IPD Admissions (${(d.admissions || []).length})`,
              children: <Table columns={admissionColumns} dataSource={d.admissions || []} rowKey="admission_id" size="small" scroll={{ x: 1400 }} />
            },
            {
              key: 'ipd_progress',
              label: `IPD Progress (${(d.ipdProgress || []).length})`,
              children: <Table columns={ipdProgressColumns} dataSource={d.ipdProgress || []} rowKey="progress_id" size="small" />
            },
            {
              key: 'ipd_vitals',
              label: `IPD Vitals (${(d.ipdVitals || []).length})`,
              children: <Table columns={ipdVitalColumns} dataSource={d.ipdVitals || []} rowKey="vital_id" size="small" scroll={{ x: 1100 }} />
            },
            {
              key: 'ipd_medications',
              label: `IPD Medications (${(d.ipdMedications || []).length})`,
              children: <Table columns={ipdMedColumns} dataSource={d.ipdMedications || []} rowKey="medication_id" size="small" scroll={{ x: 1300 }} />
            },
            {
              key: 'lab',
              label: `Lab Orders (${(d.labOrders || []).length})`,
              children: <Table columns={labColumns} dataSource={d.labOrders || []} rowKey="order_id" size="small" scroll={{ x: 1200 }} expandable={{
                expandedRowRender: (r) => (
                  <div style={{ padding: 12, background: '#fafafa' }}>
                    <b>Tests:</b>
                    <ul>
                      {(r.details || []).map(d => (
                        <li key={d.detail_id}>{d.test_name} ({d.test_code || '—'}) — {d.sample_type || '—'} — <Tag>{d.status}</Tag></li>
                      ))}
                    </ul>
                    <b>Results:</b>
                    {(r.results || []).length === 0 ? <div>No results yet</div> : (
                      <ul>
                        {(r.results || []).map(res => (
                          <li key={res.result_id}>
                            {res.test?.test_name || 'Test'} — Status: <Tag>{res.status}</Tag>
                            {res.interpretation && <div>Interpretation: {res.interpretation}</div>}
                            {res.result_data && <div>Data: <code>{JSON.stringify(res.result_data)}</code></div>}
                            {res.critical_value && <Tag color="red">CRITICAL</Tag>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              }} />
            },
            {
              key: 'radiology',
              label: `Radiology (${(d.radiologyOrders || []).length})`,
              children: <Table columns={radColumns} dataSource={d.radiologyOrders || []} rowKey="rad_order_id" size="small" scroll={{ x: 1300 }} expandable={{
                expandedRowRender: (r) => (
                  <div style={{ padding: 12, background: '#fafafa' }}>
                    {(r.reports || []).length === 0 ? <div>No reports yet</div> : (
                      (r.reports || []).map(rep => (
                        <div key={rep.rad_report_id}>
                          <b>Findings:</b> {rep.findings}<br />
                          <b>Impression:</b> {rep.impression}<br />
                          <b>Status:</b> <Tag>{rep.status}</Tag>
                        </div>
                      ))
                    )}
                  </div>
                )
              }} />
            },
            {
              key: 'ot',
              label: `OT Bookings (${(d.otBookings || []).length})`,
              children: <Table columns={otColumns} dataSource={d.otBookings || []} rowKey="booking_id" size="small" scroll={{ x: 1300 }} />
            },
            {
              key: 'pharmacy',
              label: `Pharmacy Sales (${(d.pharmacySales || []).length})`,
              children: <Table columns={pharmacyColumns} dataSource={d.pharmacySales || []} rowKey="sale_id" size="small" scroll={{ x: 1100 }} expandable={{
                expandedRowRender: (r) => (
                  <div style={{ padding: 12, background: '#fafafa' }}>
                    <b>Items:</b>
                    <ul>
                      {(r.details || []).map(it => (
                        <li key={it.detail_id || it.sale_detail_id}>{it.medicine_name || it.medicine?.medicine_name} × {it.quantity} = {formatCurrency(it.amount || it.total_amount)}</li>
                      ))}
                    </ul>
                  </div>
                )
              }} />
            },
            {
              key: 'bills',
              label: `Bills (${(d.bills || []).length})`,
              children: <Table columns={billColumns} dataSource={d.bills || []} rowKey="bill_id" size="small" scroll={{ x: 1300 }} />
            },
            {
              key: 'medical_history',
              label: 'Medical History',
              children: <MedicalHistory patientUhid={uhid} initialData={patient.medical_history} />
            },
            {
              key: 'clinical_history',
              label: 'Clinical History',
              children: <ClinicalHistory patientUhid={uhid} />
            },
            {
              key: 'medication_history',
              label: 'Medication History',
              children: <MedicationHistory patientUhid={uhid} />
            },
            {
              key: 'documents',
              label: 'Documents',
              children: <DocumentUpload entityType="patient" entityId={uhid} />
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default PatientDetail;
