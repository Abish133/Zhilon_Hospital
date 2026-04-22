import { Card, Timeline, Table, Tag, Spin, Empty, Tabs, Descriptions } from 'antd';
import { useState, useEffect } from 'react';
import { 
  MedicineBoxOutlined, 
  ExperimentOutlined, 
  FileTextOutlined,
  CameraOutlined,
  HeartOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { 
  opdConsultationService,
  opdPrescriptionService,
  labOrderService,
  radiologyOrderService,
  patientService
} from '@/services';
import { formatDate } from '@utils/helpers';

const MedicalHistory = ({ patientUhid }) => {
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [radiologyOrders, setRadiologyOrders] = useState([]);

  useEffect(() => {
    if (patientUhid) {
      fetchMedicalHistory();
    }
  }, [patientUhid]);

  const fetchMedicalHistory = async () => {
    setLoading(true);
    try {
      // Get patient details
      const patientsRes = await patientService.getAll();
      const foundPatient = patientsRes.data?.find(p => p.uhid === patientUhid);
      setPatient(foundPatient);

      if (foundPatient) {
        // Fetch all medical data
        try {
          const [consultRes, prescRes, labRes, radRes] = await Promise.all([
            opdConsultationService.getByPatientId(foundPatient.patient_id).catch(() => ({ data: [] })),
            opdPrescriptionService.getByPatientId(foundPatient.patient_id).catch(() => ({ data: [] })),
            labOrderService.getByPatientId(foundPatient.patient_id).catch(() => ({ data: [] })),
            radiologyOrderService.getByPatientId(foundPatient.patient_id).catch(() => ({ data: [] }))
          ]);

          setConsultations(consultRes.data || []);
          setPrescriptions(prescRes.data || []);
          setLabOrders(labRes.data || []);
          setRadiologyOrders(radRes.data || []);
        } catch (error) {
          // Set empty arrays if API calls fail
          setConsultations([]);
          setPrescriptions([]);
          setLabOrders([]);
          setRadiologyOrders([]);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const consultationColumns = [
    {
      title: 'Date',
      dataIndex: 'consultation_date',
      render: (date) => formatDate(date)
    },
    {
      title: 'Doctor',
      dataIndex: 'doctor_name'
    },
    {
      title: 'Chief Complaints',
      dataIndex: 'chief_complaints',
      ellipsis: true
    },
    {
      title: 'Examination',
      dataIndex: 'examination_findings',
      ellipsis: true
    },
    {
      title: 'Diagnosis',
      key: 'diagnosis',
      render: (_, record) => (
        <div>
          {record.diagnosis_code && <Tag color="blue">{record.diagnosis_code}</Tag>}
          {record.diagnosis_description && (
            <div style={{ fontSize: 12, marginTop: 4 }}>{record.diagnosis_description}</div>
          )}
        </div>
      )
    },
    {
      title: 'Treatment',
      dataIndex: 'treatment_plan',
      ellipsis: true
    }
  ];

  const prescriptionColumns = [
    {
      title: 'Date',
      dataIndex: 'prescribed_at',
      render: (date) => formatDate(date)
    },
    {
      title: 'Medicine',
      dataIndex: 'medicine_name'
    },
    {
      title: 'Dosage',
      dataIndex: 'dosage'
    },
    {
      title: 'Duration',
      dataIndex: 'duration'
    },
    {
      title: 'Doctor',
      dataIndex: 'prescribed_by_name'
    }
  ];

  const labColumns = [
    {
      title: 'Date',
      dataIndex: 'order_date',
      render: (date) => formatDate(date)
    },
    {
      title: 'Test Name',
      dataIndex: 'test_name'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'Completed' ? 'green' : status === 'In Progress' ? 'orange' : 'blue'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Ordered By',
      dataIndex: 'ordered_by_name'
    }
  ];

  const radiologyColumns = [
    {
      title: 'Date',
      dataIndex: 'order_date',
      render: (date) => formatDate(date)
    },
    {
      title: 'Test Name',
      dataIndex: 'test_name'
    },
    {
      title: 'Modality',
      dataIndex: 'modality',
      render: (modality) => <Tag color="purple">{modality}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'Completed' ? 'green' : status === 'In Progress' ? 'orange' : 'blue'}>
          {status}
        </Tag>
      )
    }
  ];

  const createTimeline = () => {
    const allEvents = [
      ...consultations.map(c => ({ ...c, type: 'consultation', date: c.consultation_date })),
      ...prescriptions.map(p => ({ ...p, type: 'prescription', date: p.prescribed_at })),
      ...labOrders.map(l => ({ ...l, type: 'lab', date: l.order_date })),
      ...radiologyOrders.map(r => ({ ...r, type: 'radiology', date: r.order_date }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return allEvents.map((event, index) => {
      let icon, color, content;
      
      switch (event.type) {
        case 'consultation':
          icon = <FileTextOutlined />;
          color = 'blue';
          content = (
            <div>
              <strong>Consultation - {event.doctor_name}</strong>
              <div>Chief Complaints: {event.chief_complaints}</div>
              {event.examination_findings && <div>Examination: {event.examination_findings}</div>}
              {event.diagnosis_code && <div>Diagnosis: {event.diagnosis_code}</div>}
              {event.diagnosis_description && <div>Description: {event.diagnosis_description}</div>}
              {event.treatment_plan && <div>Treatment: {event.treatment_plan}</div>}
              {event.follow_up_date && <div>Follow-up: {formatDate(event.follow_up_date)}</div>}
            </div>
          );
          break;
        case 'prescription':
          icon = <MedicineBoxOutlined />;
          color = 'green';
          content = (
            <div>
              <strong>Prescription - {event.medicine_name}</strong>
              <div>{event.dosage} - {event.frequency} for {event.duration}</div>
            </div>
          );
          break;
        case 'lab':
          icon = <ExperimentOutlined />;
          color = 'orange';
          content = (
            <div>
              <strong>Lab Test - {event.test_name}</strong>
              <div>Status: {event.status}</div>
            </div>
          );
          break;
        case 'radiology':
          icon = <CameraOutlined />;
          color = 'purple';
          content = (
            <div>
              <strong>Radiology - {event.test_name}</strong>
              <div>{event.modality} - Status: {event.status}</div>
            </div>
          );
          break;
      }

      return {
        dot: icon,
        color,
        children: (
          <div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              {formatDate(event.date)}
            </div>
            {content}
          </div>
        )
      };
    });
  };

  if (loading) {
    return (
      <Card title="Medical History">
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const timelineItems = createTimeline();

  return (
    <Card title={<><HeartOutlined /> Medical History</>}>
      <Tabs items={[
        {
          key: '1',
          label: <><CalendarOutlined /> Timeline</>,
          children: (
            timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <Empty description="No medical history found" />
            )
          )
        },
        {
          key: '2',
          label: <><FileTextOutlined /> Consultations</>,
          children: (
            <Table 
              columns={consultationColumns} 
              dataSource={consultations} 
              rowKey="consultation_id"
              pagination={false}
              size="small"
            />
          )
        },
        {
          key: '3',
          label: <><MedicineBoxOutlined /> Prescriptions</>,
          children: (
            <Table 
              columns={prescriptionColumns} 
              dataSource={prescriptions} 
              rowKey="prescription_id"
              pagination={false}
              size="small"
            />
          )
        },
        {
          key: '4',
          label: <><ExperimentOutlined /> Lab Tests</>,
          children: (
            <Table 
              columns={labColumns} 
              dataSource={labOrders} 
              rowKey="order_id"
              pagination={false}
              size="small"
            />
          )
        },
        {
          key: '5',
          label: <><CameraOutlined /> Radiology</>,
          children: (
            <Table 
              columns={radiologyColumns} 
              dataSource={radiologyOrders} 
              rowKey="order_id"
              pagination={false}
              size="small"
            />
          )
        }
      ]} />
    </Card>
  );
};

export default MedicalHistory;
