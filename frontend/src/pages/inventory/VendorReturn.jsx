import { useState } from 'react';
import { Card, Button, Table, Form, Select, InputNumber, DatePicker, Input, Tag, Space, Popconfirm, message, Tooltip } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import SliderModal from '@components/common/SliderModal';
import PageHeader from '@components/common/PageHeader';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { vendorReturnService, vendorService, goodsReceiptNoteService, inventoryItemService } from '@services/index';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const RETURN_REASONS = [
  { label: 'Damaged', value: 'Damaged' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Defective', value: 'Defective' },
  { label: 'Wrong Item', value: 'Wrong Item' },
  { label: 'Quality Issue', value: 'Quality Issue' },
  { label: 'Other', value: 'Other' }
];

const STATUS_COLOR = {
  Pending: 'orange',
  Approved: 'blue',
  Completed: 'green',
  Rejected: 'red'
};

const VendorReturn = () => {
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  // ── Queries ──
  const { data: vendorReturns, refetch } = useApiQuery(['vendor-returns'], () =>
    vendorReturnService.getAll()
  );
  const { data: vendors } = useApiQuery(['vendors'], () => vendorService.getAll());
  const { data: grns } = useApiQuery(['grns'], () => goodsReceiptNoteService.getAll());
  const { data: items } = useApiQuery(['inventory-items'], () => inventoryItemService.getAll());

  // ── Mutations ──
  const createMutation = useApiMutation(
    (data) => vendorReturnService.create(data),
    {
      successMessage: 'Vendor return created successfully',
      onSuccess: () => {
        refetch();
        setModalOpen(false);
        form.resetFields();
        setSelectedVendorId(null);
      }
    }
  );

  const approveMutation = useApiMutation(
    (id) => vendorReturnService.approve(id, { approved_by: user?.id }),
    { successMessage: 'Vendor return approved', onSuccess: refetch }
  );

  const completeMutation = useApiMutation(
    (id) => vendorReturnService.complete(id),
    { successMessage: 'Vendor return completed', onSuccess: refetch }
  );

  const rejectMutation = useApiMutation(
    (id) => vendorReturnService.reject(id, { approved_by: user?.id }),
    { successMessage: 'Vendor return rejected & stock restored', onSuccess: refetch }
  );

  // Filter GRNs by selected vendor
  const filteredGrns = selectedVendorId
    ? (grns?.data || []).filter(g => g.vendor_id === selectedVendorId)
    : (grns?.data || []);

  const handleSubmit = (values) => {
    createMutation.mutate({
      return_date: values.return_date.format('YYYY-MM-DD'),
      vendor_id: values.vendor_id,
      grn_id: values.grn_id || null,
      item_id: values.item_id,
      quantity: values.quantity,
      reason: values.reason,
      remarks: values.remarks || null,
      returned_by: user?.id || 1,
      hospital_id: user?.hospital_id
    });
  };

  const columns = [
    {
      title: 'Return #',
      dataIndex: 'return_number',
      key: 'return_number',
      width: 160,
      ellipsis: true
    },
    {
      title: 'Date',
      dataIndex: 'return_date',
      key: 'return_date',
      width: 120,
      render: (date) => dayjs(date).format('DD MMM YYYY')
    },
    {
      title: 'Vendor',
      key: 'vendor',
      width: 160,
      ellipsis: true,
      render: (_, record) => record.vendor?.vendor_name || '-'
    },
    {
      title: 'Item',
      key: 'item',
      width: 160,
      ellipsis: true,
      render: (_, record) => record.item?.item_name || '-'
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 70,
      align: 'center'
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 120,
      render: (reason) => <Tag>{reason}</Tag>
    },
    {
      title: 'GRN',
      key: 'grn',
      width: 130,
      ellipsis: true,
      render: (_, record) => record.goodsReceiptNote?.grn_number || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => <Tag color={STATUS_COLOR[status] || 'default'}>{status}</Tag>
    },
    {
      title: 'Returned By',
      key: 'returnedBy',
      width: 130,
      ellipsis: true,
      render: (_, record) => record.returnedBy?.name || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const { status, vendor_return_id } = record;
        return (
          <Space size={4}>
            {status === 'Pending' && (
              <>
                <Tooltip title="Approve">
                  <Popconfirm
                    title="Approve this vendor return?"
                    onConfirm={() => approveMutation.mutate(vendor_return_id)}
                    okText="Yes"
                  >
                    <Button type="primary" size="small" icon={<CheckOutlined />} />
                  </Popconfirm>
                </Tooltip>
                <Tooltip title="Reject">
                  <Popconfirm
                    title="Reject and restore stock?"
                    onConfirm={() => rejectMutation.mutate(vendor_return_id)}
                    okText="Yes"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger size="small" icon={<CloseOutlined />} />
                  </Popconfirm>
                </Tooltip>
              </>
            )}
            {status === 'Approved' && (
              <Tooltip title="Mark Completed">
                <Popconfirm
                  title="Mark this return as completed?"
                  onConfirm={() => completeMutation.mutate(vendor_return_id)}
                  okText="Yes"
                >
                  <Button type="primary" size="small" style={{ background: '#16a34a', borderColor: '#16a34a' }} icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}
            {(status === 'Completed' || status === 'Rejected') && (
              <span style={{ color: '#999', fontSize: 12 }}>—</span>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Vendor Returns"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            New Vendor Return
          </Button>
        }
      />
      <Card>
        <Table
          columns={columns}
          dataSource={vendorReturns?.data || []}
          rowKey="vendor_return_id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 15, showSizeChanger: true }}
        />
      </Card>

      <SliderModal
        title="Create Vendor Return"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setSelectedVendorId(null);
        }}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="vendor_id" label="Vendor" rules={[{ required: true, message: 'Select a vendor' }]}>
            <Select
              showSearch
              placeholder="Select vendor"
              optionFilterProp="label"
              onChange={(val) => {
                setSelectedVendorId(val);
                form.setFieldsValue({ grn_id: undefined });
              }}
              options={(vendors?.data || []).filter(v => v.is_active !== false).map(v => ({
                label: v.vendor_name,
                value: v.vendor_id
              }))}
            />
          </Form.Item>

          <Form.Item name="grn_id" label="GRN Reference (Optional)">
            <Select
              showSearch
              allowClear
              placeholder="Link to GRN"
              optionFilterProp="label"
              options={filteredGrns.map(g => ({
                label: g.grn_number,
                value: g.grn_id
              }))}
            />
          </Form.Item>

          <Form.Item name="item_id" label="Item" rules={[{ required: true, message: 'Select an item' }]}>
            <Select
              showSearch
              placeholder="Select item to return"
              optionFilterProp="label"
              options={(items?.data || []).map(i => ({
                label: `${i.item_name} (Stock: ${i.current_stock || 0})`,
                value: i.item_id
              }))}
            />
          </Form.Item>

          <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Enter quantity' }]}>
            <InputNumber min={1} placeholder="Return quantity" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="return_date" label="Return Date" rules={[{ required: true, message: 'Select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="reason" label="Return Reason" rules={[{ required: true, message: 'Select a reason' }]}>
            <Select placeholder="Select reason" options={RETURN_REASONS} />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} placeholder="Additional notes about the return..." />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default VendorReturn;
