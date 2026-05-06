import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, message, Card, Statistic, Row, Col,
  DatePicker, Drawer, Space, Tabs, Descriptions, InputNumber
} from 'antd';
import SliderModal from '@components/common/SliderModal';
import {
  PlusOutlined, CheckOutlined, CloseOutlined, CalendarOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [stats, setStats] = useState(null);
  const [form] = Form.useForm();
  const [tabActive, setTabActive] = useState('all');

  // Mock data - Replace with API calls
  const mockRequests = [
    {
      id: 1,
      employee_id: 'EMP001',
      employee_name: 'John Doe',
      leave_type: 'casual',
      from_date: '2024-02-20',
      to_date: '2024-02-22',
      no_of_days: 3,
      reason: 'Personal work',
      status: 'pending',
      created_at: '2024-02-15',
      approver_id: null,
      approval_date: null
    },
    {
      id: 2,
      employee_id: 'EMP002',
      employee_name: 'Jane Smith',
      leave_type: 'medical',
      from_date: '2024-02-18',
      to_date: '2024-02-19',
      no_of_days: 2,
      reason: 'Medical appointment',
      status: 'approved',
      created_at: '2024-02-10',
      approver_id: 'EMP100',
      approval_date: '2024-02-11'
    }
  ];

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [tabActive]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      let filtered = mockRequests;
      if (tabActive !== 'all') {
        filtered = mockRequests.filter(r => r.status === tabActive);
      }
      setRequests(filtered);
    } catch (error) {
      message.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - replace with actual API call
      const mockStats = {
        pending: mockRequests.filter(r => r.status === 'pending').length,
        approved: mockRequests.filter(r => r.status === 'approved').length,
        rejected: mockRequests.filter(r => r.status === 'rejected').length,
        total: mockRequests.length
      };
      setStats(mockStats);
    } catch (error) {
    }
  };

  const handleCreateRequest = async (values) => {
    try {
      setLoading(true);
      const newRequest = {
        id: Math.max(...requests.map(r => r.id), 0) + 1,
        employee_id: 'EMP001',
        employee_name: 'Current User',
        leave_type: values.leave_type,
        from_date: values.from_date.format('YYYY-MM-DD'),
        to_date: values.to_date.format('YYYY-MM-DD'),
        no_of_days: values.no_of_days,
        reason: values.reason,
        status: 'pending',
        created_at: dayjs().format('YYYY-MM-DD'),
        approver_id: null,
        approval_date: null
      };
      
      setRequests([...requests, newRequest]);
      message.success('Leave request submitted successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchStats();
    } catch (error) {
      message.error('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id) => {
    Modal.confirm({
      title: 'Approve Leave Request',
      content: 'Are you sure you want to approve this leave request?',
      okText: 'Approve',
      onOk: async () => {
        try {
          setRequests(
            requests.map(r =>
              r.id === id
                ? { ...r, status: 'approved', approval_date: dayjs().format('YYYY-MM-DD') }
                : r
            )
          );
          message.success('Leave request approved successfully');
          fetchStats();
        } catch (error) {
          message.error('Failed to approve request');
        }
      }
    });
  };

  const handleRejectRequest = async (id) => {
    const rejectionReasonRef = { current: '' };
    
    Modal.confirm({
      title: 'Reject Leave Request',
      content: (
        <Form>
          <Form.Item label="Rejection Reason">
            <Input.TextArea
              rows={3}
              onChange={(e) => { rejectionReasonRef.current = e.target.value; }}
            />
          </Form.Item>
        </Form>
      ),
      okText: 'Reject',
      onOk: async () => {
        const reason = rejectionReasonRef.current;
        if (!reason) {
          message.error('Please provide rejection reason');
          return;
        }
        try {
          setRequests(
            requests.map(r =>
              r.id === id
                ? { ...r, status: 'rejected', rejection_reason: reason }
                : r
            )
          );
          message.success('Leave request rejected successfully');
          fetchStats();
        } catch (error) {
          message.error('Failed to reject request');
        }
      }
    });
  };

  const handleViewRequest = (id) => {
    const request = requests.find(r => r.id === id);
    setSelectedRequest(request);
    setDrawerVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'blue',
      approved: 'green',
      rejected: 'red',
      cancelled: 'orange'
    };
    return colors[status] || 'default';
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      casual: 'blue',
      medical: 'red',
      earned: 'green',
      unpaid: 'orange'
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: 'Request #',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name'
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      render: (type) => (
        <Tag color={getLeaveTypeColor(type)}>
          {type?.charAt(0).toUpperCase() + type?.slice(1)}
        </Tag>
      )
    },
    {
      title: 'From Date',
      dataIndex: 'from_date',
      key: 'from_date',
      render: (date) => dayjs(date).format('DD-MM-YYYY')
    },
    {
      title: 'To Date',
      dataIndex: 'to_date',
      key: 'to_date',
      render: (date) => dayjs(date).format('DD-MM-YYYY')
    },
    {
      title: 'Days',
      dataIndex: 'no_of_days',
      key: 'no_of_days',
      align: 'center'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewRequest(record.id)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApproveRequest(record.id)}
                style={{ color: 'green' }}
              >
                Approve
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleRejectRequest(record.id)}
                danger
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Leave Requests</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Request Leave
        </Button>
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pending || 0}
                suffix="requests"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Approved"
                value={stats.approved || 0}
                suffix="requests"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Rejected"
                value={stats.rejected || 0}
                suffix="requests"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total"
                value={stats.total || 0}
                suffix="requests"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        activeKey={tabActive}
        onChange={setTabActive}
        items={[
          { key: 'all', label: 'All Requests' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' }
        ]}
      />

      <Card style={{ marginTop: '16px' }}>
        <Table
          columns={columns}
          dataSource={requests}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <SliderModal
        title="Request Leave"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleCreateRequest}
          layout="vertical"
          initialValues={{
            leave_type: 'casual'
          }}
        >
          <Form.Item label="Leave Type" name="leave_type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="casual">Casual Leave</Select.Option>
              <Select.Option value="medical">Medical Leave</Select.Option>
              <Select.Option value="earned">Earned Leave</Select.Option>
              <Select.Option value="unpaid">Unpaid Leave</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="From Date" name="from_date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="To Date" name="to_date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Number of Days" name="no_of_days" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Reason" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Please specify the reason for leave" />
          </Form.Item>
        </Form>
      </SliderModal>

      {selectedRequest && (
        <Drawer
          title="Leave Request Details"
          placement="right"
          onClose={() => {
            setDrawerVisible(false);
            setSelectedRequest(null);
          }}
          open={drawerVisible}
          width={400}
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Request ID">{selectedRequest.id}</Descriptions.Item>
            <Descriptions.Item label="Employee">
              {selectedRequest.employee_name}
            </Descriptions.Item>
            <Descriptions.Item label="Leave Type">
              <Tag color={getLeaveTypeColor(selectedRequest.leave_type)}>
                {selectedRequest.leave_type?.charAt(0).toUpperCase() + selectedRequest.leave_type?.slice(1)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="From Date">
              {dayjs(selectedRequest.from_date).format('DD-MM-YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="To Date">
              {dayjs(selectedRequest.to_date).format('DD-MM-YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Number of Days">
              {selectedRequest.no_of_days}
            </Descriptions.Item>
            <Descriptions.Item label="Reason">
              {selectedRequest.reason}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedRequest.status)}>
                {selectedRequest.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Request Date">
              {dayjs(selectedRequest.created_at).format('DD-MM-YYYY')}
            </Descriptions.Item>
            {selectedRequest.approval_date && (
              <Descriptions.Item label="Approval Date">
                {dayjs(selectedRequest.approval_date).format('DD-MM-YYYY')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Drawer>
      )}
    </div>
  );
};

export default LeaveRequests;
