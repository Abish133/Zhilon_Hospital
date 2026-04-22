import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker,
  message, Tag, Spin, Popconfirm
} from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { doctorLeaveService, doctorService } from '@/services';
import { useAuthStore } from '@/store';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const LEAVE_TYPES = ['Casual', 'Sick', 'Conference', 'Personal', 'Emergency'];

const STATUS_COLORS = {
  Pending: 'orange',
  Approved: 'green',
  Rejected: 'red',
  Cancelled: 'default'
};

const DoctorLeaves = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterDoctor, setFilterDoctor] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isApprover = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [filterDoctor, filterStatus]);

  const fetchDoctors = async () => {
    try {
      const response = await doctorService.getAll();
      if (response.success) setDoctors(response.data || []);
    } catch {
      message.error('Failed to load doctors');
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDoctor) params.doctor_id = filterDoctor;
      if (filterStatus) params.status = filterStatus;
      const response = await doctorLeaveService.getAll(params);
      if (response.success) setLeaves(response.data || []);
    } catch {
      message.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      doctor_id: filterDoctor || undefined,
      leave_type: 'Casual'
    });
    setModalOpen(true);
  };

  const handleStatusChange = async (id, status) => {
    try {
      const response = await doctorLeaveService.updateStatus(id, status);
      if (response.success) {
        message.success(`Leave ${status.toLowerCase()}`);
        fetchLeaves();
      }
    } catch (error) {
      message.error(error?.response?.data?.message || `Failed to ${status.toLowerCase()} leave`);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await doctorLeaveService.delete(id);
      if (response.success) {
        message.success('Leave record removed');
        fetchLeaves();
      }
    } catch {
      message.error('Failed to remove leave');
    }
  };

  const handleSubmit = async (values) => {
    if (!user?.hospital_id) {
      message.error('Hospital context missing');
      return;
    }
    setSubmitting(true);
    try {
      const [from, to] = values.range || [];
      const payload = {
        doctor_id: values.doctor_id,
        hospital_id: user.hospital_id,
        leave_type: values.leave_type,
        reason: values.reason,
        from_date: from ? from.format('YYYY-MM-DD') : null,
        to_date: to ? to.format('YYYY-MM-DD') : null
      };
      const response = await doctorLeaveService.create(payload);
      if (response.success) {
        message.success('Leave request submitted');
        setModalOpen(false);
        fetchLeaves();
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSubmitting(false);
    }
  };

  const doctorName = (id) => doctors.find(d => d.id === id)?.name || `#${id}`;

  const daysBetween = (from, to) => {
    if (!from || !to) return 0;
    return dayjs(to).diff(dayjs(from), 'day') + 1;
  };

  const columns = [
    { title: 'Doctor', dataIndex: 'doctor_id', render: (id) => doctorName(id) },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      render: (v) => <Tag color="blue">{v}</Tag>
    },
    {
      title: 'From',
      dataIndex: 'from_date',
      render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '-'
    },
    {
      title: 'To',
      dataIndex: 'to_date',
      render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '-'
    },
    {
      title: 'Days',
      key: 'days',
      align: 'center',
      render: (_, r) => daysBetween(r.from_date, r.to_date)
    },
    { title: 'Reason', dataIndex: 'reason', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {isApprover && record.status === 'Pending' && (
            <>
              <Popconfirm
                title="Approve this leave?"
                onConfirm={() => handleStatusChange(record.leave_id, 'Approved')}
              >
                <Button icon={<CheckOutlined />} size="small" type="primary" />
              </Popconfirm>
              <Popconfirm
                title="Reject this leave?"
                onConfirm={() => handleStatusChange(record.leave_id, 'Rejected')}
                okButtonProps={{ danger: true }}
              >
                <Button icon={<CloseOutlined />} size="small" danger />
              </Popconfirm>
            </>
          )}
          {record.status === 'Pending' && (
            <Popconfirm
              title="Cancel this leave?"
              onConfirm={() => handleStatusChange(record.leave_id, 'Cancelled')}
            >
              <Button size="small">Cancel</Button>
            </Popconfirm>
          )}
          {isApprover && (
            <Popconfirm
              title="Delete this record?"
              onConfirm={() => handleDelete(record.leave_id)}
              okButtonProps={{ danger: true }}
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1e293b' }}>Doctor Leaves</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
          Submit and approve leave requests for doctors
        </p>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 280 }}
            placeholder="Filter by doctor"
            allowClear
            showSearch
            optionFilterProp="label"
            value={filterDoctor}
            onChange={setFilterDoctor}
            options={doctors.map(d => ({ label: `${d.name} (${d.specialization})`, value: d.id }))}
          />
          <Select
            style={{ width: 180 }}
            placeholder="Filter by status"
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
            options={['Pending', 'Approved', 'Rejected', 'Cancelled'].map(s => ({ label: s, value: s }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Apply for Leave
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={leaves}
            rowKey="leave_id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      <Modal
        title="Apply for Leave"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="doctor_id"
            label="Doctor"
            rules={[{ required: true, message: 'Please select a doctor' }]}
          >
            <Select
              showSearch
              placeholder="Select doctor"
              optionFilterProp="label"
              options={doctors.map(d => ({ label: `${d.name} (${d.specialization})`, value: d.id }))}
            />
          </Form.Item>
          <Form.Item
            name="leave_type"
            label="Leave Type"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select options={LEAVE_TYPES.map(t => ({ label: t, value: t }))} />
          </Form.Item>
          <Form.Item
            name="range"
            label="From - To"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))}
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={3} placeholder="Reason for leave" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorLeaves;
