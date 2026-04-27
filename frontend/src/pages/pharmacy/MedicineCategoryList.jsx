import { useState } from 'react';
import { Space, Button, Tag, Card, Typography } from 'antd';
import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
// import PatientForm from './PatientForm';
// import PatientService from '@services/PatientService';
import { useApiQuery } from '@hooks/useApi';
import { formatDate, calculateAge } from '@utils/helpers';
import MedicineCategoryForm from './MedicineCategoryForm';
import MedicineCategoryService from '@/services/MedicineCategoryService';
 
const { Title, Text } = Typography;
 
const CategoryList = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
 
  const { data, isLoading, refetch } = useApiQuery(
    ['category', searchQuery],
    () => MedicineCategoryService.getAll()
  );
 
  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 150,
      fixed: 'left',
      render: (code) => <Text strong style={{ color: '#0a0a0a' }}>{code}</Text>
    },
    {
      title: 'Description',
      key: 'description',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{record.description}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{record.manufacturer}</div>
        </div>
      )
    },
    // {
    //   title: 'Category/Form',
    //   key: 'category',
    //   render: (_, record) => (
    //     <Space>
    //       <Tag color="blue" style={{ borderRadius: 8, fontWeight: 600 }}>{record.category}</Tag>
    //       <Tag style={{ borderRadius: 8, fontWeight: 600 }}>{record.dosage_form}</Tag>
    //     </Space>
    //   )
    // },
    // {
    //   title: 'Strength',
    //   dataIndex: 'strength',
    //   key: 'strength',
    //   render: (strength) => <Text type="secondary">{strength}</Text>
    // },
    // {
    //   title: 'HSN Code',
    //   dataIndex: 'hsn_code',
    //   key: 'hsn_code',
    //   render: (hsn) => <Text type="secondary">{hsn}</Text>
    // },
    // {
    //   title: 'GST %',
    //   dataIndex: 'gst_percentage',
    //   key: 'gst_percentage',
    //   render: (gst) => <Tag color="orange" style={{ borderRadius: 8, fontWeight: 600 }}>{gst}%</Tag>
    // },
    // {
    //   title: 'Schedule',
    //   dataIndex: 'schedule',
    //   key: 'schedule',
    //   render: (schedule) => schedule ? <Tag color="purple" style={{ borderRadius: 8, fontWeight: 600 }}>{schedule}</Tag> : '-'
    // },
    // {
    //   title: 'Status',
    //   dataIndex: 'is_active',
    //   key: 'is_active',
    //   render: (isActive) => (
    //     <Tag
    //       color={isActive ? 'success' : 'error'}
    //       style={{ borderRadius: 10, fontWeight: 600, padding: '4px 12px' }}
    //     >
    //       {isActive ? 'Active' : 'Inactive'}
    //     </Tag>
    //   )
    // },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="middle"
            onClick={() => navigate(`/medicines/${record.category_id}`)}
            style={{ borderRadius: 10 }}
          />
          <Button
            icon={<EditOutlined />}
            size="middle"
            type="primary"
            onClick={() => handleEdit(record)}
            style={{ borderRadius: 10 }}
          />
        </Space>
      )
    }
  ];
 
  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setModalOpen(true);
  };
 
  const handleAdd = () => {
    setSelectedMedicine(null);
    setModalOpen(true);
  };
 
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedMedicine(null);
  };
 
  const handleSuccess = () => {
    refetch();
    handleModalClose();
  };
 
  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
          Category
        </Title>
        <Text style={{ fontSize: 14, color: '#64748b' }}>Manage and track all medicine records</Text>
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
          placeholder="Search by Medicine Code, Name, or Category"
          onSearch={setSearchQuery}
          onAdd={handleAdd}
          addButtonText="Add Category"
        />
        <DataTable
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="category_id"
        />
      </Card>
     
      <MedicineCategoryForm
        open={modalOpen}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedMedicine}
      />
    </div>
  );
};
 
export default CategoryList;
 
 