import { useState } from 'react';
import { Space, Button, Tag, Card, Typography } from 'antd';
import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import InventoryCategoryForm from './InventoryCategoryForm';
import InventoryCategoryService from '@/services/InventoryCategoryService';
import { useApiQuery } from '@hooks/useApi';
 
const { Title, Text } = Typography;
 
const InventoryCategoryList = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
 
  const { data, isLoading, refetch } = useApiQuery(
    ['inventory-categories', searchQuery],
    () => searchQuery ? InventoryCategoryService.searchCategories(searchQuery) : InventoryCategoryService.getAll()
  );
 
  const columns = [
    {
      title: 'Category Name',
      key: 'name',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{record.category_name}</div>
        </div>
      )
    },
    {
      title: 'Category Type',
      dataIndex: 'category_type',
      key: 'category_type',
      render: (type) => <Tag color="blue" style={{ borderRadius: 8, fontWeight: 600 }}>{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
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
            onClick={() => navigate(`/inventory-categories/${record.category_id}`)}
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
 
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };
 
  const handleAdd = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };
 
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };
 
  const handleSuccess = () => {
    refetch();
    handleModalClose();
  };
 
  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
          Inventory Category Management
        </Title>
        <Text style={{ fontSize: 14, color: '#64748b' }}>Manage and track all inventory categories</Text>
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
          placeholder="Search categories"
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
     
      <InventoryCategoryForm
        open={modalOpen}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedCategory}
      />
    </div>
  );
};
 
export default InventoryCategoryList;
 