import { useState } from 'react';
import { Space, Button, Tag, Card, Typography, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import PatientMedicalHistoryForm from './PatientMedicalHistoryForm';
import PatientMedicalHistoryService from '@services/PatientMedicalHistoryService';
import { useApiQuery } from '@hooks/useApi';
import { formatDate, calculateAge } from '@utils/helpers';

const { Title, Text } = Typography;

const PatientMedicalHistoryList = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch } = useApiQuery(
    ['patient-medical-history', searchQuery],
    () => searchQuery ? PatientMedicalHistoryService.search(searchQuery) : PatientMedicalHistoryService.getAll()
  );

  const columns = [
    {
      title: 'Sl.No',
      key: 'slno',
      width: 70,
      fixed: 'left',
      render: (_, __, index) => <Text strong>{index + 1}</Text>
    },
    {
      title: 'Patient Name',
      key: 'patient_name',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <Text strong style={{ color: '#8b5cf6' }}>
          {record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : 'N/A'}
        </Text>
      )
    },
    {
      title: 'Chronic Diseases',
      dataIndex: 'chronic_diseases',
      key: 'chronic_diseases',
      width: 150,
    },
    {
      title: 'Allergies',
      dataIndex: 'allergies',
      key: 'allergies',
    },
   {
      title: 'Past Surgeries',
      key: 'past_surgeries',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{record.past_surgeries}</div>
          {/* <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{record.mobile_number}</div> */}
        </div>
      )
    },
   
    {
      title: 'Immunization History',
      dataIndex: 'immunization_history',
      key: 'immunization_history',
     render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{record.immunization_history}</div>
          {/* <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{record.mobile_number}</div> */}
        </div>
      )
    },
    // {
    //   title: 'Blood Transfusion History',
    //   dataIndex: 'blood_transfusion_history',
    //   key: 'blood_transfusion_history',
    //  render: (_, record) => (
    //     <div>
    //       <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{record.blood_transfusion_history}</div>
    //       {/* <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{record.mobile_number}</div> */}
    //     </div>
    //   )
    // },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
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
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="middle"
            type="primary"
            onClick={() => handleEdit(record)}
            style={{ borderRadius: 10 }}
          />
          <Popconfirm
            title="Toggle Status"
            description={`Are you sure to ${record.isActive ? 'deactivate' : 'activate'} this patient?`}
            onConfirm={() => handleToggleStatus(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              size="middle"
              style={{ borderRadius: 10 }}
            />
          </Popconfirm>
          <Popconfirm
            title="Delete Patient"
            description="Are you sure to delete this patient?"
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

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedPatient(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPatient(null);
  };

  const handleSuccess = () => {
    refetch();
    handleModalClose();
  };

  const handleDelete = async (patient) => {
    try {
      await PatientMedicalHistoryService.delete(patient.history_id);
      message.success('Medical history deleted successfully');
      refetch();
    } catch (error) {
      message.error('Failed to delete medical history');
    }
  };

  const handleToggleStatus = async (patient) => {
    try {
      await PatientMedicalHistoryService.update(patient.history_id, { isActive: !patient.isActive });
      message.success(`Medical history ${!patient.isActive ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
          Patient Management
        </Title>
        <Text style={{ fontSize: 14, color: '#64748b' }}>Manage and track all patient records</Text>
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
          placeholder="Search by UHID, Name, or Mobile"
          onSearch={setSearchQuery}
          onAdd={handleAdd}
          addButtonText="Register Patient"
        />
        <DataTable
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="history_id"
        />
      </Card>

      <PatientMedicalHistoryForm
        open={modalOpen}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedPatient}
      />
    </div>
  );
};

export default PatientMedicalHistoryList;

