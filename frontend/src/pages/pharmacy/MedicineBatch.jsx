import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, message, Select, Modal, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { medicineService, vendorService } from '@services';
import medicineBatchService from '@services/MedicineBatchService';
import DataTable from '@components/common/DataTable';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const MedicineBatch = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [medicines, setMedicines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  useEffect(() => {
    fetchMedicines();
    fetchVendors();
    fetchBatches();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await medicineService.getAll();
      setMedicines(Array.isArray(response) ? response : (response?.data || []));
    } catch (error) {
      message.error('Failed to fetch medicines');
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAll();
      setVendors(Array.isArray(response) ? response : (response?.data || []));
    } catch (error) {
      message.error('Failed to fetch vendors');
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await medicineBatchService.getAll();
      const body = response?.data;
      const batchData = Array.isArray(body) ? body : (body?.data || []);
      setBatches(batchData);
    } catch (error) {
      message.error('Failed to fetch batches');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = {
        medicine_id: values.medicine_id,
        batch_number: values.batch_number,
        expiry_date: values.expiry_date.format('YYYY-MM-DD'),
        received_quantity: values.received_quantity,
        available_quantity: values.received_quantity,
        purchase_rate: values.purchase_rate,
        selling_rate: values.selling_rate,
        mrp: values.mrp,
        vendor_id: values.vendor_id,
        received_date: dayjs().format('YYYY-MM-DD'),
        hospital_id: user?.hospital_id
      };

      if (editingBatch) {
        await medicineBatchService.update(editingBatch.batch_id, data);
        message.success('Batch updated successfully');
      } else {
        await medicineBatchService.create(data);
        message.success('Batch added successfully');
      }
      
      setModalOpen(false);
      form.resetFields();
      setEditingBatch(null);
      fetchBatches();
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to save batch');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    form.setFieldsValue({
      ...batch,
      expiry_date: dayjs(batch.expiry_date)
    });
    setModalOpen(true);
  };

  const handleDelete = async (batchId) => {
    try {
      await medicineBatchService.delete(batchId);
      message.success('Batch deleted successfully');
      fetchBatches();
    } catch (error) {
      message.error('Failed to delete batch');
    }
  };

  const columns = [
    {
      title: 'Medicine',
      dataIndex: 'medicine_id',
      render: (id) => medicines.find(m => m.medicine_id === id)?.medicine_name || '-'
    },
    { title: 'Batch Number', dataIndex: 'batch_number' },
    { title: 'Expiry Date', dataIndex: 'expiry_date', render: (date) => dayjs(date).format('DD-MM-YYYY') },
    { title: 'Received Qty', dataIndex: 'received_quantity' },
    { title: 'Available Qty', dataIndex: 'available_quantity' },
    { title: 'Purchase Rate', dataIndex: 'purchase_rate', render: (val) => `₹${val || 0}` },
    { title: 'Selling Rate', dataIndex: 'selling_rate', render: (val) => `₹${val || 0}` },
    { title: 'MRP', dataIndex: 'mrp', render: (val) => `₹${val || 0}` },
    { title: 'Vendor', dataIndex: 'vendor_id', render: (id) => vendors.find(v => v.vendor_id === id)?.vendor_name || '-' },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.batch_id)} />
        </Space>
      )
    }
  ];

  return (
    <Card title="Medicine Batch Management" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingBatch(null); form.resetFields(); setModalOpen(true); }}>
        Add Batch
      </Button>
    }>
      <DataTable columns={columns} dataSource={batches} rowKey="batch_id" loading={loading} />

      <Modal
        title={editingBatch ? 'Edit Batch' : 'Add Batch'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingBatch(null); form.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="medicine_id" label="Medicine" rules={[{ required: true }]}>
            <Select placeholder="Select medicine" showSearch filterOption={(input, option) => 
              option.label.toLowerCase().includes(input.toLowerCase())
            }>
              {medicines.map(m => (
                <Select.Option key={m.medicine_id} value={m.medicine_id} label={m.medicine_name}>
                  {m.medicine_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="batch_number" label="Batch Number" rules={[{ required: true }]}>
            <Input placeholder="Enter batch number" />
          </Form.Item>

          <Form.Item name="expiry_date" label="Expiry Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>

          <Form.Item name="received_quantity" label="Received Quantity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
          </Form.Item>

          <Form.Item name="purchase_rate" label="Purchase Rate" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Enter purchase rate" />
          </Form.Item>

          <Form.Item name="selling_rate" label="Selling Rate" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Enter selling rate" />
          </Form.Item>

          <Form.Item name="mrp" label="MRP" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Enter MRP" />
          </Form.Item>

          <Form.Item name="vendor_id" label="Vendor">
            <Select placeholder="Select vendor" showSearch filterOption={(input, option) => 
              option.label.toLowerCase().includes(input.toLowerCase())
            }>
              {vendors.map(v => (
                <Select.Option key={v.vendor_id} value={v.vendor_id} label={v.vendor_name}>
                  {v.vendor_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingBatch ? 'Update' : 'Add'} Batch
              </Button>
              <Button onClick={() => { setModalOpen(false); setEditingBatch(null); form.resetFields(); }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MedicineBatch;
