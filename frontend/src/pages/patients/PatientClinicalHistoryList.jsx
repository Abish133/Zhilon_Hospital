import { useState } from 'react';
import { Space, Button, Tag, Card, Typography, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import PatientClinicalHistoryForm from './PatientClinicalHistoryForm';
import PatientClinicalHistoryService from '@services/PatientClinicalHistoryService';
import { useApiQuery } from '@hooks/useApi';
import { formatDate } from '@utils/helpers';

const { Title, Text } = Typography;

const PatientClinicalHistoryList = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch } = useApiQuery(
    ['patient-clinical-history', searchQuery],
    () => PatientClinicalHistoryService.getAll()
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
      width: 200,
      render: (_, record) => (
        <Text strong style={{ color: '#0a0a0a' }}>
          {record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : 'N/A'}
        </Text>
      )
    },
    {
      title: 'Visit Type',
      dataIndex: 'visit_type',
      key: 'visit_type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'OPD' ? 'blue' : 'green'} style={{ borderRadius: 8, fontWeight: 600 }}>
          {type}
        </Tag>
      )
    },
    {
      title: 'Visit Date',
      dataIndex: 'visit_date',
      key: 'visit_date',
      width: 120,
      render: (date) => formatDate(date)
    },
    {
      title: 'Doctor',
      key: 'doctor',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
            {record.doctor?.name || 'N/A'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {record.doctor?.specialization || ''}
          </div>
        </div>
      )
    },
    {
      title: 'Department',
      key: 'department',
      width: 150,
      render: (_, record) => (
        <Text>{record.department?.department_name || 'N/A'}</Text>
      )
    },
    {
      title: 'Chief Complaints',
      dataIndex: 'chief_complaints',
      key: 'chief_complaints',
      width: 200,
      render: (complaints) => (
        <Text ellipsis={{ tooltip: complaints }}>
          {complaints || 'N/A'}
        </Text>
      )
    },
    {
      title: 'Diagnosis',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      width: 200,
      render: (diagnosis) => (
        <Text ellipsis={{ tooltip: diagnosis }}>
          {diagnosis || 'N/A'}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag
          color={isActive ? 'success' : 'error'}
          style={{ borderRadius: 10, fontWeight: 600, padding: '4px 12px' }}
        >
          {isActive ? 'Active' : 'Inactive'}
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
            title="Delete Clinical History"
            description="Are you sure to delete this clinical history?"
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
    // You can implement a view modal here
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
      await PatientClinicalHistoryService.delete(record.clinical_history_id);
      message.success('Clinical history deleted successfully');
      refetch();
    } catch (error) {
      message.error('Failed to delete clinical history');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
          Patient Clinical History
        </Title>
        <Text style={{ fontSize: 14, color: '#64748b' }}>Manage patient clinical records and visit history</Text>
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
          placeholder="Search by patient name, doctor, or diagnosis"
          onSearch={setSearchQuery}
          onAdd={handleAdd}
          addButtonText="Add Clinical History"
        />
        <DataTable
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="clinical_history_id"
          scroll={{ x: 1400 }}
        />
      </Card>

      <PatientClinicalHistoryForm
        open={modalOpen}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedRecord}
      />
    </div>
  );
};

export default PatientClinicalHistoryList;