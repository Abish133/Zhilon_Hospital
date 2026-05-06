import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, message, Select, Modal, InputNumber } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { wardService, departmentService } from '@services';
import DataTable from '@components/common/DataTable';
import { useAuthStore } from '@store';
import { useApiQuery, useApiMutation } from '@hooks/useApi';

const WardManagement = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWard, setEditingWard] = useState(null);

  const { data: wardsData, isLoading, refetch } = useApiQuery(
    ['wards'],
    () => wardService.getAll()
  );

  const { data: departmentsData } = useApiQuery(
    ['departments'],
    () => departmentService.getAll()
  );

  const createMutation = useApiMutation(
    (data) => wardService.create(data),
    {
      onSuccess: () => {
        message.success('Ward created successfully');
        setModalOpen(false);
        form.resetFields();
        refetch();
      },
      onError: (error) => message.error(error?.response?.data?.message || 'Failed to create ward')
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }) => wardService.update(id, data),
    {
      onSuccess: () => {
        message.success('Ward updated successfully');
        setModalOpen(false);
        setEditingWard(null);
        form.resetFields();
        refetch();
      },
      onError: (error) => message.error(error?.response?.data?.message || 'Failed to update ward')
    }
  );

  const deleteMutation = useApiMutation(
    (id) => wardService.delete(id),
    {
      onSuccess: () => {
        message.success('Ward deleted successfully');
        refetch();
      },
      onError: () => message.error('Failed to delete ward')
    }
  );

  const wards = wardsData?.data || [];
  const departments = departmentsData?.data || [];

  const handleSubmit = async (values) => {
    const wardData = {
      ...values,
      hospital_id: user?.hospital_id
    };

    if (editingWard) {
      updateMutation.mutate({ id: editingWard.ward_id, data: wardData });
    } else {
      createMutation.mutate(wardData);
    }
  };

  const handleEdit = (ward) => {
    setEditingWard(ward);
    form.setFieldsValue(ward);
    setModalOpen(true);
  };

  const handleDelete = (wardId) => {
    Modal.confirm({
      title: 'Delete Ward',
      content: 'Are you sure you want to delete this ward?',
      onOk: () => deleteMutation.mutate(wardId)
    });
  };

  const columns = [
    { title: 'Ward Name', dataIndex: 'ward_name', key: 'ward_name' },
    { title: 'Ward Type', dataIndex: 'ward_type', key: 'ward_type' },
    { 
      title: 'Department', 
      key: 'department',
      render: (_, record) => record.department?.department_name || '-'
    },
    { title: 'Floor', dataIndex: 'floor_number', key: 'floor_number' },
    { title: 'Total Beds', dataIndex: 'total_beds', key: 'total_beds' },
    { title: 'Available Beds', dataIndex: 'available_beds', key: 'available_beds' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.ward_id)} />
        </Space>
      )
    }
  ];

  return (
    <Card 
      title="Ward Management" 
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => { 
            setEditingWard(null); 
            form.resetFields(); 
            setModalOpen(true); 
          }}
        >
          Add Ward
        </Button>
      }
    >
      <DataTable 
        columns={columns} 
        dataSource={wards} 
        rowKey="ward_id" 
        loading={isLoading} 
      />

      <SliderModal
        title={editingWard ? 'Edit Ward' : 'Add Ward'}
        open={modalOpen}
        onCancel={() => { 
          setModalOpen(false); 
          setEditingWard(null); 
          form.resetFields(); 
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item 
            name="ward_name" 
            label="Ward Name" 
            rules={[{ required: true, message: 'Please enter ward name' }]}
          >
            <Input placeholder="Enter ward name" />
          </Form.Item>

          <Form.Item 
            name="ward_type" 
            label="Ward Type" 
            rules={[{ required: true, message: 'Please select ward type' }]}
          >
            <Select
              placeholder="Select ward type"
              options={[
                { label: 'General', value: 'General' },
                { label: 'ICU', value: 'ICU' },
                { label: 'NICU', value: 'NICU' },
                { label: 'PICU', value: 'PICU' },
                { label: 'Private', value: 'Private' },
                { label: 'Semi-Private', value: 'Semi-Private' },
                { label: 'Deluxe', value: 'Deluxe' }
              ]}
            />
          </Form.Item>

          <Form.Item 
            name="department_id" 
            label="Department" 
            rules={[{ required: true, message: 'Please select department' }]}
          >
            <Select
              placeholder="Select department"
              options={departments.map(d => ({
                label: d.department_name,
                value: d.id
              }))}
            />
          </Form.Item>

          <Form.Item name="floor_number" label="Floor Number">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter floor number" />
          </Form.Item>

          <Form.Item 
            name="total_beds" 
            label="Total Beds" 
            rules={[{ required: true, message: 'Please enter total beds' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter total beds" />
          </Form.Item>

          <Form.Item name="available_beds" label="Available Beds">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter available beds" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingWard ? 'Update' : 'Add'} Ward
              </Button>
              <Button onClick={() => { 
                setModalOpen(false); 
                setEditingWard(null); 
                form.resetFields(); 
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>
    </Card>
  );
};

export default WardManagement;
