import { useState } from 'react';
import { Space, Button, Tag, Card, Typography, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import PatientMedicationHistoryForm from './PatientMedicationHistoryForm';
import PatientMedicationHistoryService from '@services/PatientMedicationHistoryService';
import { useApiQuery } from '@hooks/useApi';
import { formatDate } from '@utils/helpers';

const { Title, Text } = Typography;

const PatientMedicationHistoryList = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch } = useApiQuery(
    ['patient-medication-history', searchQuery],
    () => PatientMedicationHistoryService.getAll()
  );

  const columns = [
    {
      title: 'Sl.No',
      key: 'slno',
      width: 70,
      render: (_, __, index) => <Text strong>{index + 1}</Text>
    },
    {
      title: 'Patient Name',
      key: 'patient_name',
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#0a0a0a' }}>
            {record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : 'N/A'}
          </Text>
        </div>
      )
    },
    {
      title: 'Medicine',
      key: 'medicine',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MedicineBoxOutlined style={{ color: '#10b981' }} />
            {record.medicine_name}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {record.medicine?.strength || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Dosage & Frequency',
      key: 'dosage_frequency',
      width: 160,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
            {record.dosage || 'N/A'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {record.frequency || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Route & Duration',
      key: 'route_duration',
      width: 140,
      render: (_, record) => (
        <div>
          <Tag color="blue" style={{ fontSize: 11, marginBottom: 4 }}>
            {record.route || 'N/A'}
          </Tag>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {record.duration || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Visit Type',
      dataIndex: 'visit_type',
      key: 'visit_type',
      width: 100,
      render: (type) => (
        <Tag 
          color={type === 'OPD' ? 'blue' : type === 'IPD' ? 'green' : 'orange'} 
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          {type}
        </Tag>
      )
    },
    {
      title: 'Start - End Date',
      key: 'dates',
      width: 160,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500 }}>
            Start: {formatDate(record.start_date)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            End: {record.end_date ? formatDate(record.end_date) : 'Ongoing'}
          </div>
        </div>
      )
    },
    {
      title: 'Prescribed By',
      key: 'prescribed_by',
      width: 160,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
            {record.prescribedBy?.name || 'N/A'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {record.prescribedBy?.specialization || ''}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag
          color={
            status === 'Active' ? 'success' : 
            status === 'Completed' ? 'blue' : 
            status === 'Stopped' ? 'error' : 'default'
          }
          style={{ borderRadius: 10, fontWeight: 600, padding: '4px 12px' }}
        >
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="middle"
            onClick={() => handleView(record)}
            style={{ borderRadius: 10 }}
            title="View Details"
          />
          <Button
            icon={<EditOutlined />}
            size="middle"
            type="primary"
            onClick={() => handleEdit(record)}
            style={{ borderRadius: 10 }}
          />
          <Popconfirm
            title="Delete Medication History"
            description="Are you sure to delete this medication history?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              size="middle"
              danger
              style={{ borderRadius: 10 }}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    setModalOpen(true);
  };

  const handleView = (record) => {
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  const handleSuccess = () => {
    refetch();
    handleModalClose();
  };

  const handleDelete = async (record) => {
    try {
      await PatientMedicationHistoryService.delete(record.med_history_id);
      message.success('Medication history deleted successfully');
      refetch();
    } catch (error) {
      message.error('Failed to delete medication history');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
          Patient Medication History
        </Title>
        <Text style={{ fontSize: 14, color: '#64748b' }}>Track patient medication prescriptions and treatment history</Text>
      </div>

      <Card
        variant="borderless"
        style={{
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: 24 } }}
      >
        <SearchBar
          placeholder="Search by patient name, medicine, or doctor"
          onSearch={setSearchQuery}
          onAdd={handleAdd}
          addButtonText="Add Medication History"
        />
        <DataTable
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="med_history_id"
          scroll={{ x: 1400 }}
        />
      </Card>

      <PatientMedicationHistoryForm
        open={modalOpen}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedRecord}
      />
    </div>
  );
};

export default PatientMedicationHistoryList;