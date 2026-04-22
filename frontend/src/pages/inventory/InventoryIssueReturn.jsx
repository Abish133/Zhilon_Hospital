import { useState } from 'react';
import { Card, Form, Select, InputNumber, Button, Table, Space, message, Tabs, DatePicker, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { stockIssueService, stockReturnService, inventoryItemService, departmentService } from '@services/index';
import { useAuthStore } from '@store';

const InventoryIssueReturn = () => {
  const { user } = useAuthStore();
  const [issueForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [issueItems, setIssueItems] = useState([]);
  const [returnItems, setReturnItems] = useState([]);

  const { data: inventoryItems } = useApiQuery(['inventory-items'], () => inventoryItemService.getAll());
  const { data: departments } = useApiQuery(['departments'], () => departmentService.getAll());

  const issueMutation = useApiMutation(
    (data) => stockIssueService.create(data),
    {
      successMessage: 'Items issued successfully',
      onSuccess: () => {
        setIssueItems([]);
        issueForm.resetFields();
      }
    }
  );

  const returnMutation = useApiMutation(
    (data) => stockReturnService.create(data),
    {
      successMessage: 'Items returned successfully',
      onSuccess: () => {
        setReturnItems([]);
        returnForm.resetFields();
      }
    }
  );

  const handleAddIssueItem = () => {
    const values = issueForm.getFieldsValue(['item_id', 'quantity']);
    if (!values.item_id || !values.quantity) {
      message.warning('Select item and quantity');
      return;
    }
    const item = inventoryItems?.data?.find(i => i.item_id === values.item_id);
    setIssueItems([...issueItems, {
      key: Date.now(),
      item_id: values.item_id,
      item_name: item?.item_name,
      quantity: values.quantity
    }]);
    issueForm.resetFields(['item_id', 'quantity']);
  };

  const handleAddReturnItem = () => {
    const values = returnForm.getFieldsValue(['item_id', 'quantity']);
    if (!values.item_id || !values.quantity) {
      message.warning('Select item and quantity');
      return;
    }
    const item = inventoryItems?.data?.find(i => i.item_id === values.item_id);
    setReturnItems([...returnItems, {
      key: Date.now(),
      item_id: values.item_id,
      item_name: item?.item_name,
      quantity: values.quantity
    }]);
    returnForm.resetFields(['item_id', 'quantity']);
  };

  const handleIssueSubmit = (values) => {
    if (issueItems.length === 0) {
      message.warning('Add at least one item');
      return;
    }
    // Submit each item as separate stock issue
    issueItems.forEach(item => {
      issueMutation.mutate({
        department_id: values.department_id,
        issue_date: values.issue_date.format('YYYY-MM-DD'),
        item_id: item.item_id,
        quantity: item.quantity,
        purpose: values.purpose || 'Department Issue',
        issued_by: user?.id || 1
      });
    });
  };

  const handleReturnSubmit = (values) => {
    if (returnItems.length === 0) {
      message.warning('Add at least one item');
      return;
    }
    // Submit each item as separate stock return
    returnItems.forEach(item => {
      returnMutation.mutate({
        department_id: values.department_id,
        return_date: values.return_date.format('YYYY-MM-DD'),
        item_id: item.item_id,
        quantity: item.quantity,
        reason: values.reason || 'Department Return',
        returned_by: user?.id || 1
      });
    });
  };

  const columns = [
    { title: 'Item', dataIndex: 'item_name', key: 'item_name' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record, index, type) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => {
            if (type === 'issue') {
              setIssueItems(issueItems.filter(i => i.key !== record.key));
            } else {
              setReturnItems(returnItems.filter(i => i.key !== record.key));
            }
          }}
        />
      )
    }
  ];

  return (
    <Card title="Inventory Issue & Return">
      <Tabs items={[
        {
          key: 'issue',
          label: 'Issue to Department',
          children: (
            <Form form={issueForm} layout="vertical" onFinish={handleIssueSubmit}>
              <Form.Item name="department_id" label="Department" rules={[{ required: true }]}>
                <Select
                  options={departments?.data?.map(d => ({ label: d.department_name, value: d.id }))}
                  placeholder="Select department"
                />
              </Form.Item>
              <Form.Item name="issue_date" label="Issue Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="purpose" label="Purpose">
                <Input placeholder="Purpose of issue..." />
              </Form.Item>

              <Space style={{ marginBottom: 16 }}>
                <Form.Item name="item_id" style={{ marginBottom: 0, width: 300 }}>
                  <Select
                    showSearch
                    placeholder="Select item"
                    options={inventoryItems?.data?.map(i => ({ label: i.item_name, value: i.item_id }))}
                  />
                </Form.Item>
                <Form.Item name="quantity" style={{ marginBottom: 0 }}>
                  <InputNumber placeholder="Quantity" min={1} style={{ width: 120 }} />
                </Form.Item>
                <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddIssueItem}>Add</Button>
              </Space>

              <Table
                columns={columns}
                dataSource={issueItems}
                pagination={false}
                size="small"
                style={{ marginBottom: 16 }}
              />

              <Button type="primary" htmlType="submit" loading={issueMutation.isPending}>Issue Items</Button>
            </Form>
          )
        },
        {
          key: 'return',
          label: 'Return from Department',
          children: (
            <Form form={returnForm} layout="vertical" onFinish={handleReturnSubmit}>
              <Form.Item name="department_id" label="Department" rules={[{ required: true }]}>
                <Select
                  options={departments?.data?.map(d => ({ label: d.department_name, value: d.id }))}
                  placeholder="Select department"
                />
              </Form.Item>
              <Form.Item name="return_date" label="Return Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="reason" label="Reason for Return">
                <Input.TextArea rows={2} placeholder="Reason for returning items..." />
              </Form.Item>

              <Space style={{ marginBottom: 16 }}>
                <Form.Item name="item_id" style={{ marginBottom: 0, width: 300 }}>
                  <Select
                    showSearch
                    placeholder="Select item"
                    options={inventoryItems?.data?.map(i => ({ label: i.item_name, value: i.item_id }))}
                  />
                </Form.Item>
                <Form.Item name="quantity" style={{ marginBottom: 0 }}>
                  <InputNumber placeholder="Quantity" min={1} style={{ width: 120 }} />
                </Form.Item>
                <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddReturnItem}>Add</Button>
              </Space>

              <Table
                columns={columns.map(col => col.key === 'action' ? { ...col, render: (_, record) => (
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => setReturnItems(returnItems.filter(i => i.key !== record.key))}
                  />
                )} : col)}
                dataSource={returnItems}
                pagination={false}
                size="small"
                style={{ marginBottom: 16 }}
              />

              <Button type="primary" htmlType="submit" loading={returnMutation.isPending}>Return Items</Button>
            </Form>
          )
        }
      ]} />
    </Card>
  );
};

export default InventoryIssueReturn;
