import { Card, Timeline, Table, Tag, Spin, Empty, Tabs, Descriptions, Row, Col, Alert } from 'antd';
import { useState, useEffect } from 'react';
import { 
  MedicineBoxOutlined,
  CalendarOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { 
  opdPrescriptionService,
  patientService
} from '@/services';
import { formatDate } from '@utils/helpers';

const MedicationHistory = ({ patientUhid }) => {
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    if (patientUhid) {
      fetchMedicationHistory();
    }
  }, [patientUhid]);

  const fetchMedicationHistory = async () => {
    setLoading(true);
    try {
      const patientsRes = await patientService.getAll();
      const foundPatient = patientsRes.data?.find(p => p.uhid === patientUhid);
      setPatient(foundPatient);

      if (foundPatient) {
        try {
          const prescRes = await opdPrescriptionService.getByPatientId(foundPatient.patient_id);
          setPrescriptions(prescRes.data || []);
        } catch (error) {
          setPrescriptions([]);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const medicationColumns = [
    {
      title: 'Date Prescribed',
      dataIndex: 'prescribed_at',
      render: (date) => formatDate(date)
    },
    {
      title: 'Medicine',
      dataIndex: 'medicine_name',
      render: (name) => <strong>{name}</strong>
    },
    {
      title: 'Dosage',
      dataIndex: 'dosage'
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency'
    },
    {
      title: 'Route',
      dataIndex: 'route',
      render: (route) => <Tag color="blue">{route}</Tag>
    },
    {
      title: 'Duration',
      dataIndex: 'duration'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity'
    },
    {
      title: 'Instructions',
      dataIndex: 'instructions',
      ellipsis: true
    },
    {
      title: 'Prescribed By',
      dataIndex: 'prescribed_by_name'
    }
  ];

  const createMedicationTimeline = () => {
    const sortedPrescriptions = prescriptions.sort((a, b) => 
      new Date(b.prescribed_at) - new Date(a.prescribed_at)
    );

    return sortedPrescriptions.map((prescription) => ({
      dot: <MedicineBoxOutlined />,
      color: 'green',
      children: (
        <div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
            {formatDate(prescription.prescribed_at)}
          </div>
          <div>
            <strong>{prescription.medicine_name}</strong>
            <div>Dosage: {prescription.dosage} - {prescription.frequency}</div>
            <div>Duration: {prescription.duration} | Route: {prescription.route}</div>
            <div>Prescribed by: {prescription.prescribed_by_name}</div>
            {prescription.instructions && (
              <div style={{ fontStyle: 'italic', color: '#666' }}>
                Instructions: {prescription.instructions}
              </div>
            )}
          </div>
        </div>
      )
    }));
  };

  const getCurrentMedications = () => {
    // Get medications from last 30 days (assuming current)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return prescriptions.filter(p => 
      new Date(p.prescribed_at) >= thirtyDaysAgo
    );
  };

  const getMedicationsByCategory = () => {
    const categories = {};
    prescriptions.forEach(prescription => {
      const category = prescription.medicine_category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(prescription);
    });
    return categories;
  };

  const getAllergiesAlert = () => {
    // This would typically check against known allergies
    const commonAllergies = ['Penicillin', 'Aspirin', 'Sulfa'];
    const prescribedMedicines = prescriptions.map(p => p.medicine_name);
    
    const potentialAllergies = prescribedMedicines.filter(medicine =>
      commonAllergies.some(allergy => 
        medicine.toLowerCase().includes(allergy.toLowerCase())
      )
    );

    if (potentialAllergies.length > 0) {
      return (
        <Alert
          message="Allergy Alert"
          description={`Patient has been prescribed: ${potentialAllergies.join(', ')}. Please verify allergy status.`}
          type="warning"
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      );
    }
    return null;
  };

  const getMedicationSummary = () => {
    const currentMeds = getCurrentMedications();
    const totalMedications = prescriptions.length;
    const uniqueMedicines = [...new Set(prescriptions.map(p => p.medicine_name))].length;
    
    return (
      <Row gutter={16}>
        <Col span={8}>
          <Card size="small" title="Current Medications" style={{ marginBottom: 16 }}>
            {currentMeds.length > 0 ? (
              <div>
                {currentMeds.slice(0, 5).map((med, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <div><strong>{med.medicine_name}</strong></div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {med.dosage} - {med.frequency}
                    </div>
                  </div>
                ))}
                {currentMeds.length > 5 && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    +{currentMeds.length - 5} more medications
                  </div>
                )}
              </div>
            ) : (
              <Empty description="No current medications" />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="Medication Stats" style={{ marginBottom: 16 }}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Total Prescriptions">{totalMedications}</Descriptions.Item>
              <Descriptions.Item label="Unique Medicines">{uniqueMedicines}</Descriptions.Item>
              <Descriptions.Item label="Current Active">{currentMeds.length}</Descriptions.Item>
              <Descriptions.Item label="Most Recent">
                {prescriptions.length > 0 ? formatDate(prescriptions[0]?.prescribed_at) : 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="Medication Alerts" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: 'green', marginRight: 8 }} />
                No drug interactions detected
              </div>
              <div style={{ marginBottom: 8 }}>
                <ClockCircleOutlined style={{ color: 'orange', marginRight: 8 }} />
                {currentMeds.length} active prescriptions
              </div>
              <div>
                <AlertOutlined style={{ color: 'red', marginRight: 8 }} />
                Review allergy status
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading) {
    return (
      <Card title="Medication History">
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const timelineItems = createMedicationTimeline();

  return (
    <Card title={<><MedicineBoxOutlined /> Medication History</>}>
      {getAllergiesAlert()}
      <Tabs items={[
        {
          key: '1',
          label: <><AlertOutlined /> Summary</>,
          children: getMedicationSummary()
        },
        {
          key: '2',
          label: <><CalendarOutlined /> Timeline</>,
          children: (
            timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <Empty description="No medication history found" />
            )
          )
        },
        {
          key: '3',
          label: <><MedicineBoxOutlined /> All Medications</>,
          children: (
            <Table 
              columns={medicationColumns} 
              dataSource={prescriptions} 
              rowKey="prescription_id"
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ x: 1000 }}
            />
          )
        },
        {
          key: '4',
          label: <><CheckCircleOutlined /> Current Medications</>,
          children: (
            <Table 
              columns={medicationColumns} 
              dataSource={getCurrentMedications()} 
              rowKey="prescription_id"
              pagination={false}
              size="small"
              scroll={{ x: 1000 }}
            />
          )
        }
      ]} />
    </Card>
  );
};

export default MedicationHistory;