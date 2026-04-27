import { Card, Descriptions, Tabs, Table, Tag, Space, Avatar, Spin } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useApiQuery } from '@hooks/useApi';
import { calculateAge, formatDate } from '@utils/helpers';
import PatientService from '@services/PatientService';
import OpdAppointmentService from '@services/OpdAppointmentService';
import IpdAdmissionService from '@services/IpdAdmissionService';
import MedicalHistory from '@components/common/MedicalHistory';
import ClinicalHistory from '@components/common/ClinicalHistory';
import MedicationHistory from '@components/common/MedicationHistory';
import DocumentUpload from '@components/common/DocumentUpload';

const PatientDetail = () => {
  const { uhid } = useParams();
  const { data: patientData, isLoading: patientLoading } = useApiQuery(['patient', uhid], () => PatientService.getByUhid(uhid));
  const { data: appointmentData, isLoading: appointmentLoading } = useApiQuery(['opd-appointments', uhid], () => OpdAppointmentService.getByPatient(uhid));
  const { data: admissionData, isLoading: admissionLoading } = useApiQuery(['ipd-admissions', uhid], () => IpdAdmissionService.getByPatient(uhid));
  
  const patient = patientData?.data || {};
  const appointments = appointmentData?.data || [];
  const admissions = admissionData?.data || [];

  const appointmentColumns = [
    { title: 'Date', dataIndex: 'appointment_date', key: 'date', render: (date) => formatDate(date) },
    { title: 'Doctor', key: 'doctor', render: (_, r) => r.doctor?.name || r.doctor_name || '—' },
    { title: 'Type', dataIndex: 'visit_type', key: 'type' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="blue">{s}</Tag> }
  ];

  const admissionColumns = [
    { title: 'Admission Date', dataIndex: 'admission_date', key: 'date', render: (date) => formatDate(date) },
    { title: 'Doctor', key: 'doctor', render: (_, r) => r.admittingDoctor?.name || r.doctor_name || '—' },
    { title: 'Ward', key: 'ward', render: (_, r) => r.ward?.ward_name || r.ward_name || '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="green">{s}</Tag> }
  ];

  return (
    <div>
      <Card style={{ borderRadius: 16 }}>
        <Space size="large">
          <Avatar size={80} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #0a0a0a 100%)' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{patient.first_name} {patient.last_name}</h2>
            <Space style={{ marginTop: 8 }}>
              <Tag color="blue">{patient.uhid}</Tag>
              <Tag>{calculateAge(patient.date_of_birth)}Y / {patient.gender}</Tag>
              <Tag color="red">{patient.blood_group}</Tag>
            </Space>
          </div>
        </Space>
      </Card>

      <Card style={{ marginTop: 16, borderRadius: 16 }}>
        <Tabs items={[
          {
            key: '1',
            label: 'Personal Info',
            children: (
              <Descriptions bordered column={2}>
                <Descriptions.Item label={<Space><PhoneOutlined />Mobile</Space>}>{patient.mobile_number}</Descriptions.Item>
                <Descriptions.Item label={<Space><MailOutlined />Email</Space>}>{patient.email || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Date of Birth">{formatDate(patient.date_of_birth)}</Descriptions.Item>
                <Descriptions.Item label="Blood Group">{patient.blood_group}</Descriptions.Item>
                <Descriptions.Item label={<Space><HomeOutlined />Address</Space>} span={2}>
                  {patient.address_line1}, {patient.city}
                </Descriptions.Item>
              </Descriptions>
            )
          },
          {
            key: '2',
            label: 'OPD History',
            children: <Table columns={appointmentColumns} dataSource={appointments} rowKey="appointment_id" pagination={false} />
          },
          {
            key: '3',
            label: 'IPD History',
            children: <Table columns={admissionColumns} dataSource={admissions} rowKey="admission_id" pagination={false} />
          },
          {
            key: '4',
            label: 'Medical History',
            children: <MedicalHistory patientUhid={uhid} initialData={patient.medical_history} />
          },
          {
            key: '5',
            label: 'Clinical History',
            children: <ClinicalHistory patientUhid={uhid} />
          },
          {
            key: '6',
            label: 'Medication History',
            children: <MedicationHistory patientUhid={uhid} />
          },
          {
            key: '7',
            label: 'Documents',
            children: <DocumentUpload entityType="patient" entityId={uhid} />
          }
        ]} />
      </Card>
    </div>
  );
};

export default PatientDetail;
