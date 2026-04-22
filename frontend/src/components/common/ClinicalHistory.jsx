import { Card, Timeline, Table, Tag, Spin, Empty, Tabs, Descriptions, Row, Col } from 'antd';
import { useState, useEffect } from 'react';
import { 
  HeartOutlined,
  CalendarOutlined,
  FileTextOutlined,
  AlertOutlined,
  MedicineBoxOutlined,
  UserOutlined
} from '@ant-design/icons';
import { 
  opdConsultationService,
  opdVitalService,
  patientService
} from '@/services';
import { formatDate } from '@utils/helpers';

const ClinicalHistory = ({ patientUhid }) => {
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [vitals, setVitals] = useState([]);

  useEffect(() => {
    if (patientUhid) {
      fetchClinicalHistory();
    }
  }, [patientUhid]);

  const fetchClinicalHistory = async () => {
    setLoading(true);
    try {
      const patientsRes = await patientService.getAll();
      const foundPatient = patientsRes.data?.find(p => p.uhid === patientUhid);
      setPatient(foundPatient);

      if (foundPatient) {
        try {
          const [consultRes, vitalsRes] = await Promise.all([
            opdConsultationService.getByPatientId(foundPatient.patient_id).catch(() => ({ data: [] })),
            opdVitalService.getByPatientId(foundPatient.patient_id).catch(() => ({ data: [] }))
          ]);

          setConsultations(consultRes.data || []);
          setVitals(vitalsRes.data || []);
        } catch (error) {
          setConsultations([]);
          setVitals([]);
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
      title: 'Examination Findings',
      dataIndex: 'examination_findings',
      ellipsis: true
    },
    {
      title: 'Diagnosis',
      key: 'diagnosis',
      render: (_, record) => (
        <div>
          {record.diagnosis_code && <Tag color="blue">{record.diagnosis_code}</Tag>}
          <div style={{ fontSize: 12, marginTop: 4 }}>{record.diagnosis_description}</div>
        </div>
      )
    },
    {
      title: 'Treatment Plan',
      dataIndex: 'treatment_plan',
      ellipsis: true
    },
    {
      title: 'Follow-up',
      key: 'followup',
      render: (_, record) => (
        <div>
          {record.follow_up_date && <div>{formatDate(record.follow_up_date)}</div>}
          <div style={{ fontSize: 12, color: '#666' }}>{record.follow_up_instructions}</div>
        </div>
      )
    }
  ];

  const vitalsColumns = [
    {
      title: 'Date',
      dataIndex: 'recorded_at',
      render: (date) => formatDate(date)
    },
    {
      title: 'BP',
      key: 'bp',
      render: (_, record) => `${record.systolic_bp}/${record.diastolic_bp}`
    },
    {
      title: 'Pulse',
      dataIndex: 'pulse_rate',
      render: (rate) => `${rate} bpm`
    },
    {
      title: 'Temp',
      dataIndex: 'temperature',
      render: (temp) => `${temp}°F`
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      render: (weight) => `${weight} kg`
    },
    {
      title: 'Height',
      dataIndex: 'height',
      render: (height) => `${height} cm`
    },
    {
      title: 'BMI',
      key: 'bmi',
      render: (_, record) => {
        if (record.weight && record.height) {
          const bmi = (record.weight / ((record.height / 100) ** 2)).toFixed(1);
          return bmi;
        }
        return 'N/A';
      }
    }
  ];

  const createClinicalTimeline = () => {
    const allEvents = [
      ...consultations.map(c => ({ ...c, type: 'consultation', date: c.consultation_date })),
      ...vitals.map(v => ({ ...v, type: 'vitals', date: v.recorded_at }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return allEvents.map((event) => {
      let icon, color, content;
      
      switch (event.type) {
        case 'consultation':
          icon = <FileTextOutlined />;
          color = 'blue';
          content = (
            <div>
              <strong>Clinical Consultation - {event.doctor_name}</strong>
              <div><strong>Chief Complaints:</strong> {event.chief_complaints}</div>
              <div><strong>Clinical Notes:</strong> {event.clinical_notes}</div>
              {event.examination_findings && <div><strong>Examination:</strong> {event.examination_findings}</div>}
              {event.diagnosis_code && <div><strong>Diagnosis:</strong> {event.diagnosis_code}</div>}
              {event.diagnosis_description && <div><strong>Description:</strong> {event.diagnosis_description}</div>}
              {event.treatment_plan && <div><strong>Treatment:</strong> {event.treatment_plan}</div>}
              {event.follow_up_date && <div><strong>Follow-up:</strong> {formatDate(event.follow_up_date)}</div>}
            </div>
          );
          break;
        case 'vitals':
          icon = <HeartOutlined />;
          color = 'red';
          const bmi = event.weight && event.height ? 
            (event.weight / ((event.height / 100) ** 2)).toFixed(1) : 'N/A';
          content = (
            <div>
              <strong>Vital Signs Recorded</strong>
              <div>BP: {event.systolic_bp}/{event.diastolic_bp} mmHg</div>
              <div>Pulse: {event.pulse_rate} bpm, Temp: {event.temperature}°F</div>
              <div>Weight: {event.weight} kg, Height: {event.height} cm, BMI: {bmi}</div>
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

  const getLatestVitals = () => {
    if (vitals.length === 0) return null;
    return vitals.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0];
  };

  const getClinicalSummary = () => {
    const latestVitals = getLatestVitals();
    const recentConsultations = consultations.slice(0, 3);
    
    return (
      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="Latest Vitals" style={{ marginBottom: 16 }}>
            {latestVitals ? (
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Date">{formatDate(latestVitals.recorded_at)}</Descriptions.Item>
                <Descriptions.Item label="Blood Pressure">{latestVitals.systolic_bp}/{latestVitals.diastolic_bp} mmHg</Descriptions.Item>
                <Descriptions.Item label="Pulse Rate">{latestVitals.pulse_rate} bpm</Descriptions.Item>
                <Descriptions.Item label="Temperature">{latestVitals.temperature}°F</Descriptions.Item>
                <Descriptions.Item label="Weight">{latestVitals.weight} kg</Descriptions.Item>
                <Descriptions.Item label="Height">{latestVitals.height} cm</Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="No vitals recorded" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="Recent Diagnoses" style={{ marginBottom: 16 }}>
            {recentConsultations.length > 0 ? (
              <div>
                {recentConsultations.map((consultation, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#666' }}>{formatDate(consultation.consultation_date)}</div>
                    <div><strong>{consultation.diagnosis_code || 'No diagnosis code'}</strong></div>
                    <div style={{ fontSize: 12 }}>{consultation.chief_complaints}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No consultations recorded" />
            )}
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading) {
    return (
      <Card title="Clinical History">
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const timelineItems = createClinicalTimeline();

  return (
    <Card title={<><UserOutlined /> Clinical History</>}>
      <Tabs items={[
        {
          key: '1',
          label: <><AlertOutlined /> Summary</>,
          children: getClinicalSummary()
        },
        {
          key: '2',
          label: <><CalendarOutlined /> Timeline</>,
          children: (
            timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <Empty description="No clinical history found" />
            )
          )
        },
        {
          key: '3',
          label: <><FileTextOutlined /> Consultations</>,
          children: (
            <Table 
              columns={consultationColumns} 
              dataSource={consultations} 
              rowKey="consultation_id"
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          )
        },
        {
          key: '4',
          label: <><HeartOutlined /> Vitals</>,
          children: (
            <Table 
              columns={vitalsColumns} 
              dataSource={vitals} 
              rowKey="vital_id"
              pagination={false}
              size="small"
            />
          )
        }
      ]} />
    </Card>
  );
};

export default ClinicalHistory;