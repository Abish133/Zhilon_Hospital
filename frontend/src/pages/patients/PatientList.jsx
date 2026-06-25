import { useState } from 'react';
import { Space, Button, Tag, Card, Typography, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined, FileTextOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import PatientCardModal from '@components/common/PatientCardModal';
import PatientForm from './PatientForm';
import PatientService from '@services/PatientService';
import { hospitalService } from '@/services';
import { useAuthStore } from '@/store';
import { useApiQuery } from '@hooks/useApi';
import { formatDate, calculateAge } from '@utils/helpers';
 
const { Title, Text } = Typography;
 
const PatientList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardPatient, setCardPatient] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
 
  const { data, isLoading, refetch } = useApiQuery(
    ['patients', searchQuery],
    () => searchQuery ? PatientService.search(searchQuery) : PatientService.getAll()
  );

  // Hospital branding (name + logo) printed on the patient card.
  const { data: hospitalData } = useApiQuery(
    ['hospital', user?.hospital_id],
    () => hospitalService.getById(user.hospital_id),
    { enabled: !!user?.hospital_id }
  );
  const hospital = hospitalData?.data;

  const openCard = (patient) => {
    setCardPatient(patient);
    setCardOpen(true);
  };
 
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
      key: 'name',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{record.first_name} {record.last_name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>UHID: {record.uhid}</div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.mobile_number}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{record.email || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Age/Gender',
      key: 'age',
      render: (_, record) => (
        <Space>
          <Tag color="blue" style={{ borderRadius: 8, fontWeight: 600 }}>{calculateAge(record.date_of_birth)}Y</Tag>
          <Tag style={{ borderRadius: 8, fontWeight: 600 }}>{record.gender}</Tag>
        </Space>
      )
    },
    {
      title: 'Blood Group',
      dataIndex: 'blood_group',
      key: 'blood_group',
      render: (bg) => <Tag color="red" style={{ borderRadius: 8, fontWeight: 600 }}>{bg}</Tag>
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      render: (city) => <Text type="secondary">{city}</Text>
    },
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
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            icon={<IdcardOutlined />}
            size="middle"
            onClick={() => openCard(record)}
            style={{ borderRadius: 10 }}
            title="Patient Card"
          />
          <Button
            icon={<FileTextOutlined />}
            size="middle"
            onClick={() => navigate(`/patients/${record.uhid}`)}
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
 
  const handleSuccess = (response) => {
    // A new registration (no patient was selected for editing) returns the
    // created patient — pop the card straight away so it can be printed/handed over.
    const wasNew = !selectedPatient;
    const newPatient = response?.data;
    refetch();
    handleModalClose();
    if (wasNew && newPatient?.uhid) {
      openCard(newPatient);
    }
  };

  const handleDelete = async (patient) => {
    try {
      await PatientService.delete(patient.uhid);
      message.success('Patient deleted successfully');
      refetch();
    } catch (error) {
      message.error('Failed to delete patient');
    }
  };

  const handleToggleStatus = async (patient) => {
    try {
      await PatientService.update(patient.uhid, { isActive: !patient.isActive });
      message.success(`Patient ${!patient.isActive ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error) {
      message.error('Failed to update status');
    }
  };
 
  return (
    <div style={{ width: '100%' }}>
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
          rowKey="patient_id"
        />
      </Card>
     
      <PatientForm
        open={modalOpen}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedPatient}
      />

      <PatientCardModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        patient={cardPatient}
        hospital={hospital}
      />
    </div>
  );
};
 
export default PatientList;
 
 