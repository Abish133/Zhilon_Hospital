import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Spin, Descriptions, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import apiClient from '@services/apiClient';
import IpdMedications from './ipd/IpdMedications';
import MedicationAdministration from './ipd/MedicationAdministration';
import dayjs from 'dayjs';

const IpdPatientDetails = () => {
  const { admissionId } = useParams();
  const navigate = useNavigate();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmission();
  }, [admissionId]);

  const fetchAdmission = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/ipd-admissions/${admissionId}`);
      setAdmission(response.data?.data);
    } catch (error) {
      // silent - not found is handled below
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Loading patient details...</p>
        </div>
      </Card>
    );
  }

  if (!admission) {
    return (
      <Card>
        <p>Admission not found</p>
        <Button onClick={() => navigate('/ipd')}>Back to Admissions</Button>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(`/ipd/care/${admissionId}`)}
          />
          <span>IPD Medications - {admission.patient?.first_name} {admission.patient?.last_name}</span>
        </div>
      }
    >
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="UHID">{admission.uhid}</Descriptions.Item>
        <Descriptions.Item label="Admission ID">{admission.admission_id}</Descriptions.Item>
        <Descriptions.Item label="Patient">
          {admission.patient?.first_name} {admission.patient?.last_name}
        </Descriptions.Item>
        <Descriptions.Item label="Age/Gender">
          {admission.patient?.age} / {admission.patient?.gender}
        </Descriptions.Item>
        <Descriptions.Item label="Ward">
          {admission.ward?.ward_name} - Bed {admission.bed?.bed_number}
        </Descriptions.Item>
        <Descriptions.Item label="Admission Date">
          {dayjs(admission.admission_date).format('DD-MM-YYYY')}
        </Descriptions.Item>
      </Descriptions>

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Prescribe Medications',
            children: <IpdMedications admissionId={admissionId} />
          },
          {
            key: '2',
            label: 'Administration Records',
            children: <MedicationAdministration admissionId={admissionId} />
          }
        ]}
      />
    </Card>
  );
};

export default IpdPatientDetails;
