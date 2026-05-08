import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, message, Card, Statistic, Row, Col,
  DatePicker, Drawer, Space, Tabs, Descriptions, Empty, Alert
} from 'antd';
import SliderModal from '@components/common/SliderModal';
import {
  PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { leaveRequestService, employeeService } from '@services/index';
import { useAuthStore } from '@store/index';

const { RangePicker } = DatePicker;

// Number of inclusive days between two dayjs dates (or null if either missing).
const calcDays = (from, to) => {
  if (!from || !to) return null;
  return to.startOf('day').diff(from.startOf('day'), 'day') + 1;
};

const LeaveRequests = () => {
  const { user } = useAuthStore();
  // HR/Admin can approve/reject + see everyone; everyone else only sees their own list.
  const role = (user?.role || '').toLowerCase();
  const isAdminOrHr = role === 'admin' || role === 'hr';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [tabActive, setTabActive] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [createForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [rejectingId, setRejectingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tabActive !== 'all') params.status = tabActive;
      // Non-HR users only see their own leave history.
      if (!isAdminOrHr && user?.employee_id) params.employee_id = user.employee_id;
      const res = await leaveRequestService.list(params);
      setRequests(res?.data || []);
    } catch (err) {
      message.error(err?.message || 'Failed to load leave requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // HR/Admin needs the full employee list for the "Request leave on behalf of" dropdown.
  const fetchEmployeesIfNeeded = async () => {
    if (!isAdminOrHr) return;
    try {
      const res = await employeeService.getAll({ is_active: true });
      setEmployees(res?.data || res || []);
    } catch {
      // Non-fatal — admins can still type employee_id manually if they know it.
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActive]);

  useEffect(() => {
    fetchEmployeesIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Computed stats off the loaded list — keeps the cards in sync without an extra round-trip.
  const stats = useMemo(() => {
    const s = { pending: 0, approved: 0, rejected: 0, total: requests.length };
    for (const r of requests) {
      if (s[r.status] != null) s[r.status]++;
    }
    return s;
  }, [requests]);

  const handleCreateRequest = async (values) => {
    setSubmitting(true);
    try {
      const employee_id = isAdminOrHr ? values.employee_id : user?.employee_id;
      if (!employee_id) {
        message.error('Your account is not linked to an employee record. Ask HR to link it before requesting leave.');
        return;
      }
      const [from, to] = values.date_range;
      await leaveRequestService.create({
        employee_id,
        leave_type: values.leave_type,
        from_date: from.format('YYYY-MM-DD'),
        to_date: to.format('YYYY-MM-DD'),
        reason: values.reason
      });
      message.success('Leave request submitted');
      setIsModalVisible(false);
      createForm.resetFields();
      await fetchRequests();
    } catch (err) {
      message.error(err?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = (record) => {
    Modal.confirm({
      title: 'Approve leave request',
      content: `Approve ${record.no_of_days} day(s) of ${record.leave_type} leave for ${record.employee?.full_name || `Employee #${record.employee_id}`}?`,
      okText: 'Approve',
      onOk: async () => {
        try {
          await leaveRequestService.approve(record.id, '');
          message.success('Leave request approved');
          fetchRequests();
        } catch (err) {
          message.error(err?.message || 'Failed to approve');
        }
      }
    });
  };

  const handleRejectClick = (record) => {
    setRejectingId(record.id);
    rejectForm.resetFields();
  };

  const handleRejectSubmit = async (values) => {
    try {
      await leaveRequestService.reject(rejectingId, values.rejection_reason);
      message.success('Leave request rejected');
      setRejectingId(null);
      fetchRequests();
    } catch (err) {
      message.error(err?.message || 'Failed to reject');
    }
  };

  const handleView = (record) => {
    setSelectedRequest(record);
    setDrawerVisible(true);
  };

  const statusColor = {
    pending: 'blue', approved: 'green', rejected: 'red', cancelled: 'orange'
  };
  const leaveTypeColor = {
    casual: 'blue', medical: 'red', earned: 'green', unpaid: 'orange'
  };

  const columns = [
    { title: 'Request #', dataIndex: 'id', key: 'id', width: 90 },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, r) => r.employee?.full_name || `Employee #${r.employee_id}`
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      render: (t) => <Tag color={leaveTypeColor[t]}>{(t || '').toUpperCase()}</Tag>
    },
    {
      title: 'From',
      dataIndex: 'from_date',
      render: (d) => d ? dayjs(d).format('DD-MM-YYYY') : '—'
    },
    {
      title: 'To',
      dataIndex: 'to_date',
      render: (d) => d ? dayjs(d).format('DD-MM-YYYY') : '—'
    },
    { title: 'Days', dataIndex: 'no_of_days', align: 'center', render: (v) => v != null ? Number(v) : '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => <Tag color={statusColor[s]}>{(s || '').toUpperCase()}</Tag>
    },
    {
      title: 'Requested',
      dataIndex: 'requested_date',
      render: (d) => d ? dayjs(d).format('DD-MM-YYYY') : '—'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
          {isAdminOrHr && record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: 'green' }} onClick={() => handleApprove(record)}>
                Approve
              </Button>
              <Button type="link" size="small" icon={<CloseOutlined />} danger onClick={() => handleRejectClick(record)}>
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const dateRange = Form.useWatch('date_range', createForm);
  const calculatedDays = calcDays(dateRange?.[0], dateRange?.[1]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Leave Requests</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          // Without an employee_id, a non-HR user can't be the leave subject.
          disabled={!isAdminOrHr && !user?.employee_id}
        >
          Request Leave
        </Button>
      </div>

      {!isAdminOrHr && !user?.employee_id && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Your account isn't linked to an employee record"
          description="Ask HR to link your user to your employee profile so you can submit leave requests."
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}><Card><Statistic title="Pending"  value={stats.pending}  suffix="requests" /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Approved" value={stats.approved} suffix="requests" /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Rejected" value={stats.rejected} suffix="requests" /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Total"    value={stats.total}    suffix="requests" /></Card></Col>
      </Row>

      <Tabs
        activeKey={tabActive}
        onChange={setTabActive}
        items={[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' }
        ]}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          loading={loading}
          rowKey="id"
          locale={{ emptyText: <Empty description="No leave requests yet" /> }}
        />
      </Card>

      <SliderModal
        title="Request Leave"
        open={isModalVisible}
        onOk={() => createForm.submit()}
        confirmLoading={submitting}
        onCancel={() => { setIsModalVisible(false); createForm.resetFields(); }}
        width={600}
      >
        <Form form={createForm} onFinish={handleCreateRequest} layout="vertical" initialValues={{ leave_type: 'casual' }}>
          {isAdminOrHr && (
            <Form.Item label="Employee" name="employee_id" rules={[{ required: true, message: 'Select an employee' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select employee"
                options={employees.map(e => ({
                  value: e.employee_id,
                  label: `${e.full_name} (${e.emp_code})`
                }))}
              />
            </Form.Item>
          )}

          <Form.Item label="Leave Type" name="leave_type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="casual">Casual Leave</Select.Option>
              <Select.Option value="medical">Medical Leave</Select.Option>
              <Select.Option value="earned">Earned Leave</Select.Option>
              <Select.Option value="unpaid">Unpaid Leave</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="From – To"
            name="date_range"
            rules={[{ required: true, message: 'Pick the leave dates' }]}
          >
            <RangePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>

          {calculatedDays != null && (
            <div style={{ marginBottom: 16, padding: '6px 12px', background: '#f5f5f5', borderRadius: 4 }}>
              Total: <strong>{calculatedDays}</strong> day(s)
            </div>
          )}

          <Form.Item label="Reason" name="reason" rules={[{ required: true, message: 'Please specify a reason' }]}>
            <Input.TextArea rows={4} placeholder="Reason for leave" />
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Reject reason modal — separate so the form value is captured cleanly */}
      <Modal
        title="Reject Leave Request"
        open={!!rejectingId}
        onCancel={() => setRejectingId(null)}
        onOk={() => rejectForm.submit()}
        okText="Reject"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <Form form={rejectForm} onFinish={handleRejectSubmit} layout="vertical">
          <Form.Item
            label="Rejection Reason"
            name="rejection_reason"
            rules={[{ required: true, message: 'Provide a reason so the employee knows why' }]}
          >
            <Input.TextArea rows={4} placeholder="Why is this leave being rejected?" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Leave Request Details"
        placement="right"
        onClose={() => { setDrawerVisible(false); setSelectedRequest(null); }}
        open={drawerVisible}
        width={420}
      >
        {selectedRequest && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Request ID">{selectedRequest.id}</Descriptions.Item>
            <Descriptions.Item label="Employee">
              {selectedRequest.employee?.full_name || `Employee #${selectedRequest.employee_id}`}
            </Descriptions.Item>
            <Descriptions.Item label="Leave Type">
              <Tag color={leaveTypeColor[selectedRequest.leave_type]}>
                {(selectedRequest.leave_type || '').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="From">{dayjs(selectedRequest.from_date).format('DD-MM-YYYY')}</Descriptions.Item>
            <Descriptions.Item label="To">{dayjs(selectedRequest.to_date).format('DD-MM-YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Days">{Number(selectedRequest.no_of_days)}</Descriptions.Item>
            <Descriptions.Item label="Reason">{selectedRequest.reason}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColor[selectedRequest.status]}>{(selectedRequest.status || '').toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Requested On">
              {selectedRequest.requested_date ? dayjs(selectedRequest.requested_date).format('DD-MM-YYYY HH:mm') : '—'}
            </Descriptions.Item>
            {selectedRequest.approval_date && (
              <Descriptions.Item label={selectedRequest.status === 'rejected' ? 'Rejected On' : 'Approved On'}>
                {dayjs(selectedRequest.approval_date).format('DD-MM-YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {selectedRequest.approver?.name && (
              <Descriptions.Item label="By">{selectedRequest.approver.name}</Descriptions.Item>
            )}
            {selectedRequest.approval_comments && (
              <Descriptions.Item label="Comments">{selectedRequest.approval_comments}</Descriptions.Item>
            )}
            {selectedRequest.rejection_reason && (
              <Descriptions.Item label="Rejection Reason">{selectedRequest.rejection_reason}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default LeaveRequests;
