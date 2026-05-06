import { useState } from 'react';
import { Card, Button, Modal, Form, Input, Tag, Space, message } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { vendorService } from '@services/index';

const VendorManagement = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();
  const [editingVendor, setEditingVendor] = useState(null);

  const { data, isLoading, refetch } = useApiQuery(['vendors'], () => vendorService.getAll());

  const createMutation = useApiMutation(
    (data) => editingVendor ? vendorService.update(editingVendor.vendor_id, data) : vendorService.create(data),
    {
      onSuccess: () => {
        message.success(editingVendor ? 'Vendor updated successfully' : 'Vendor added successfully');
        refetch();
        setModalOpen(false);
        form.resetFields();
        setEditingVendor(null);
      },
      onError: (error) => {
        message.error(error?.message || 'Operation failed');
      }
    }
  );

  const deleteMutation = useApiMutation(
    (id) => vendorService.delete(id),
    {
      onSuccess: () => {
        message.success('Vendor deleted successfully');
        refetch();
      }
    }
  );

  const handleEdit = (record) => {
    setEditingVendor(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Vendor',
      content: 'Are you sure you want to delete this vendor?',
      onOk: () => deleteMutation.mutate(id)
    });
  };

  const vendors = data?.data || [];
  const filteredVendors = searchQuery
    ? vendors.filter(v => 
        v.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vendor_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : vendors;

  const columns = [
    { 
      title: 'Vendor Code', 
      dataIndex: 'vendor_code', 
      key: 'vendor_code',
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    { 
      title: 'Vendor Name', 
      dataIndex: 'vendor_name', 
      key: 'vendor_name',
      render: (name) => <div style={{ fontWeight: 500 }}>{name}</div>
    },
    { title: 'Contact Person', dataIndex: 'contact_person', key: 'contact_person' },
    { title: 'Mobile', dataIndex: 'mobile', key: 'mobile' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'GST Number', dataIndex: 'gst_number', key: 'gst_number' },
    { title: 'Payment Terms', dataIndex: 'payment_terms', key: 'payment_terms' },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            type="primary"
            onClick={() => handleEdit(record)}
          />
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger
            onClick={() => handleDelete(record.vendor_id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <SearchBar
          placeholder="Search by vendor name, code, or contact person"
          onSearch={setSearchQuery}
          onAdd={() => setModalOpen(true)}
          addButtonText="Add Vendor"
        />
        <DataTable 
          columns={columns} 
          dataSource={filteredVendors} 
          loading={isLoading} 
          rowKey="vendor_id" 
        />
      </Card>

      <SliderModal
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingVendor(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item 
            name="vendor_code" 
            label="Vendor Code" 
            rules={[{ required: true, message: 'Please enter vendor code' }]}
          >
            <Input placeholder="e.g., VEN001" />
          </Form.Item>
          
          <Form.Item 
            name="vendor_name" 
            label="Vendor Name" 
            rules={[{ required: true, message: 'Please enter vendor name' }]}
          >
            <Input placeholder="Enter vendor name" />
          </Form.Item>
          
          <Form.Item 
            name="contact_person" 
            label="Contact Person"
          >
            <Input placeholder="Enter contact person name" />
          </Form.Item>
          
          <Form.Item 
            name="mobile" 
            label="Mobile" 
            rules={[
              { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit mobile number' }
            ]}
          >
            <Input placeholder="Enter mobile number" maxLength={10} />
          </Form.Item>
          
          <Form.Item 
            name="email" 
            label="Email" 
            rules={[{ type: 'email', message: 'Please enter valid email' }]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>
          
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Enter complete address" />
          </Form.Item>
          
          <Form.Item 
            name="gst_number" 
            label="GST Number"
            rules={[
              { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GST format' }
            ]}
          >
            <Input placeholder="e.g., 22AAAAA0000A1Z5" maxLength={15} />
          </Form.Item>
          
          <Form.Item name="payment_terms" label="Payment Terms">
            <Input placeholder="e.g., Net 30 days" />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default VendorManagement;
