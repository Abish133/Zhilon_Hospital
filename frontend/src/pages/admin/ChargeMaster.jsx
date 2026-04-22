import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Tag, Row, Col, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ChargeMasterService from '@services/ChargeMasterService';
import DepartmentService from '@services/DepartmentService';
 
const ChargeMaster = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [form] = Form.useForm();
  const [charges, setCharges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCharges();
    fetchDepartments();
  }, []);

  const fetchCharges = async () => {
    try {
      setLoading(true);
      const response = await ChargeMasterService.getAll();
      setCharges(response.data || []);
    } catch (error) {
      message.error('Failed to fetch charges');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await DepartmentService.getAll();
      setDepartments(response.data || []);
    } catch (error) {
    }
  };
 
  const handleAdd = () => {
    setEditingCharge(null);
    form.resetFields();
    setModalOpen(true);
  };
 
  const handleEdit = (record) => {
    setEditingCharge(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };
 
  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Charge',
      content: 'Are you sure you want to delete this charge?',
      onOk: async () => {
        try {
          await ChargeMasterService.delete(id);
          message.success('Charge deleted');
          fetchCharges();
        } catch (error) {
          message.error('Failed to delete charge');
        }
      }
    });
  };
 
  const handleSubmit = async (values) => {
    try {
      if (editingCharge) {
        await ChargeMasterService.update(editingCharge.charge_id, values);
        message.success('Charge updated');
      } else {
        await ChargeMasterService.create(values);
        message.success('Charge added');
      }
      setModalOpen(false);
      fetchCharges();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };
 
  const columns = [
    { title: 'Service Code', dataIndex: 'service_code', key: 'code' },
    { title: 'Service Name', dataIndex: 'service_name', key: 'service' },
    { title: 'Service Type', dataIndex: 'service_type', key: 'type', render: (type) => <Tag color="blue">{type}</Tag> },
    { title: 'Department', dataIndex: ['department', 'department_name'], key: 'department', render: (dept) => dept || 'N/A' },
    { title: 'Charge (₹)', dataIndex: 'charge_amount', key: 'charge', render: (val) => `₹${val}` },
    { title: 'GST (%)', dataIndex: 'gst_percentage', key: 'gst', render: (val) => val || 0 },
    { title: 'Status', dataIndex: 'is_active', key: 'status', render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.charge_id)} />
        </Space>
      )
    }
  ];
 
  return (
    <Card
      title="Charge Master"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Charge</Button>}
    >
      <Spin spinning={loading}>
        <Table columns={columns} dataSource={charges} rowKey="charge_id" />
      </Spin>
 
      <Modal
        title={editingCharge ? 'Edit Charge' : 'Add Charge'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="service_name" label="Service Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="service_code" label="Service Code" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="service_type" label="Service Type" rules={[{ required: true }]}>
                <Select options={[
                  { label: 'Consultation', value: 'Consultation' },
                  { label: 'Procedure', value: 'Procedure' },
                  { label: 'Investigation', value: 'Investigation' },
                  { label: 'Room', value: 'Room' },
                  { label: 'Other', value: 'Other' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department_id" label="Department">
                <Select 
                  allowClear
                  placeholder="Select department"
                  options={departments.map(d => ({ label: d.department_name, value: d.id }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="charge_amount" label="Charge Amount" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} prefix="₹" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gst_percentage" label="GST Percentage">
                <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          </Form>
      </Modal>
    </Card>
  );
};
 
export default ChargeMaster;
 
 