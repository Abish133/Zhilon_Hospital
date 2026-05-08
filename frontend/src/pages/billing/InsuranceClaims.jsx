import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Tag, App, Card, Statistic, Row, Col,
  Drawer, Space, Tabs, Descriptions
} from 'antd';
import SliderModal from '@components/common/SliderModal';
import {
  PlusOutlined, CheckOutlined, CloseOutlined, DollarOutlined, FileTextOutlined,
  DeleteOutlined, EyeOutlined
} from '@ant-design/icons';
import insuranceClaimService from '@services/InsuranceClaimService';
import dayjs from 'dayjs';

const InsuranceClaims = () => {
  const { message, modal } = App.useApp();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [stats, setStats] = useState(null);
  const [form] = Form.useForm();
  const [tabActive, setTabActive] = useState('all');

  useEffect(() => {
    fetchClaims();
    fetchStats();
  }, [tabActive]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      let filters = {};
      if (tabActive !== 'all') {
        filters.status = tabActive;
      }
      const response = await insuranceClaimService.getClaims(filters);
      // apiClient interceptor unwraps axios -> body is { success, data, count }
      setClaims(response?.data || []);
    } catch (error) {
      message.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await insuranceClaimService.getClaimStats();
      setStats(response?.data || null);
    } catch (error) {
    }
  };

  const handleCreateClaim = async (values) => {
    try {
      setLoading(true);
      await insuranceClaimService.createClaim(values.bill_id, {
        provider: values.insurance_provider,
        policyNumber: values.policy_number,
        memberId: values.member_id,
        claimAmount: values.claim_amount,
        deductible: values.deductible || 0,
        copay: values.copay || 0,
        hospitalId: 1
      });
      message.success('Claim created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchClaims();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create claim');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClaim = async (id) => {
    modal.confirm({
      title: 'Approve Claim',
      content: 'Are you sure you want to approve this claim?',
      okText: 'Approve',
      onOk: async () => {
        try {
          const claim = claims.find(c => c.id === id);
          await insuranceClaimService.approveClaim(id, {
            approvedAmount: claim.claim_amount,
            approvalDate: new Date()
          });
          message.success('Claim approved successfully');
          fetchClaims();
          fetchStats();
        } catch (error) {
          message.error('Failed to approve claim');
        }
      }
    });
  };

  const handleRejectClaim = async (id) => {
    const rejectionReasonRef = { current: '' };
    
    modal.confirm({
      title: 'Reject Claim',
      content: (
        <Form>
          <Form.Item label="Rejection Reason">
            <Input.TextArea 
              rows={4} 
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
          await insuranceClaimService.rejectClaim(id, reason);
          message.success('Claim rejected successfully');
          fetchClaims();
          fetchStats();
        } catch (error) {
          message.error('Failed to reject claim');
        }
      }
    });
  };

  const handleProcessPayment = async (id) => {
    const paymentDataRef = { current: { amount: '', reference: '' } };
    
    modal.confirm({
      title: 'Process Payment',
      content: (
        <Form>
          <Form.Item label="Payment Amount">
            <Input 
              type="number" 
              onChange={(e) => { paymentDataRef.current.amount = e.target.value; }}
            />
          </Form.Item>
          <Form.Item label="Reference Number">
            <Input 
              onChange={(e) => { paymentDataRef.current.reference = e.target.value; }}
            />
          </Form.Item>
        </Form>
      ),
      okText: 'Process',
      onOk: async () => {
        const { amount, reference } = paymentDataRef.current;

        if (!amount || !reference) {
          message.error('Please fill in all fields');
          return;
        }

        try {
          await insuranceClaimService.processPayment(id, {
            amount: parseFloat(amount),
            date: new Date(),
            reference
          });
          message.success('Payment processed successfully');
          fetchClaims();
          fetchStats();
        } catch (error) {
          message.error('Failed to process payment');
        }
      }
    });
  };

  const handleViewClaim = async (id) => {
    try {
      const response = await insuranceClaimService.getClaimById(id);
      setSelectedClaim(response?.data || null);
      setDrawerVisible(true);
    } catch (error) {
      message.error('Failed to load claim details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'blue',
      submitted: 'cyan',
      approved: 'green',
      paid: 'success',
      rejected: 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Claim #',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Bill #',
      dataIndex: 'bill_id',
      key: 'bill_id',
      render: (bill_id) => `Bill #${bill_id}`
    },
    {
      title: 'Insurance Provider',
      dataIndex: 'insurance_provider',
      key: 'insurance_provider'
    },
    {
      title: 'Claim Amount',
      dataIndex: 'claim_amount',
      key: 'claim_amount',
      render: (amount) => `₹${parseFloat(amount).toFixed(2)}`,
      align: 'right'
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
      title: 'Date',
      dataIndex: 'claim_date',
      key: 'claim_date',
      render: (date) => dayjs(date).format('DD-MM-YYYY')
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
            onClick={() => handleViewClaim(record.id)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApproveClaim(record.id)}
                style={{ color: 'green' }}
              >
                Approve
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleRejectClaim(record.id)}
                danger
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button
              type="link"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handleProcessPayment(record.id)}
              style={{ color: 'green' }}
            >
              Pay
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Insurance Claims</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Create Claim
        </Button>
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pending || 0}
                suffix="claims"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Submitted"
                value={stats.submitted || 0}
                suffix="claims"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Approved"
                value={stats.approved || 0}
                suffix="claims"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Paid"
                value={stats.paid || 0}
                suffix="claims"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        activeKey={tabActive}
        onChange={setTabActive}
        items={[
          { key: 'all', label: 'All Claims' },
          { key: 'pending', label: 'Pending' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'approved', label: 'Approved' },
          { key: 'paid', label: 'Paid' },
          { key: 'rejected', label: 'Rejected' }
        ]}
      />

      <Card style={{ marginTop: '16px' }}>
        <Table
          columns={columns}
          dataSource={claims}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <SliderModal
        title="Create Insurance Claim"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} onFinish={handleCreateClaim} layout="vertical">
          <Form.Item label="Bill ID" name="bill_id" rules={[{ required: true }]}>
            <Input placeholder="Enter bill ID" />
          </Form.Item>

          <Form.Item label="Insurance Provider" name="insurance_provider" rules={[{ required: true }]}>
            <Input placeholder="Insurance company name" />
          </Form.Item>

          <Form.Item label="Policy Number" name="policy_number" rules={[{ required: true }]}>
            <Input placeholder="Policy number" />
          </Form.Item>

          <Form.Item label="Member ID" name="member_id">
            <Input placeholder="Member/Patient ID" />
          </Form.Item>

          <Form.Item label="Claim Amount" name="claim_amount" rules={[{ required: true }]}>
            <Input type="number" placeholder="Amount to claim" />
          </Form.Item>

          <Form.Item label="Deductible" name="deductible">
            <Input type="number" placeholder="Deductible amount" />
          </Form.Item>

          <Form.Item label="Copay" name="copay">
            <Input type="number" placeholder="Copay amount" />
          </Form.Item>
        </Form>
      </SliderModal>

      {selectedClaim && (
        <Drawer
          title="Claim Details"
          placement="right"
          onClose={() => {
            setDrawerVisible(false);
            setSelectedClaim(null);
          }}
          open={drawerVisible}
          width={400}
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Claim ID">{selectedClaim.id}</Descriptions.Item>
            <Descriptions.Item label="Bill ID">{selectedClaim.bill_id}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedClaim.status)}>
                {selectedClaim.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Insurance Provider">
              {selectedClaim.insurance_provider}
            </Descriptions.Item>
            <Descriptions.Item label="Policy Number">
              {selectedClaim.policy_number}
            </Descriptions.Item>
            <Descriptions.Item label="Member ID">
              {selectedClaim.member_id || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Claim Amount">
              ₹{parseFloat(selectedClaim.claim_amount).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Approved Amount">
              {selectedClaim.approved_amount ? `₹${parseFloat(selectedClaim.approved_amount).toFixed(2)}` : 'Pending'}
            </Descriptions.Item>
            <Descriptions.Item label="Paid Amount">
              {selectedClaim.paid_amount ? `₹${parseFloat(selectedClaim.paid_amount).toFixed(2)}` : 'Not paid'}
            </Descriptions.Item>
            <Descriptions.Item label="Claim Date">
              {dayjs(selectedClaim.claim_date).format('DD-MM-YYYY')}
            </Descriptions.Item>
          </Descriptions>
        </Drawer>
      )}
    </div>
  );
};

export default InsuranceClaims;
