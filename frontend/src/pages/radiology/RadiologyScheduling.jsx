import { useState } from 'react';
import { Card, Table, Button, Modal, Form, DatePicker, TimePicker, Select, Input, Tag } from 'antd';
import { CalendarOutlined, CheckOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/PageHeader';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { radiologyOrderService, radiologyReportService } from '@services/index';
import dayjs from 'dayjs';

const STATUS_COLORS = {
  Ordered: 'blue',
  Scheduled: 'orange',
  'In Progress': 'gold',
  Completed: 'cyan',
  Reported: 'green'
};

const RadiologyScheduling = () => {
  const [scheduleModal, setScheduleModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form] = Form.useForm();
  const [approveForm] = Form.useForm();

  const { data: orders, refetch } = useApiQuery(['radiology-orders'], () =>
    radiologyOrderService.getAll()
  );

  const scheduleMutation = useApiMutation(
    ({ orderId, data }) => radiologyOrderService.update(orderId, { ...data, status: 'Scheduled' }),
    {
      successMessage: 'Scheduled successfully',
      onSuccess: () => {
        refetch();
        setScheduleModal(false);
        form.resetFields();
      }
    }
  );

  const statusMutation = useApiMutation(
    ({ orderId, status }) => radiologyOrderService.update(orderId, { status }),
    {
      successMessage: 'Status updated',
      onSuccess: refetch
    }
  );

  const approveMutation = useApiMutation(
    async ({ orderId, data }) => {
      await radiologyReportService.create({ rad_order_id: orderId, ...data });
      return radiologyOrderService.update(orderId, { status: 'Reported' });
    },
    {
      successMessage: 'Report approved',
      onSuccess: () => {
        refetch();
        setApproveModal(false);
        approveForm.resetFields();
      }
    }
  );

  const handleSchedule = (record) => {
    setSelectedOrder(record);
    setScheduleModal(true);
  };

  const handleApprove = (record) => {
    setSelectedOrder(record);
    approveForm.resetFields();
    setApproveModal(true);
  };

  const columns = [
    { title: 'Order ID', dataIndex: 'rad_order_id', key: 'rad_order_id' },
    {
      title: 'Patient',
      key: 'patient_name',
      render: (_, r) => r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : '-'
    },
    { title: 'Test', dataIndex: 'test_name', key: 'test_name' },
    { title: 'Modality', dataIndex: 'modality', key: 'modality' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={STATUS_COLORS[status] || 'default'}>{status}</Tag>
    },
    {
      title: 'Scheduled',
      key: 'scheduled',
      render: (_, r) =>
        r.scheduled_date
          ? `${dayjs(r.scheduled_date).format('DD-MM-YYYY')}${r.scheduled_time ? ' ' + r.scheduled_time.slice(0, 5) : ''}`
          : '-'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <>
          {record.status === 'Ordered' && (
            <Button size="small" icon={<CalendarOutlined />} onClick={() => handleSchedule(record)}>
              Schedule
            </Button>
          )}
          {record.status === 'Scheduled' && (
            <Button
              size="small"
              type="primary"
              onClick={() => statusMutation.mutate({ orderId: record.rad_order_id, status: 'Completed' })}
            >
              Mark Completed
            </Button>
          )}
          {record.status === 'Completed' && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
              Approve
            </Button>
          )}
        </>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Radiology Scheduling & Approval" />
      <Card>
        <Table columns={columns} dataSource={orders?.data || []} rowKey="rad_order_id" />
      </Card>

      <Modal
        title="Schedule Imaging"
        open={scheduleModal}
        onCancel={() => setScheduleModal(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            scheduleMutation.mutate({
              orderId: selectedOrder.rad_order_id,
              data: {
                scheduled_date: values.scheduled_date.format('YYYY-MM-DD'),
                scheduled_time: values.scheduled_time.format('HH:mm:ss')
              }
            })
          }
        >
          <Form.Item name="scheduled_date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>
          <Form.Item name="scheduled_time" label="Time" rules={[{ required: true }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="modality_room" label="Room">
            <Select
              allowClear
              options={[
                { label: 'X-Ray Room 1', value: 'XRAY-1' },
                { label: 'CT Room', value: 'CT-1' },
                { label: 'MRI Room', value: 'MRI-1' },
                { label: 'USG Room', value: 'USG-1' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Approve Report"
        open={approveModal}
        onCancel={() => setApproveModal(false)}
        onOk={() => approveForm.submit()}
        destroyOnHidden
        styles={{ body: { width: 600 } }}
      >
        <Form
          form={approveForm}
          layout="vertical"
          onFinish={(values) =>
            approveMutation.mutate({
              orderId: selectedOrder.rad_order_id,
              data: values
            })
          }
        >
          <Form.Item name="findings" label="Findings" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="impression" label="Impression" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="radiologist_notes" label="Radiologist Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RadiologyScheduling;
