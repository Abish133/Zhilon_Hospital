import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Input, Button } from 'antd';
import { SearchOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import apiClient from '@/config/api';

const IpdMedicationsList = () => {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/ipd-admissions', {
        params: { status: 'Admitted' }
      });
      setAdmissions(response.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'UHID',
      dataIndex: 'uhid',
      key: 'uhid',
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return String(record.uhid).toLowerCase().includes(value.toLowerCase()) ||
               String(record.patient?.first_name).toLowerCase().includes(value.toLowerCase()) ||
               String(record.patient?.last_name).toLowerCase().includes(value.toLowerCase());
      }
    },
    {
      title: 'Patient Name',
      key: 'patient_name',
      render: (_, record) => `${record.patient?.first_name} ${record.patient?.last_name}`
    },
    {
      title: 'Ward',
      dataIndex: ['ward', 'ward_name'],
      key: 'ward'
    },
    {
      title: 'Bed',
      dataIndex: ['bed', 'bed_number'],
      key: 'bed'
    },
    {
      title: 'Admission Date',
      dataIndex: 'admission_date',
      key: 'admission_date',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<MedicineBoxOutlined />}
          onClick={() => navigate(`/ipd/patient/${record.admission_id}`)}
        >
          Manage Medications
        </Button>
      )
    }
  ];

  return (
    <Card title="IPD Medications Management">
      <Input
        placeholder="Search by UHID or Patient Name"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 400 }}
      />
      <Table
        columns={columns}
        dataSource={admissions}
        loading={loading}
        rowKey="admission_id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default IpdMedicationsList;
