import { useState, useEffect } from 'react';
import { Space, Button, Tag, Card, message, Modal, Form, Input, Select, InputNumber, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { labTestService } from '@services';

const LabTestMaster = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLabTests();
  }, [searchQuery]);

  const fetchLabTests = async () => {
    setIsLoading(true);
    try {
      const response = await labTestService.getAll();
      // Backend returns { success: true, data: [...] }
      // axios wraps it in response.data
      const tests = response.data?.data || response.data || [];
      setData(tests);
    } catch (error) {
      message.error('Failed to fetch lab tests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await labTestService.delete(id);
      message.success('Test deleted successfully');
      fetchLabTests();
    } catch (error) {
      message.error('Failed to delete test');
    }
  };

  const columns = [
    { title: 'Test Code', dataIndex: 'test_code', key: 'test_code', width: 120, render: (code) => <Tag color="blue">{code}</Tag> },
    { title: 'Test Name', dataIndex: 'test_name', key: 'test_name', render: (name) => <div style={{ fontWeight: 500 }}>{name}</div> },
    { title: 'Category', dataIndex: 'test_category', key: 'test_category' },
    { title: 'Sample Type', dataIndex: 'sample_type', key: 'sample_type', render: (type) => <Tag>{type}</Tag> },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'TAT (hrs)', dataIndex: 'turn_around_time_hours', key: 'turn_around_time_hours' },
    { title: 'Charge (₹)', dataIndex: 'charge', key: 'charge', render: (charge) => `₹${charge}` },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingTest(record); form.setFieldsValue(record); setModalOpen(true); }} />
          <Popconfirm title="Delete this test?" onConfirm={() => handleDelete(record.test_id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingTest) {
        await labTestService.update(editingTest.test_id, values);
        message.success('Test updated successfully');
      } else {
        await labTestService.create(values);
        message.success('Test created successfully');
      }
      
      setModalOpen(false);
      form.resetFields();
      setEditingTest(null);
      fetchLabTests();
    } catch (error) {
      message.error('Failed to save test');
    }
  };

  return (
    <div>
      <Card>
        <SearchBar
          placeholder="Search by test name or code"
          onSearch={setSearchQuery}
          onAdd={() => { setEditingTest(null); form.resetFields(); setModalOpen(true); }}
          addButtonText="Add Test"
        />
        <DataTable columns={columns} dataSource={data} loading={isLoading} rowKey="test_id" />
      </Card>

      <Modal open={modalOpen} onCancel={() => { setModalOpen(false); setEditingTest(null); }} onOk={handleSubmit} title={editingTest ? 'Edit Test' : 'Add Test'} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="test_code" label="Test Code">
            <Input placeholder="e.g., CBC" />
          </Form.Item>
          <Form.Item name="test_name" label="Test Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Complete Blood Count" />
          </Form.Item>
          <Form.Item name="test_category" label="Category">
            <Select options={[{ label: 'Hematology', value: 'Hematology' }, { label: 'Biochemistry', value: 'Biochemistry' }, { label: 'Microbiology', value: 'Microbiology' }, { label: 'Serology', value: 'Serology' }]} />
          </Form.Item>
          <Form.Item name="sample_type" label="Sample Type">
            <Select options={[{ label: 'Blood', value: 'Blood' }, { label: 'Urine', value: 'Urine' }, { label: 'Stool', value: 'Stool' }, { label: 'Sputum', value: 'Sputum' }]} />
          </Form.Item>
          <Form.Item name="sample_volume" label="Sample Volume">
            <Input placeholder="e.g., 5ml" />
          </Form.Item>
          <Form.Item name="container_type" label="Container Type">
            <Select options={[{ label: 'EDTA Tube', value: 'EDTA Tube' }, { label: 'Plain Tube', value: 'Plain Tube' }, { label: 'Sterile Container', value: 'Sterile Container' }]} />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Select options={[{ label: 'Pathology', value: 'Pathology' }, { label: 'Biochemistry', value: 'Biochemistry' }, { label: 'Microbiology', value: 'Microbiology' }]} />
          </Form.Item>
          <Form.Item name="normal_range" label="Normal Range">
            <Input.TextArea placeholder="e.g., Male: 13-17 g/dL, Female: 12-15 g/dL" rows={2} />
          </Form.Item>
          <Form.Item name="turn_around_time_hours" label="Turn Around Time (hours)">
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="charge" label="Charge (₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="is_active" label="Status" initialValue={true}>
            <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LabTestMaster;
