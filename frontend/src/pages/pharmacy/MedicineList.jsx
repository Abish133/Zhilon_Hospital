import { useState } from 'react';
import { Space, Button, Tag, Card, Typography } from 'antd';
import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { useApiQuery } from '@hooks/useApi';
import { MedicineFormModal } from '@components/common/ActionModals';
import MedicineService from '@services/MedicineService';
import MedicineCategoryService from '@services/MedicineCategoryService';
 
const { Title, Text } = Typography;
 
const MedicineList = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
 
  const { data, isLoading, refetch } = useApiQuery(
    ['medicines', searchQuery],
    () => searchQuery ? MedicineService.search(searchQuery) : MedicineService.getAll()
  );
 
  const { data: categoriesData } = useApiQuery(
    ['categories'],
    () => MedicineCategoryService.getAll()
  );
 
  const categories = categoriesData?.data || [];
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.category_id === categoryId);
    return category ? category.category_name : '-';
  };
 
  const columns = [
    {
      title: 'Medicine Code',
      dataIndex: 'medicine_code',
      key: 'medicine_code',
      width: 150,
      fixed: 'left',
      render: (code) => <Text strong style={{ color: '#8b5cf6' }}>{code}</Text>
    },
    {
      title: 'Medicine Name',
      key: 'medicine_name',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{record.medicine_name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{record.manufacturer}</div>
        </div>
      )
    },
    {
      title: 'Category/Form',
      key: 'category',
      render: (_, record) => (
        <Space>
          <Tag color="blue" style={{ borderRadius: 8, fontWeight: 600 }}>
            {record.medicineCategory ? record.medicineCategory.category_name : getCategoryName(record.category_id)}
          </Tag>
          <Tag style={{ borderRadius: 8, fontWeight: 600 }}>{record.dosage_form}</Tag>
        </Space>
      )
    },
    {
      title: 'Strength',
      dataIndex: 'strength',
      key: 'strength',
      render: (strength) => <Text type="secondary">{strength}</Text>
    },
    {
      title: 'HSN Code',
      dataIndex: 'hsn_code',
      key: 'hsn_code',
      render: (hsn) => <Text type="secondary">{hsn}</Text>
    },
    {
      title: 'GST %',
      dataIndex: 'gst_percentage',
      key: 'gst_percentage',
      render: (gst) => gst ? <Tag color="orange" style={{ borderRadius: 8, fontWeight: 600 }}>{gst}%</Tag> : '-'
    },
    {
      title: 'Schedule',
      dataIndex: 'schedule',
      key: 'schedule',
      render: (schedule) => schedule ? <Tag color="purple" style={{ borderRadius: 8, fontWeight: 600 }}>{schedule}</Tag> : '-'
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
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="middle"
            onClick={() => navigate(`/pharmacy/medicines/${record.medicine_id}`)}
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
          Medicine Management
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
          addButtonText="Add Medicine"
        />
        <DataTable
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="medicine_id"
        />
      </Card>
     
      <MedicineFormModal
        open={modalOpen}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedMedicine}
      />
    </div>
  );
};
 
export default MedicineList;
 