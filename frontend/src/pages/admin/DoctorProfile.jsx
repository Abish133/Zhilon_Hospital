import { Card, Tabs, Table, Tag, Space, Avatar, Spin, Row, Col, Statistic, Descriptions, Empty, Typography, Button } from 'antd';
import {
  UserOutlined, MedicineBoxOutlined, ExperimentOutlined, CameraOutlined,
  ScissorOutlined, CalendarOutlined, FileTextOutlined, BankOutlined,
  ArrowLeftOutlined, IdcardOutlined, MailOutlined, PhoneOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiQuery } from '@hooks/useApi';
import { formatDate, formatDateTime, calculateAge } from '@utils/helpers';
import doctorService from '@services/DoctorService';

const { Title, Text } = Typography;

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useApiQuery(
    ['doctor-profile', id],
    () => doctorService.getProfile(id)
  );

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
  }

  const d = data?.data || {};
  const doctor = d.doctor || {};
  const stats = d.stats || {};

  // Bucket every record this doctor produced by patient_id, so each patient row
  // can expand to show exactly what THIS doctor did for that patient.
  const byPatient = {};
  const ensure = (pid) => {
    if (!pid) return null;
    if (!byPatient[pid]) {
      byPatient[pid] = {
        consultations: [],
        prescriptions: [],
        admissions: [],
        labOrders: [],
        radiologyOrders: [],
        otAsSurgeon: [],
        otAsAssistant: [],
        otAsAnesthetist: [],
        appointments: []
      };
    }
    return byPatient[pid];
  };
  for (const r of (d.appointments || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.appointments.push(r); }
  for (const r of (d.consultations || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.consultations.push(r); }
  for (const r of (d.prescriptions || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.prescriptions.push(r); }
  for (const r of (d.admissions || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.admissions.push(r); }
  for (const r of (d.labOrders || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.labOrders.push(r); }
  for (const r of (d.radiologyOrders || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.radiologyOrders.push(r); }
  for (const r of (d.otAsSurgeon || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.otAsSurgeon.push(r); }
  for (const r of (d.otAsAssistant || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.otAsAssistant.push(r); }
  for (const r of (d.otAsAnesthetist || [])) { const b = ensure(r.patient?.patient_id || r.patient_id); if (b) b.otAsAnesthetist.push(r); }

  const patientHandledColumns = [
    { title: 'UHID', dataIndex: 'uhid', key: 'uhid', render: (v) => <Tag color="blue">{v}</Tag> },
    {
      title: 'Patient',
      key: 'name',
      render: (_, r) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/patients/${r.uhid}`)}>
          {r.first_name} {r.last_name}
        </Button>
      )
    },
    { title: 'Gender', dataIndex: 'gender', key: 'g' },
    { title: 'Age', key: 'age', render: (_, r) => r.date_of_birth ? `${calculateAge(r.date_of_birth)}Y` : '—' },
    { title: 'Mobile', dataIndex: 'mobile_number', key: 'mob' },
    { title: 'Visits', dataIndex: 'visit_count', key: 'vc' },
    { title: 'Last Seen', dataIndex: 'last_seen', key: 'ls', render: (v) => v ? formatDate(v) : '—' },
    { title: 'Sources', dataIndex: 'sources', key: 'src', render: (v) => (v || []).map(s => <Tag key={s}>{s}</Tag>) }
  ];

  const appointmentColumns = [
    { title: 'Date', dataIndex: 'appointment_date', key: 'date', render: (v) => formatDate(v) },
    { title: 'Time', dataIndex: 'appointment_time', key: 'time' },
    { title: 'Patient', key: 'patient', render: (_, r) => r.patient ? <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/patients/${r.patient.uhid}`)}>{r.patient.first_name} {r.patient.last_name}</Button> : '—' },
    { title: 'UHID', key: 'uhid', render: (_, r) => r.patient?.uhid || '—' },
    { title: 'Department', key: 'dept', render: (_, r) => r.department?.department_name || '—' },
    { title: 'Type', dataIndex: 'visit_type', key: 't' },
    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="blue">{s}</Tag> }
  ];

  const consultationColumns = [
    { title: 'Date', dataIndex: 'consultation_date', key: 'date', render: (v) => formatDateTime(v) },
    { title: 'Patient', key: 'p', render: (_, r) => r.patient ? <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/patients/${r.patient.uhid}`)}>{r.patient.first_name} {r.patient.last_name}</Button> : '—' },
    { title: 'UHID', key: 'uhid', render: (_, r) => r.patient?.uhid || '—' },
    { title: 'Chief Complaints', dataIndex: 'chief_complaints', key: 'cc', ellipsis: true },
    { title: 'Diagnosis', dataIndex: 'diagnosis_description', key: 'dx', ellipsis: true },
    { title: 'Treatment Plan', dataIndex: 'treatment_plan', key: 'tx', ellipsis: true },
    { title: 'Follow-up', dataIndex: 'follow_up_date', key: 'fu', render: (v) => v ? formatDate(v) : '—' }
  ];

  const prescriptionColumns = [
    { title: 'Date', dataIndex: 'prescribed_at', key: 'date', render: (v, r) => formatDateTime(v || r.createdAt) },
    { title: 'Patient', key: 'p', render: (_, r) => r.patient ? <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/patients/${r.patient.uhid}`)}>{r.patient.first_name} {r.patient.last_name}</Button> : '—' },
    { title: 'UHID', key: 'uhid', render: (_, r) => r.patient?.uhid || '—' },
    { title: 'Medicine', key: 'med', render: (_, r) => r.medicine?.medicine_name || r.medicine_name || '—' },
    { title: 'Dosage', dataIndex: 'dosage', key: 'd' },
    { title: 'Frequency', dataIndex: 'frequency', key: 'f' },
    { title: 'Route', dataIndex: 'route', key: 'r' },
    { title: 'Duration', dataIndex: 'duration', key: 'dur' },
    { title: 'Qty', dataIndex: 'quantity', key: 'q' },
    { title: 'Instructions', dataIndex: 'instructions', key: 'instr', ellipsis: true }
  ];

  const admissionColumns = [
    { title: 'Date', dataIndex: 'admission_date', key: 'date', render: (v) => formatDateTime(v) },
    { title: 'Patient', key: 'p', render: (_, r) => r.patient ? <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/patients/${r.patient.uhid}`)}>{r.patient.first_name} {r.patient.last_name}</Button> : '—' },
    { title: 'UHID', key: 'uhid', render: (_, r) => r.patient?.uhid || '—' },
    { title: 'Type', dataIndex: 'admission_type', key: 't' },
    { title: 'Reason', dataIndex: 'admission_reason', key: 'rn', ellipsis: true },
    { title: 'Diagnosis', dataIndex: 'provisional_diagnosis', key: 'dx', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="orange">{s}</Tag> }
  ];

  const labOrderColumns = [
    { title: 'Date', dataIndex: 'order_date', key: 'date', render: (v, r) => formatDateTime(v || r.createdAt) },
    { title: 'Patient', key: 'p', render: (_, r) => r.patient ? <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/patients/${r.patient.uhid}`)}>{r.patient.first_name} {r.patient.last_name}</Button> : '—' },
    { title: 'UHID', key: 'uhid', render: (_, r) => r.patient?.uhid || '—' },
    { title: 'Tests', key: 'tests', render: (_, r) => (r.details || []).map(d => d.test_name).filter(Boolean).join(', ') || '—' },
    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="geekblue">{s}</Tag> }
  ];

  const radColumns = [
    { title: 'Date', dataIndex: 'order_date', key: 'date', render: (v) => formatDateTime(v) },
    { title: 'Patient', key: 'p', render: (_, r) => r.patient ? <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/patients/${r.patient.uhid}`)}>{r.patient.first_name} {r.patient.last_name}</Button> : '—' },
    { title: 'UHID', key: 'uhid', render: (_, r) => r.patient?.uhid || '—' },
    { title: 'Test', dataIndex: 'test_name', key: 't' },
    { title: 'Modality', dataIndex: 'modality', key: 'm' },
    { title: 'Clinical Info', dataIndex: 'clinical_info', key: 'ci', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="purple">{s}</Tag> }
  ];

  const otColumns = [
    { title: 'Date', dataIndex: 'surgery_date', key: 'date', render: (v) => formatDate(v) },
    { title: 'Time', dataIndex: 'surgery_time', key: 'time' },
    { title: 'Patient', key: 'p', render: (_, r) => r.patient ? <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/patients/${r.patient.uhid}`)}>{r.patient.first_name} {r.patient.last_name}</Button> : '—' },
    { title: 'Surgery', dataIndex: 'surgery_name', key: 'n' },
    { title: 'Type', dataIndex: 'surgery_type', key: 't' },
    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="red">{s}</Tag> }
  ];

  const scheduleColumns = [
    { title: 'Day', dataIndex: 'day_of_week', key: 'd' },
    { title: 'Start', dataIndex: 'start_time', key: 's' },
    { title: 'End', dataIndex: 'end_time', key: 'e' },
    { title: 'Slot Duration', dataIndex: 'slot_duration', key: 'sd' },
    { title: 'Max Patients', dataIndex: 'max_patients', key: 'mp' },
    { title: 'Active', dataIndex: 'is_active', key: 'a', render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag> }
  ];

  const qualificationColumns = [
    { title: 'Degree', dataIndex: 'degree', key: 'd' },
    { title: 'Specialization', dataIndex: 'specialization', key: 's' },
    { title: 'Institute', dataIndex: 'institute', key: 'i' },
    { title: 'Year', dataIndex: 'year_of_completion', key: 'y' },
    { title: 'Country', dataIndex: 'country', key: 'c' }
  ];

  const leaveColumns = [
    { title: 'From', dataIndex: 'from_date', key: 'f', render: (v) => formatDate(v) },
    { title: 'To', dataIndex: 'to_date', key: 't', render: (v) => formatDate(v) },
    { title: 'Type', dataIndex: 'leave_type', key: 'tp' },
    { title: 'Reason', dataIndex: 'reason', key: 'r', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color={s === 'Approved' ? 'green' : s === 'Rejected' ? 'red' : 'orange'}>{s}</Tag> }
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Back</Button>

      {/* Header */}
      <Card style={{ borderRadius: 16 }}>
        <Space size="large" align="start">
          <Avatar size={80} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)' }} />
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0 }}>Dr. {doctor.name}</Title>
            <Space style={{ marginTop: 8 }} wrap>
              <Tag color="blue" icon={<MedicineBoxOutlined />}>{doctor.specialization}</Tag>
              <Tag icon={<IdcardOutlined />}>{doctor.registration_number}</Tag>
              {doctor.email && <Tag icon={<MailOutlined />}>{doctor.email}</Tag>}
              {doctor.phone && <Tag icon={<PhoneOutlined />}>{doctor.phone}</Tag>}
              {doctor.experience != null && <Tag>{doctor.experience} years exp.</Tag>}
              {doctor.department && <Tag color="cyan">{doctor.department.department_name}</Tag>}
              <Tag color={doctor.is_active ? 'green' : 'red'}>{doctor.is_active ? 'Active' : 'Inactive'}</Tag>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Stats summary */}
      <Card style={{ marginTop: 16, borderRadius: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Patients Handled" value={stats.unique_patients || 0} prefix={<UserOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Appointments" value={stats.total_appointments || 0} prefix={<CalendarOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Consultations" value={stats.total_consultations || 0} prefix={<FileTextOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Prescriptions" value={stats.total_prescriptions || 0} prefix={<MedicineBoxOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Admissions" value={stats.total_admissions || 0} prefix={<BankOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Lab Orders" value={stats.total_lab_orders || 0} prefix={<ExperimentOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Radiology Orders" value={stats.total_radiology_orders || 0} prefix={<CameraOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Surgeries" value={stats.total_surgeries || 0} prefix={<ScissorOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Assisted" value={stats.total_assisted || 0} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Anesthesia" value={stats.total_anesthesia || 0} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Upcoming" value={stats.upcoming_appointments || 0} prefix={<ClockCircleOutlined />} /></Col>
          <Col xs={12} sm={8} md={6} lg={4}><Statistic title="Completed" value={stats.completed_appointments || 0} /></Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 16, borderRadius: 16 }}>
        <Tabs
          defaultActiveKey="patients"
          items={[
            {
              key: 'patients',
              label: `Patients Handled (${(d.patientsHandled || []).length})`,
              children: (d.patientsHandled || []).length === 0
                ? <Empty />
                : (
                  <Table
                    columns={patientHandledColumns}
                    dataSource={d.patientsHandled || []}
                    rowKey={(r) => r.patient_id || r.uhid}
                    size="small"
                    scroll={{ x: 1100 }}
                    expandable={{
                      expandedRowRender: (row) => {
                        const b = byPatient[row.patient_id] || {};
                        const sectionStyle = { marginBottom: 12 };
                        const empty = !b.consultations?.length && !b.prescriptions?.length
                          && !b.labOrders?.length && !b.radiologyOrders?.length
                          && !b.admissions?.length && !b.otAsSurgeon?.length
                          && !b.otAsAssistant?.length && !b.otAsAnesthetist?.length;
                        if (empty) {
                          return <div style={{ padding: 12 }}><Empty description="No clinical activity recorded for this patient by this doctor" /></div>;
                        }
                        return (
                          <div style={{ padding: 12, background: '#fafafa' }}>
                            {(b.consultations || []).length > 0 && (
                              <div style={sectionStyle}>
                                <Title level={5} style={{ marginBottom: 8 }}><FileTextOutlined /> Consultations & Diagnoses ({b.consultations.length})</Title>
                                {b.consultations.map(c => (
                                  <Card key={c.consultation_id} size="small" style={{ marginBottom: 8 }}>
                                    <div><b>{formatDateTime(c.consultation_date)}</b></div>
                                    {c.chief_complaints && <div><b>Chief Complaints:</b> {c.chief_complaints}</div>}
                                    {c.examination_findings && <div><b>Examination:</b> {c.examination_findings}</div>}
                                    {c.diagnosis_description && <div><b>Diagnosis:</b> {c.diagnosis_description} {c.diagnosis_code ? <Tag>{c.diagnosis_code}</Tag> : null}</div>}
                                    {c.clinical_notes && <div><b>Clinical Notes:</b> {c.clinical_notes}</div>}
                                    {c.treatment_plan && <div><b>Treatment Plan:</b> {c.treatment_plan}</div>}
                                    {c.follow_up_date && <div><b>Follow-up:</b> {formatDate(c.follow_up_date)} — {c.follow_up_instructions || ''}</div>}
                                  </Card>
                                ))}
                              </div>
                            )}

                            {(b.prescriptions || []).length > 0 && (
                              <div style={sectionStyle}>
                                <Title level={5} style={{ marginBottom: 8 }}><MedicineBoxOutlined /> Prescriptions / Medicines ({b.prescriptions.length})</Title>
                                <Table
                                  size="small"
                                  pagination={false}
                                  dataSource={b.prescriptions}
                                  rowKey="prescription_id"
                                  columns={[
                                    { title: 'Date', dataIndex: 'prescribed_at', key: 'date', render: (v, r) => formatDateTime(v || r.createdAt) },
                                    { title: 'Medicine', key: 'med', render: (_, r) => r.medicine?.medicine_name || r.medicine_name || '—' },
                                    { title: 'Strength', key: 'str', render: (_, r) => r.medicine?.strength || '—' },
                                    { title: 'Dosage', dataIndex: 'dosage', key: 'd' },
                                    { title: 'Frequency', dataIndex: 'frequency', key: 'f' },
                                    { title: 'Route', dataIndex: 'route', key: 'r' },
                                    { title: 'Duration', dataIndex: 'duration', key: 'dur' },
                                    { title: 'Qty', dataIndex: 'quantity', key: 'q' },
                                    { title: 'Instructions', dataIndex: 'instructions', key: 'instr', ellipsis: true }
                                  ]}
                                />
                              </div>
                            )}

                            {(b.labOrders || []).length > 0 && (
                              <div style={sectionStyle}>
                                <Title level={5} style={{ marginBottom: 8 }}><ExperimentOutlined /> Lab Tests Ordered ({b.labOrders.length})</Title>
                                <Table
                                  size="small"
                                  pagination={false}
                                  dataSource={b.labOrders}
                                  rowKey="order_id"
                                  columns={[
                                    { title: 'Date', dataIndex: 'order_date', key: 'date', render: (v, r) => formatDateTime(v || r.createdAt) },
                                    { title: 'Visit Type', dataIndex: 'visit_type', key: 'vt' },
                                    { title: 'Tests', key: 'tests', render: (_, r) => (r.details || []).map(d => d.test_name).filter(Boolean).join(', ') || '—' },
                                    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="geekblue">{s}</Tag> }
                                  ]}
                                />
                              </div>
                            )}

                            {(b.radiologyOrders || []).length > 0 && (
                              <div style={sectionStyle}>
                                <Title level={5} style={{ marginBottom: 8 }}><CameraOutlined /> Radiology / Imaging ({b.radiologyOrders.length})</Title>
                                <Table
                                  size="small"
                                  pagination={false}
                                  dataSource={b.radiologyOrders}
                                  rowKey="rad_order_id"
                                  columns={[
                                    { title: 'Date', dataIndex: 'order_date', key: 'date', render: (v) => formatDateTime(v) },
                                    { title: 'Test', dataIndex: 'test_name', key: 't' },
                                    { title: 'Modality', dataIndex: 'modality', key: 'm' },
                                    { title: 'Clinical Info', dataIndex: 'clinical_info', key: 'ci', ellipsis: true },
                                    { title: 'Scheduled', dataIndex: 'scheduled_date', key: 'sd', render: (v) => v ? formatDate(v) : '—' },
                                    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="purple">{s}</Tag> }
                                  ]}
                                />
                              </div>
                            )}

                            {(b.admissions || []).length > 0 && (
                              <div style={sectionStyle}>
                                <Title level={5} style={{ marginBottom: 8 }}><BankOutlined /> IPD Admissions ({b.admissions.length})</Title>
                                <Table
                                  size="small"
                                  pagination={false}
                                  dataSource={b.admissions}
                                  rowKey="admission_id"
                                  columns={[
                                    { title: 'Date', dataIndex: 'admission_date', key: 'd', render: (v) => formatDateTime(v) },
                                    { title: 'Type', dataIndex: 'admission_type', key: 't' },
                                    { title: 'Reason', dataIndex: 'admission_reason', key: 'rn', ellipsis: true },
                                    { title: 'Diagnosis', dataIndex: 'provisional_diagnosis', key: 'dx', ellipsis: true },
                                    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="orange">{s}</Tag> }
                                  ]}
                                />
                              </div>
                            )}

                            {(b.otAsSurgeon || []).length > 0 && (
                              <div style={sectionStyle}>
                                <Title level={5} style={{ marginBottom: 8 }}><ScissorOutlined /> Surgeries Performed ({b.otAsSurgeon.length})</Title>
                                <Table
                                  size="small"
                                  pagination={false}
                                  dataSource={b.otAsSurgeon}
                                  rowKey="booking_id"
                                  columns={[
                                    { title: 'Date', dataIndex: 'surgery_date', key: 'd', render: (v) => formatDate(v) },
                                    { title: 'Time', dataIndex: 'surgery_time', key: 't' },
                                    { title: 'Surgery', dataIndex: 'surgery_name', key: 'n' },
                                    { title: 'Type', dataIndex: 'surgery_type', key: 'tp' },
                                    { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag color="red">{s}</Tag> }
                                  ]}
                                />
                              </div>
                            )}

                            {(b.otAsAssistant || []).length > 0 && (
                              <div style={sectionStyle}>
                                <Title level={5} style={{ marginBottom: 8 }}>Assisted in Surgery ({b.otAsAssistant.length})</Title>
                                <Table size="small" pagination={false} dataSource={b.otAsAssistant} rowKey="booking_id" columns={[
                                  { title: 'Date', dataIndex: 'surgery_date', key: 'd', render: (v) => formatDate(v) },
                                  { title: 'Surgery', dataIndex: 'surgery_name', key: 'n' },
                                  { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag>{s}</Tag> }
                                ]} />
                              </div>
                            )}

                            {(b.otAsAnesthetist || []).length > 0 && (
                              <div style={sectionStyle}>
                                <Title level={5} style={{ marginBottom: 8 }}>Anesthesia Given ({b.otAsAnesthetist.length})</Title>
                                <Table size="small" pagination={false} dataSource={b.otAsAnesthetist} rowKey="booking_id" columns={[
                                  { title: 'Date', dataIndex: 'surgery_date', key: 'd', render: (v) => formatDate(v) },
                                  { title: 'Surgery', dataIndex: 'surgery_name', key: 'n' },
                                  { title: 'Status', dataIndex: 'status', key: 's', render: (s) => <Tag>{s}</Tag> }
                                ]} />
                              </div>
                            )}

                            <div style={{ marginTop: 12 }}>
                              <Button type="link" onClick={() => navigate(`/patients/${row.uhid}`)}>
                                Open full patient timeline →
                              </Button>
                            </div>
                          </div>
                        );
                      }
                    }}
                  />
                )
            },
            {
              key: 'profile',
              label: 'Profile Details',
              children: (
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Name">{doctor.name}</Descriptions.Item>
                  <Descriptions.Item label="Specialization">{doctor.specialization}</Descriptions.Item>
                  <Descriptions.Item label="Registration #">{doctor.registration_number}</Descriptions.Item>
                  <Descriptions.Item label="Experience">{doctor.experience != null ? `${doctor.experience} years` : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Email">{doctor.email}</Descriptions.Item>
                  <Descriptions.Item label="Phone">{doctor.phone || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Department">{doctor.department?.department_name || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Hospital">{doctor.hospital?.hospitalName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={doctor.is_active ? 'green' : 'red'}>{doctor.is_active ? 'Active' : 'Inactive'}</Tag>
                  </Descriptions.Item>
                  {doctor.employee && (
                    <Descriptions.Item label="Linked Employee">{doctor.employee.full_name} ({doctor.employee.emp_code})</Descriptions.Item>
                  )}
                </Descriptions>
              )
            },
            {
              key: 'appointments',
              label: `Appointments (${(d.appointments || []).length})`,
              children: <Table columns={appointmentColumns} dataSource={d.appointments || []} rowKey="appointment_id" size="small" scroll={{ x: 1200 }} />
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
              children: <Table columns={admissionColumns} dataSource={d.admissions || []} rowKey="admission_id" size="small" scroll={{ x: 1200 }} />
            },
            {
              key: 'lab_orders',
              label: `Lab Orders (${(d.labOrders || []).length})`,
              children: <Table columns={labOrderColumns} dataSource={d.labOrders || []} rowKey="order_id" size="small" scroll={{ x: 1100 }} />
            },
            {
              key: 'radiology',
              label: `Radiology Orders (${(d.radiologyOrders || []).length})`,
              children: <Table columns={radColumns} dataSource={d.radiologyOrders || []} rowKey="rad_order_id" size="small" scroll={{ x: 1100 }} />
            },
            {
              key: 'surgeries',
              label: `Surgeries (${(d.otAsSurgeon || []).length})`,
              children: <Table columns={otColumns} dataSource={d.otAsSurgeon || []} rowKey="booking_id" size="small" scroll={{ x: 1000 }} />
            },
            {
              key: 'assisted',
              label: `Assisted (${(d.otAsAssistant || []).length})`,
              children: <Table columns={otColumns} dataSource={d.otAsAssistant || []} rowKey="booking_id" size="small" scroll={{ x: 1000 }} />
            },
            {
              key: 'anesthesia',
              label: `Anesthesia (${(d.otAsAnesthetist || []).length})`,
              children: <Table columns={otColumns} dataSource={d.otAsAnesthetist || []} rowKey="booking_id" size="small" scroll={{ x: 1000 }} />
            },
            {
              key: 'schedule',
              label: `Schedule (${(d.schedules || []).length})`,
              children: <Table columns={scheduleColumns} dataSource={d.schedules || []} rowKey={(r) => r.schedule_id} size="small" />
            },
            {
              key: 'qualifications',
              label: `Qualifications (${(d.qualifications || []).length})`,
              children: <Table columns={qualificationColumns} dataSource={d.qualifications || []} rowKey={(r) => r.qualification_id || r.id} size="small" />
            },
            {
              key: 'leaves',
              label: `Leaves (${(d.leaves || []).length})`,
              children: <Table columns={leaveColumns} dataSource={d.leaves || []} rowKey={(r) => r.leave_id} size="small" />
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default DoctorProfile;
