import { useState, useEffect } from 'react';
import { Modal, Form, Table, Button, Select, InputNumber, message, Space, Card, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import OTService from '../../services/OTService';
import InventoryItemService from '../../services/InventoryItemService';
import { useAuthStore } from '../../store';

const OTConsumables = ({ open, onCancel, bookingId, onSuccess }) => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [consumables, setConsumables] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchInventoryItems();
    }
  }, [open]);

  const fetchInventoryItems = async () => {
    try {
      const response = await InventoryItemService.getAll();
      setInventoryItems(response.data || []);
    } catch (error) {
    }
  };

  const handleAddItem = () => {
    const values = form.getFieldsValue();
    if (!values.item_id || !values.quantity_used) {
      message.warning('Select item and quantity');
      return;
    }
    const item = inventoryItems.find(i => i.item_id === values.item_id);
    setConsumables([...consumables, {
      key: Date.now(),
      item_id: values.item_id,
      item_name: item?.item_name || 'Item',
      quantity_used: values.quantity_used,
      batch_number: values.batch_number || ''
    }]);
    form.resetFields(['item_id', 'quantity_used', 'batch_number']);
  };

  const handleRemove = (key) => {
    setConsumables(consumables.filter(c => c.key !== key));
  };

  const handleSubmit = async () => {
    if (consumables.length === 0) {
      message.warning('Add at least one consumable');
      return;
    }
    
    setLoading(true);
    try {
      for (const consumable of consumables) {
        const consumableData = {
          booking_id: bookingId,
          item_id: consumable.item_id,
          item_name: consumable.item_name,
          quantity_used: consumable.quantity_used,
          batch_number: consumable.batch_number,
          recorded_by: 1,
          hospital_id: 1
        };
        await OTService.createConsumables(consumableData);
      }
      
      message.success('Consumables recorded successfully');
      setConsumables([]);
      onSuccess();
    } catch (error) {
      message.error('Failed to record consumables');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Item', dataIndex: 'item_name', key: 'item_name' },
    { title: 'Quantity', dataIndex: 'quantity_used', key: 'quantity_used' },
    { title: 'Batch Number', dataIndex: 'batch_number', key: 'batch_number' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemove(record.key)} />
      )
    }
  ];

  return (
    <Modal
      title="Record OT Consumables"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={700}
      confirmLoading={loading}
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="item_id" style={{ width: 250 }}>
          <Select
            showSearch
            placeholder="Select consumable item"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {inventoryItems.map(item => (
              <Select.Option key={item.item_id} value={item.item_id}>
                {item.item_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="quantity_used">
          <InputNumber placeholder="Quantity" min={1} style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name="batch_number">
          <InputNumber placeholder="Batch No." style={{ width: 120 }} />
        </Form.Item>
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddItem}>Add</Button>
      </Form>
      <Table columns={columns} dataSource={consumables} pagination={false} size="small" />
    </Modal>
  );
};

export const OTConsumablesManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [consumables, setConsumables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [currentConsumables, setCurrentConsumables] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchConsumables();
    fetchInventoryItems();
  }, []);

  useEffect(() => {
  }, [inventoryItems]);

  const fetchConsumables = async () => {
    setLoading(true);
    try {
      const response = await OTService.getConsumables();
      setConsumables(response.data || []);
    } catch (error) {
      message.error('Failed to fetch consumables');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await InventoryItemService.getAll();
      setInventoryItems(response.data || []);
    } catch (error) {
    }
  };

  const handleAddItem = () => {
    const values = form.getFieldsValue();
    
    if (!values.item_id) {
      message.warning('Please select an item');
      return;
    }
    if (!values.quantity_used || values.quantity_used <= 0) {
      message.warning('Please enter a valid quantity');
      return;
    }
    
    const item = inventoryItems.find(i => i.item_id === values.item_id);
    
    const newConsumable = {
      key: Date.now(),
      item_id: values.item_id,
      item_name: item?.item_name || 'Item',
      quantity_used: values.quantity_used,
      batch_number: values.batch_number || ''
    };
    
    
    setCurrentConsumables([...currentConsumables, newConsumable]);
    
    form.resetFields(['item_id', 'quantity_used', 'batch_number']);
  };

  const handleRemove = (key) => {
    setCurrentConsumables(currentConsumables.filter(c => c.key !== key));
  };

  const handleSubmit = async () => {
    
    if (currentConsumables.length === 0) {
      message.warning('Add at least one consumable');
      return;
    }
    
    // Check if we have booking_id
    if (!location.state?.booking_id) {
      message.error('No booking ID found. Please navigate from OT workflow.');
      return;
    }
    
    
    setLoading(true);
    try {
      for (const consumable of currentConsumables) {
        const consumableData = {
          booking_id: location.state.booking_id,
          item_id: consumable.item_id,
          item_name: consumable.item_name,
          quantity_used: parseInt(consumable.quantity_used),
          batch_number: consumable.batch_number || null,
          recorded_by: user?.id || 1,
          hospital_id: user?.hospital_id
        };
        
        const response = await OTService.createConsumables(consumableData);
      }
      
      message.success('Consumables recorded successfully');
      setCurrentConsumables([]);
      
      // Refresh inventory items to show updated stock
      await fetchInventoryItems();
      
      setTimeout(() => {
        navigate('/ot/postop', {
          state: {
            booking_id: location.state.booking_id,
            patient_id: location.state?.patient_id,
            fromConsumables: true
          }
        });
      }, 1500);
    } catch (error) {
      message.error(`Failed to record consumables: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Booking ID', dataIndex: ['otBooking', 'booking_id'], key: 'booking_id' },
    { title: 'Surgery', dataIndex: ['otBooking', 'surgery_name'], key: 'surgery_name' },
    { title: 'Item', dataIndex: 'item_name', key: 'item_name' },
    { title: 'Quantity Used', dataIndex: 'quantity_used', key: 'quantity_used' },
    { title: 'Batch Number', dataIndex: 'batch_number', key: 'batch_number' },
    { title: 'Recorded By', dataIndex: ['recordedBy', 'name'], key: 'recorded_by' },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleDateString() }
  ];

  const addColumns = [
    { title: 'Item', dataIndex: 'item_name', key: 'item_name' },
    { title: 'Quantity', dataIndex: 'quantity_used', key: 'quantity_used' },
    { title: 'Batch Number', dataIndex: 'batch_number', key: 'batch_number' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemove(record.key)} />
      )
    }
  ];

  return (
    <Card title="OT Consumables Usage">
      <Card style={{ marginBottom: 16 }} title="Add Consumables for Surgery">
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="item_id" style={{ width: 250 }}>
            <Select
              showSearch
              placeholder="Select consumable item"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {inventoryItems.length === 0 ? (
                <Select.Option disabled>No inventory items available</Select.Option>
              ) : (
                inventoryItems.map(item => (
                  <Select.Option key={item.item_id} value={item.item_id}>
                    {item.item_name || `Item ${item.item_id}`}
                  </Select.Option>
                ))
              )}
            </Select>
          </Form.Item>
          <Form.Item name="quantity_used">
            <InputNumber placeholder="Quantity" min={1} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="batch_number">
            <Input placeholder="Batch No." style={{ width: 120 }} />
          </Form.Item>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddItem}>Add</Button>
        </Form>
        <Table columns={addColumns} dataSource={currentConsumables} pagination={false} size="small" style={{ marginBottom: 16 }} />
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={loading}>Save Consumables</Button>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/ot/postop', { state: location.state })}>Skip to Post-Op</Button>
        </Space>
      </Card>
      <Table 
        columns={columns} 
        dataSource={consumables} 
        loading={loading} 
        rowKey="usage_id" 
      />
    </Card>
  );
};

export default OTConsumables;