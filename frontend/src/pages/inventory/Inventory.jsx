import { useState } from 'react';
import { Space, Button, Tag, Card, Row, Col, Statistic, Form, Input, InputNumber, Select } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { EditOutlined, InboxOutlined, WarningOutlined, CheckCircleOutlined, ShoppingCartOutlined, FileTextOutlined, TeamOutlined, RetweetOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { inventoryItemService, inventoryCategoryService, medicineService } from '@services/index';
import { useAuthStore } from '@store';

const Inventory = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemForm] = Form.useForm();
  const [editItemForm] = Form.useForm();

  const { data, isLoading, refetch } = useApiQuery(['inventory-items', searchQuery], () =>
    inventoryItemService.getAll()
  );

  const { data: categories } = useApiQuery(['inventory-categories'], () =>
    inventoryCategoryService.getAll()
  );

  const { data: medicines } = useApiQuery(['medicines'], () =>
    medicineService.getAll()
  );

  const items = data?.data || [];
  const lowStockCount = items.filter(item => item.current_stock < item.reorder_level).length;

  const createMutation = useApiMutation(
    (data) => inventoryItemService.create(data),
    {
      successMessage: 'Item added successfully',
      onSuccess: () => {
        refetch();
        setItemModalOpen(false);
        itemForm.resetFields();
      }
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }) => inventoryItemService.update(id, data),
    {
      successMessage: 'Item updated successfully',
      onSuccess: () => {
        refetch();
        setEditItemModalOpen(false);
        setSelectedItem(null);
        editItemForm.resetFields();
      }
    }
  );

  const columns = [
    { title: 'Item Code', dataIndex: 'item_code', key: 'item_code', render: (code) => <Tag color="blue">{code}</Tag> },
    { title: 'Item Name', dataIndex: 'item_name', key: 'item_name', render: (name) => <div style={{ fontWeight: 500, color: '#000' }}>{name}</div> },
    { title: 'Category', key: 'category', render: (_, record) => <span style={{ color: '#000' }}>{record.category?.category_name || '-'}</span> },
    { title: 'Stock', dataIndex: 'current_stock', key: 'current_stock', render: (stock, record) => <Tag color={stock < record.reorder_level ? 'red' : 'green'}>{stock} {record.unit_of_measure}</Tag> },
    { title: 'Reorder Level', dataIndex: 'reorder_level', key: 'reorder_level', render: (val) => <span style={{ color: '#000' }}>{val}</span> },
    { title: 'Rate', dataIndex: 'rate_per_unit', key: 'rate_per_unit', render: (val) => <span style={{ color: '#000' }}>â‚¹{val ? Number(val).toFixed(2) : '0.00'}</span> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            type="primary" 
            onClick={() => {
              setSelectedItem(record);
              editItemForm.setFieldsValue(record);
              setEditItemModalOpen(true);
            }}
            style={{ color: '#fff' }}
          >
            Edit
          </Button>
        </Space>
      )
    }
  ];

  const handleAddItem = () => {
    itemForm.validateFields().then(values => {
      const timestamp = Date.now();
      createMutation.mutate({
        ...values,
        item_code: values.item_code || `ITM-${timestamp}`,
        hospital_id: user?.hospital_id
      });
    });
  };

  const handleEditItem = () => {
    editItemForm.validateFields().then(values => {
      updateMutation.mutate({ id: selectedItem.item_id, data: values });
    });
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Items" value={items.length} prefix={<InboxOutlined />} valueStyle={{ color: '#0a0a0a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Low Stock" value={lowStockCount} prefix={<WarningOutlined />} valueStyle={{ color: '#ef4444' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="In Stock" value={items.filter(i => i.current_stock > 0).length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10b981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Categories" value={categories?.data?.length || 0} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => navigate('/inventory/purchase-orders')}>
            Purchase Orders
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => navigate('/inventory/goods-receipt')}>
            Goods Receipt
          </Button>
          <Button icon={<TeamOutlined />} onClick={() => navigate('/inventory/vendors')}>
            Vendors
          </Button>
          <Button icon={<RetweetOutlined />} onClick={() => navigate('/inventory/issue-return')}>
            Issue & Return
          </Button>
        </Space>
      </Card>

      <Card>
        <SearchBar placeholder="Search items" onSearch={setSearchQuery} onAdd={() => setItemModalOpen(true)} addButtonText="Add Item" />
        <DataTable columns={columns} dataSource={items} loading={isLoading} rowKey="item_id" />
      </Card>

      <SliderModal 
        open={itemModalOpen} 
        onCancel={() => setItemModalOpen(false)} 
        onOk={handleAddItem} 
        title="Add Inventory Item"
        okText="Add Item"
        cancelText="Cancel"
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item name="item_code" label="Item Code" rules={[{ required: true }]}>
            <Input placeholder="Enter item code" />
          </Form.Item>
          <Form.Item label="Quick Select Medicine (Optional)">
            <Select 
              placeholder="Select from Medicine Master"
              showSearch
              allowClear
              filterOption={(input, option) => 
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={medicines?.data?.map(m => ({ 
                label: m.medicine_name, 
                value: m.medicine_name 
              }))} 
              onChange={(value) => {
                if (value) {
                  itemForm.setFieldsValue({ item_name: value });
                }
              }}
            />
          </Form.Item>
          <Form.Item name="item_name" label="Item Name" rules={[{ required: true }]}>
            <Input placeholder="Enter item name or select from above" />
          </Form.Item>
          <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
            <Select 
              placeholder="Select category"
              options={categories?.data?.map(c => ({ label: c.category_name, value: c.category_id }))} 
            />
          </Form.Item>
          <Form.Item name="unit_of_measure" label="Unit" rules={[{ required: true }]}>
            <Select 
              placeholder="Select unit"
              options={[
                { label: 'Piece', value: 'Piece' }, 
                { label: 'Box', value: 'Box' }, 
                { label: 'Strip', value: 'Strip' },
                { label: 'Tablet', value: 'Tablet' },
                { label: 'Bottle', value: 'Bottle' },
                { label: 'Pack', value: 'Pack' },
                { label: 'Roll', value: 'Roll' },
                { label: 'Kg', value: 'Kg' },
                { label: 'Liter', value: 'Liter' }
              ]} 
            />
          </Form.Item>
          <Form.Item name="reorder_level" label="Reorder Level" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter reorder level" />
          </Form.Item>
          <Form.Item name="rate_per_unit" label="Rate Per Unit">
            <InputNumber style={{ width: '100%' }} min={0} prefix="â‚¹" placeholder="Enter rate" />
          </Form.Item>
        </Form>
      </SliderModal>

      <SliderModal 
        open={editItemModalOpen} 
        onCancel={() => {
          setEditItemModalOpen(false);
          setSelectedItem(null);
          editItemForm.resetFields();
        }} 
        onOk={handleEditItem} 
        title="Edit Inventory Item"
        okText="Update Item"
        cancelText="Cancel"
      >
        <Form form={editItemForm} layout="vertical">
          <Form.Item name="item_name" label="Item Name" rules={[{ required: true }]}>
            <Input placeholder="Enter item name" />
          </Form.Item>
          <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
            <Select 
              placeholder="Select category"
              options={categories?.data?.map(c => ({ label: c.category_name, value: c.category_id }))} 
            />
          </Form.Item>
          <Form.Item name="unit_of_measure" label="Unit">
            <Select 
              placeholder="Select unit"
              options={[
                { label: 'Piece', value: 'Piece' }, 
                { label: 'Box', value: 'Box' }, 
                { label: 'Roll', value: 'Roll' },
                { label: 'Bottle', value: 'Bottle' },
                { label: 'Pack', value: 'Pack' },
                { label: 'Kg', value: 'Kg' },
                { label: 'Liter', value: 'Liter' }
              ]} 
            />
          </Form.Item>
          <Form.Item name="current_stock" label="Current Stock" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter current stock" />
          </Form.Item>
          <Form.Item name="reorder_level" label="Reorder Level" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter reorder level" />
          </Form.Item>
          <Form.Item name="rate_per_unit" label="Rate Per Unit">
            <InputNumber style={{ width: '100%' }} min={0} prefix="â‚¹" placeholder="Enter rate" />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default Inventory;
