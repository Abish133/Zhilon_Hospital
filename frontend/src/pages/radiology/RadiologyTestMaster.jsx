import { useState, useEffect } from 'react';
import { Space, Button, Tag, Card, message, Form, Input, Select, InputNumber, Popconfirm, Switch } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { radiologyTestService } from '@services';

const RadiologyTestMaster = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRadiologyTests();
  }, [searchQuery]);

  const fetchRadiologyTests = async () => {
    setIsLoading(true);
    try {
      const response = await radiologyTestService.getAll();
      const tests = response.data?.data || response.data || [];
      setData(tests);
    } catch (error) {
      message.error('Failed to fetch radiology tests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await radiologyTestService.delete(id);
      message.success('Test deleted successfully');
      fetchRadiologyTests();
    } catch (error) {
      message.error('Failed to delete test');
    }
  };

  const columns = [
    { title: 'Test Code', dataIndex: 'test_code', key: 'test_code', width: 120, render: (code) => <Tag color="blue">{code}</Tag> },
    { title: 'Test Name', dataIndex: 'test_name', key: 'test_name', render: (name) => <div style={{ fontWeight: 500 }}>{name}</div> },
    { title: 'Modality', dataIndex: 'modality', key: 'modality', render: (modality) => <Tag color="purple">{modality}</Tag> },
    { title: 'Body Part', dataIndex: 'body_part', key: 'body_part' },
    { title: 'Contrast', dataIndex: 'contrast_required', key: 'contrast_required', render: (contrast) => <Tag color={contrast ? 'orange' : 'default'}>{contrast ? 'Required' : 'Not Required'}</Tag> },
    { title: 'Duration (min)', dataIndex: 'duration_minutes', key: 'duration_minutes' },
    { title: 'Charge (â‚¹)', dataIndex: 'charge', key: 'charge', render: (charge) => `â‚¹${charge}` },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingTest(record); form.setFieldsValue(record); setModalOpen(true); }} />
          <Popconfirm title="Delete this test?" onConfirm={() => handleDelete(record.rad_test_id)}>
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
        await radiologyTestService.update(editingTest.rad_test_id, values);
        message.success('Test updated successfully');
      } else {
        await radiologyTestService.create(values);
        message.success('Test created successfully');
      }
      
      setModalOpen(false);
      form.resetFields();
      setEditingTest(null);
      fetchRadiologyTests();
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
        <DataTable columns={columns} dataSource={data} loading={isLoading} rowKey="rad_test_id" />
      </Card>

      <SliderModal open={modalOpen} onCancel={() => { setModalOpen(false); setEditingTest(null); }} onOk={handleSubmit} title={editingTest ? 'Edit Test' : 'Add Test'} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="test_code" label="Test Code" rules={[{ required: true }]}>
            <Input placeholder="e.g., XRAY-CHEST" />
          </Form.Item>
          <Form.Item name="test_name" label="Test Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Chest X-Ray PA View" />
          </Form.Item>
          <Form.Item name="modality" label="Modality" rules={[{ required: true }]}>
            <Select options={[
              { label: 'X-Ray', value: 'X-Ray' },
              { label: 'CT Scan', value: 'CT Scan' },
              { label: 'MRI', value: 'MRI' },
              { label: 'Ultrasound', value: 'Ultrasound' },
              { label: 'Mammography', value: 'Mammography' },
              { label: 'Fluoroscopy', value: 'Fluoroscopy' }
            ]} />
          </Form.Item>
          <Form.Item name="body_part" label="Body Part" rules={[{ required: true }]}>
            <Input placeholder="e.g., Chest, Abdomen, Head" />
          </Form.Item>
          <Form.Item name="contrast_required" label="Contrast Required" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
          <Form.Item name="preparation_instructions" label="Preparation Instructions">
            <Input.TextArea placeholder="e.g., Fasting required for 6 hours" rows={3} />
          </Form.Item>
          <Form.Item name="duration_minutes" label="Duration (minutes)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="charge" label="Charge (â‚¹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="is_active" label="Status" initialValue={true}>
            <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default RadiologyTestMaster;
