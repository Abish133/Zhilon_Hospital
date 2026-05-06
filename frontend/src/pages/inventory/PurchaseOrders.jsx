import { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Form, Select, InputNumber, DatePicker, message, Space, Input } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/PageHeader';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { purchaseOrderService, vendorService, inventoryItemService, medicineService } from '@services/index';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const PurchaseOrders = () => {
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [items, setItems] = useState([{ item_id: null, medicine_id: null, quantity: 1, rate: 0 }]);
  const [poNumber, setPoNumber] = useState('');

  const { data: pos, refetch } = useApiQuery(['purchase-orders'], () =>
    purchaseOrderService.getAll()
  );

  const { data: vendors } = useApiQuery(['vendors'], () => vendorService.getAll());
  const { data: inventoryItems } = useApiQuery(['inventory-items'], () => inventoryItemService.getAll());
  const { data: medicines } = useApiQuery(['medicines'], () => medicineService.getAll());

  useEffect(() => {
    generatePONumber();
  }, []);

  const generatePONumber = () => {
    const timestamp = Date.now();
    setPoNumber(`PO-${timestamp}`);
  };

  const createMutation = useApiMutation(
    (data) => purchaseOrderService.create(data),
    {
      successMessage: 'Purchase order created',
      onSuccess: () => {
        refetch();
        setModalOpen(false);
        form.resetFields();
        setItems([{ item_id: null, medicine_id: null, quantity: 1, rate: 0 }]);
        generatePONumber();
      }
    }
  );

  const approveMutation = useApiMutation(
    ({ poId, approved_by }) => purchaseOrderService.approve(poId, { approved_by }),
    {
      successMessage: 'Purchase order approved',
      onSuccess: refetch
    }
  );

  const handleSubmit = (values) => {
    if (items.length === 0 || items.some(item => !item.item_id || !item.quantity || !item.rate)) {
      message.error('Please add at least one valid item');
      return;
    }

    createMutation.mutate({
      po_number: poNumber,
      vendor_id: values.vendor_id,
      po_date: dayjs().format('YYYY-MM-DD'),
      expected_delivery_date: values.expected_delivery_date.format('YYYY-MM-DD'),
      items: items.map(item => ({
        item_id: item.item_id,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        rate: item.rate
      })),
      created_by: user?.id,
      hospital_id: user?.hospital_id
    });
  };

  const handleAddItem = () => {
    setItems([...items, { item_id: null, medicine_id: null, quantity: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill rate when inventory item is selected
    if (field === 'item_id' && value) {
      const selectedItem = inventoryItems?.data?.find(item => item.item_id === value);
      if (selectedItem && selectedItem.rate_per_unit) {
        newItems[index]['rate'] = selectedItem.rate_per_unit;
      }
    }
    
    setItems(newItems);
  };

  const columns = [
    { title: 'PO Number', dataIndex: 'po_number', key: 'po_number' },
    { 
      title: 'Vendor', 
      key: 'vendor_name',
      render: (_, record) => record.vendor?.vendor_name || '-'
    },
    { title: 'Date', dataIndex: 'po_date', key: 'po_date', render: (date) => dayjs(date).format('DD MMM YYYY') },
    { 
      title: 'Expected', 
      dataIndex: 'expected_delivery_date', 
      key: 'expected_delivery_date', 
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-'
    },
    { title: 'Total', dataIndex: 'net_amount', key: 'net_amount', render: (amt) => amt ? `â‚¹${parseFloat(amt).toFixed(2)}` : 'â‚¹0.00' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Approved' ? 'green' : status === 'Draft' ? 'orange' : status === 'Received' ? 'blue' : 'default'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) =>
        record.status === 'Draft' && (
          <Button 
            size="small" 
            type="primary" 
            onClick={() => approveMutation.mutate({ poId: record.po_id, approved_by: user?.id })}
          >
            Approve
          </Button>
        )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Create PO
          </Button>
        }
      />
      <Card>
        <Table columns={columns} dataSource={pos?.data || []} rowKey="po_id" />
      </Card>

      <SliderModal
        title="Create Purchase Order"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={900}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="PO Number">
            <Input value={poNumber} disabled />
          </Form.Item>
          <Form.Item name="vendor_id" label="Vendor" rules={[{ required: true }]}>
            <Select
              options={vendors?.data?.map((v) => ({ label: v.vendor_name, value: v.vendor_id }))}
              placeholder="Select vendor"
            />
          </Form.Item>
          <Form.Item name="expected_delivery_date" label="Expected Delivery" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <div>
            <strong>Items:</strong>
            {items.map((item, index) => (
              <Space key={index} style={{ display: 'flex', marginTop: 8 }} align="start">
                <Select
                  style={{ width: 250 }}
                  placeholder="Select inventory item"
                  value={item.item_id}
                  onChange={(val) => handleItemChange(index, 'item_id', val)}
                  options={inventoryItems?.data?.map((i) => ({ label: i.item_name, value: i.item_id }))}
                />
                <Select
                  style={{ width: 200 }}
                  placeholder="Medicine (optional)"
                  value={item.medicine_id}
                  onChange={(val) => handleItemChange(index, 'medicine_id', val)}
                  options={medicines?.data?.map((m) => ({ label: m.medicine_name, value: m.medicine_id }))}
                  allowClear
                />
                <InputNumber
                  placeholder="Qty"
                  min={1}
                  value={item.quantity}
                  onChange={(val) => handleItemChange(index, 'quantity', val)}
                />
                <InputNumber
                  placeholder="Rate"
                  prefix="â‚¹"
                  min={0}
                  value={item.rate}
                  onChange={(val) => handleItemChange(index, 'rate', val)}
                />
                <Button
                  danger
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                >
                  Remove
                </Button>
              </Space>
            ))}
            <Button
              type="dashed"
              onClick={handleAddItem}
              style={{ marginTop: 8, width: '100%' }}
            >
              Add Item
            </Button>
          </div>
        </Form>
      </SliderModal>
    </div>
  );
};

export default PurchaseOrders;
