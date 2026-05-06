import { useState } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Table, Space, message, Row, Col, Tag, Descriptions } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { UndoOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import apiClient from '@services/apiClient';
import { formatCurrency, formatDate } from '@utils/helpers';
import DataTable from '@components/common/DataTable';
import { useAuthStore } from '@store/index';

const { Option } = Select;
const { TextArea } = Input;

const RefundManagement = () => {
  const [refundForm] = Form.useForm();
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const user = useAuthStore(s => s.user);

  // Fetch paid + partially-paid bills (refunds can apply to partial payments too)
  const { data: billsData, refetch: refetchBills } = useApiQuery(
    ['refundable-bills', searchQuery],
    async () => (await apiClient.get('/bills', {
      params: searchQuery ? { search: searchQuery } : {}
    })).data
  );

  // Fetch refunds
  const { data: refundsData, isLoading, refetch } = useApiQuery(
    ['refunds'],
    async () => (await apiClient.get('/refunds')).data
  );

  // Process refund mutation
  const processRefundMutation = useApiMutation(
    async (refundData) => (await apiClient.post('/refunds', refundData)).data,
    {
      onSuccess: () => {
        message.success('Refund processed successfully');
        setRefundModalOpen(false);
        refundForm.resetFields();
        setSelectedBill(null);
        refetch();
        refetchBills(); // bill paid_amount/balance changed â€” refresh the list
      },
      onError: (error) => {
        message.error(error.message || 'Failed to process refund');
      }
    }
  );

  const handleRefundSubmit = (values) => {
    if (!selectedBill) {
      message.error('Please select a bill for refund');
      return;
    }
    if (!user?.id) {
      message.error('Please log in again â€” user session expired');
      return;
    }

    processRefundMutation.mutate({
      ...values,
      bill_id: selectedBill.bill_id,
      patient_id: selectedBill.patient_id,
      approved_by: user.id,
      processed_by: user.id,
      hospital_id: selectedBill.hospital_id
    });
  };

  const bills = billsData?.data || [];
  const refunds = refundsData?.data || [];

  const billColumns = [
    {
      title: 'Bill No.',
      dataIndex: 'bill_number',
      key: 'bill_number',
      render: (billNo) => <Tag color="blue">{billNo}</Tag>
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.patient?.first_name} {record.patient?.last_name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            UHID: {record.patient?.uhid}
          </div>
        </div>
      )
    },
    {
      title: 'Bill Date',
      dataIndex: 'bill_date',
      key: 'bill_date',
      render: (date) => formatDate(date)
    },
    {
      title: 'Net Amount',
      dataIndex: 'net_amount',
      key: 'net_amount',
      render: (amount) => <div style={{ fontWeight: 600 }}>{formatCurrency(amount)}</div>
    },
    {
      title: 'Paid Amount',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (amount) => <span style={{ color: '#10b981' }}>{formatCurrency(amount)}</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<UndoOutlined />}
          onClick={() => {
            setSelectedBill(record);
            setRefundModalOpen(true);
          }}
        >
          Process Refund
        </Button>
      )
    }
  ];

  const refundColumns = [
    {
      title: 'Refund Date',
      dataIndex: 'refund_date',
      key: 'refund_date',
      render: (date) => formatDate(date)
    },
    {
      title: 'Bill No.',
      key: 'bill_number',
      render: (_, record) => (
        <Tag color="blue">{record.bill?.bill_number}</Tag>
      )
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.patient?.first_name} {record.patient?.last_name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            UHID: {record.patient?.uhid}
          </div>
        </div>
      )
    },
    {
      title: 'Refund Amount',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      render: (amount) => (
        <div style={{ fontWeight: 600, color: '#ef4444' }}>
          {formatCurrency(amount)}
        </div>
      )
    },
    {
      title: 'Refund Mode',
      dataIndex: 'refund_mode',
      key: 'refund_mode',
      render: (mode) => <Tag color="orange">{mode}</Tag>
    },
    {
      title: 'Reason',
      dataIndex: 'refund_reason',
      key: 'refund_reason',
      ellipsis: true
    },
    {
      title: 'Approved By',
      key: 'approved_by',
      render: (_, record) => record.approvedBy?.username
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            setSelectedRefund(record);
            setViewModalOpen(true);
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title="Paid Bills - Available for Refund"
            extra={
              <Input.Search
                placeholder="Search by UHID or Patient Name"
                onSearch={setSearchQuery}
                style={{ width: 300 }}
                allowClear
              />
            }
          >
            <Table
              columns={billColumns}
              dataSource={bills}
              rowKey="bill_id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Refund History" style={{ marginTop: 16 }}>
        <DataTable
          columns={refundColumns}
          dataSource={refunds}
          loading={isLoading}
          rowKey="refund_id"
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Refund Processing Modal */}
      <SliderModal
        title="Process Refund"
        open={refundModalOpen}
        onCancel={() => {
          setRefundModalOpen(false);
          setSelectedBill(null);
          refundForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedBill && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Bill Number" span={2}>
                <Tag color="blue">{selectedBill.bill_number}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Patient">
                {selectedBill.patient?.first_name} {selectedBill.patient?.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="UHID">
                {selectedBill.patient?.uhid}
              </Descriptions.Item>
              <Descriptions.Item label="Bill Date">
                {formatDate(selectedBill.bill_date)}
              </Descriptions.Item>
              <Descriptions.Item label="Net Amount">
                <strong style={{ color: '#0a0a0a' }}>
                  {formatCurrency(selectedBill.net_amount)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Paid Amount" span={2}>
                <strong style={{ color: '#10b981' }}>
                  {formatCurrency(selectedBill.paid_amount)}
                </strong>
              </Descriptions.Item>
            </Descriptions>

            <Form form={refundForm} layout="vertical" onFinish={handleRefundSubmit}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="refund_amount"
                    label="Refund Amount"
                    rules={[
                      { required: true, message: 'Please enter refund amount' },
                      {
                        validator: (_, value) => {
                          if (value && value > selectedBill.paid_amount) {
                            return Promise.reject('Refund amount cannot exceed paid amount');
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={selectedBill.paid_amount}
                      formatter={value => `â‚¹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/â‚¹\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="refund_mode"
                    label="Refund Mode"
                    rules={[{ required: true, message: 'Please select refund mode' }]}
                  >
                    <Select>
                      <Option value="Cash">Cash</Option>
                      <Option value="Bank Transfer">Bank Transfer</Option>
                      <Option value="Cheque">Cheque</Option>
                      <Option value="Card Reversal">Card Reversal</Option>
                      <Option value="UPI Reversal">UPI Reversal</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="refund_reason"
                label="Refund Reason"
                rules={[{ required: true, message: 'Please provide refund reason' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Explain the reason for refund..."
                />
              </Form.Item>

              <Form.Item name="bank_details" label="Bank Details (if applicable)">
                <TextArea
                  rows={2}
                  placeholder="Account number, IFSC code, etc."
                />
              </Form.Item>

              <Form.Item>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setRefundModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CheckCircleOutlined />}
                    loading={processRefundMutation.isPending}
                  >
                    Process Refund
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </SliderModal>

      {/* View Refund Details Modal */}
      <SliderModal
        title="Refund Details"
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setSelectedRefund(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedRefund && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Refund Date" span={2}>
              {formatDate(selectedRefund.refund_date)}
            </Descriptions.Item>
            <Descriptions.Item label="Bill Number">
              <Tag color="blue">{selectedRefund.bill?.bill_number}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Patient">
              {selectedRefund.patient?.first_name} {selectedRefund.patient?.last_name}
            </Descriptions.Item>
            <Descriptions.Item label="UHID">
              {selectedRefund.patient?.uhid}
            </Descriptions.Item>
            <Descriptions.Item label="Refund Amount">
              <strong style={{ color: '#ef4444' }}>
                {formatCurrency(selectedRefund.refund_amount)}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Refund Mode" span={2}>
              <Tag color="orange">{selectedRefund.refund_mode}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Reason" span={2}>
              {selectedRefund.refund_reason}
            </Descriptions.Item>
            <Descriptions.Item label="Approved By">
              {selectedRefund.approvedBy?.username}
            </Descriptions.Item>
            <Descriptions.Item label="Processed By">
              {selectedRefund.processedBy?.username}
            </Descriptions.Item>
            {selectedRefund.bank_details && (
              <Descriptions.Item label="Bank Details" span={2}>
                {selectedRefund.bank_details}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </SliderModal>
    </div>
  );
};

export default RefundManagement;
