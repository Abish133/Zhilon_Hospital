import { Card, Table, Button, Space, message, Descriptions, Divider, Form, Select, InputNumber, Input, Row, Col, Tag, Spin, Popconfirm } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PrinterOutlined, DollarOutlined, FilePdfOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { generateBillPDF } from '@utils/pdfGenerator';
import { printBill } from '@utils/billPrintHelper';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { formatCurrency, formatDate } from '@utils/helpers';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import apiClient from '@services/apiClient';
import { useAuthStore } from '@store';

const BillGeneration = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { episodeId } = useParams();
  const [searchParams] = useSearchParams();
  const visitType = searchParams.get('type'); // OPD or IPD
  
  const [paymentModal, setPaymentModal] = useState(false);
  const [addChargeModal, setAddChargeModal] = useState(false);
  const [paymentForm] = Form.useForm();
  const [chargeForm] = Form.useForm();
  const [selectedCharges, setSelectedCharges] = useState([]);

  const { data: chargesData, isLoading: chargesLoading, refetch: refetchCharges } = useApiQuery(
    ['episode-charges', episodeId],
    async () => {
      const response = await apiClient.get(`/bill-charges/episode/${episodeId}`);
      return response;
    },
    { enabled: !!episodeId }
  );

  const { data: chargeMastersData } = useApiQuery(
    ['charge-masters'],
    async () => {
      const response = await apiClient.get('/charge-masters');
      return response;
    }
  );

  const { data: episodeData } = useApiQuery(
    ['billing-episode', episodeId],
    async () => {
      const response = await apiClient.get(`/billing-episodes/${episodeId}`);
      return response;
    },
    { enabled: !!episodeId }
  );

  const { data: existingBillData } = useApiQuery(
    ['episode-bill', episodeId],
    async () => {
      try {
        const response = await apiClient.get(`/bills/episode/${episodeId}`);
        return response;
      } catch (e) {
        return null;
      }
    },
    { enabled: !!episodeId }
  );

  const addChargeMutation = useApiMutation(
    async (chargeData) => {
      const response = await apiClient.post('/bill-charges/from-master', chargeData);
      return response;
    },
    {
      onSuccess: () => {
        message.success('Charge added successfully');
        setAddChargeModal(false);
        chargeForm.resetFields();
        refetchCharges();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || 'Failed to add charge');
      }
    }
  );

  const deleteChargeMutation = useApiMutation(
    async (chargeId) => {
      const response = await apiClient.delete(`/bill-charges/${chargeId}`);
      return response;
    },
    {
      onSuccess: () => {
        message.success('Charge removed successfully');
        refetchCharges();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || 'Failed to remove charge');
      }
    }
  );

  const generateBillMutation = useApiMutation(
    async (billData) => {
      const response = await apiClient.post('/bills/generate', billData);
      return response;
    },
    {
      onSuccess: () => {
        message.success('Bill generated successfully');
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || 'Failed to generate bill');
      }
    }
  );

  const processPaymentMutation = useApiMutation(
    async (paymentData) => {
      const response = await apiClient.post('/payments', paymentData);
      return response;
    },
    {
      onSuccess: () => {
        message.success('Payment processed successfully');
        setPaymentModal(false);
        paymentForm.resetFields();
        navigate('/billing');
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || 'Payment processing failed');
      }
    }
  );

  const charges = chargesData?.data?.charges || [];
  const totals = chargesData?.data?.totals || {
    gross_amount: 0,
    discount_amount: 0,
    tax_amount: 0,
    net_amount: 0
  };
  const episode = episodeData?.data || {};
  const patient = episode.patient || {};
  const chargeMasters = chargeMastersData?.data || [];
  const existingBill = existingBillData?.data || null;
  const billExists = !!existingBill;

  const handleAddCharge = (values) => {
    if (!user?.hospital_id) {
      message.error('Hospital context missing. Please sign in again.');
      return;
    }
    addChargeMutation.mutate({
      ...values,
      episode_id: episodeId,
      hospital_id: user.hospital_id
    });
  };

  const handleGenerateBill = async () => {
    if (charges.length === 0) {
      message.warning('Please add charges before generating bill');
      return;
    }
    if (!user?.hospital_id) {
      message.error('Hospital context missing. Please sign in again.');
      return;
    }

    try {
      await generateBillMutation.mutateAsync({
        episode_id: episodeId,
        discount_amount: 0,
        generated_by: user.id,
        hospital_id: user.hospital_id
      });
      navigate('/billing');
    } catch (error) {
    }
  };

  const handlePayment = async (values) => {
    if (!user?.hospital_id) {
      message.error('Hospital context missing. Please sign in again.');
      return;
    }
    try {
      // First generate the bill
      const billResponse = await generateBillMutation.mutateAsync({
        episode_id: episodeId,
        discount_amount: 0,
        generated_by: user.id,
        hospital_id: user.hospital_id
      });

      const billId = billResponse.data.bill_id;

      // Then process payment
      await processPaymentMutation.mutateAsync({
        bill_id: billId,
        payment_type: 'Bill Payment',
        amount_paid: values.amount_paid,
        payment_mode: values.payment_mode,
        transaction_ref: values.transaction_ref || null,
        bank_name: values.bank_name || null,
        received_by: user.id,
        hospital_id: user.hospital_id
      });
    } catch (error) {
    }
  };

  const handleDownloadPDF = () => {
    if (charges.length === 0) {
      message.warning('No charges available to generate PDF');
      return;
    }

    const billData = {
      bill_no: existingBill?.bill_number || `BILL-${new Date().getFullYear()}-${String(episodeId).padStart(5, '0')}`,
      date: existingBill?.bill_date || new Date(),
      patient_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
      uhid: patient.uhid || 'N/A',
      mobile: patient.mobile || 'N/A',
      visit_type: visitType || episode.episode_type || 'OPD',
      items: charges.map(charge => ({
        service_name: charge.description || charge.service_type || 'Service',
        quantity: charge.quantity || 1,
        rate: parseFloat(charge.rate || 0),
        discount: parseFloat(charge.discount_amount || 0),
        gst_amount: parseFloat(charge.gst_amount || 0),
        net_amount: parseFloat(charge.net_amount || 0),
        amount: parseFloat(charge.net_amount || 0)
      })),
      gross_amount: parseFloat(totals.gross_amount).toFixed(2),
      discount: parseFloat(totals.discount_amount).toFixed(2),
      tax: parseFloat(totals.tax_amount).toFixed(2),
      net_amount: parseFloat(totals.net_amount).toFixed(2),
      payment_mode: existingBill?.payment_mode || 'Pending',
      payment_status: existingBill?.payment_status || 'Unpaid',
      transaction_ref: existingBill?.transaction_ref || ''
    };
    
    try {
      generateBillPDF(billData);
      message.success('Bill PDF downloaded successfully');
    } catch (error) {
      message.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    if (charges.length === 0) {
      message.warning('No charges available to print');
      return;
    }

    const billData = {
      bill_number: existingBill?.bill_number || `BILL-${new Date().getFullYear()}-${String(episodeId).padStart(5, '0')}`,
      bill_date: existingBill?.bill_date || new Date(),
      bill_type: visitType || episode.episode_type || 'OPD',
      patient_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
      uhid: patient.uhid || 'N/A',
      mobile: patient.mobile || 'N/A',
      patient: patient,
      gross_amount: totals.gross_amount,
      discount_amount: totals.discount_amount,
      tax_amount: totals.tax_amount,
      net_amount: totals.net_amount,
      paid_amount: existingBill?.paid_amount || 0,
      balance_amount: existingBill?.balance_amount || totals.net_amount,
      payment_status: existingBill?.payment_status || 'Unpaid',
      payment_mode: existingBill?.payment_mode || 'Pending',
      transaction_ref: existingBill?.transaction_ref || ''
    };
    
    try {
      printBill(billData, charges);
      message.success('Print dialog opened');
    } catch (error) {
      message.error('Failed to print bill');
    }
  };

  const chargeColumns = [
    { 
      title: 'Service', 
      dataIndex: 'description', 
      key: 'description' 
    },
    { 
      title: 'Category', 
      dataIndex: 'service_type', 
      key: 'service_type',
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    { 
      title: 'Quantity', 
      dataIndex: 'quantity', 
      key: 'quantity', 
      align: 'center' 
    },
    { 
      title: 'Rate', 
      dataIndex: 'rate', 
      key: 'rate', 
      render: (val) => formatCurrency(val) 
    },
    { 
      title: 'Discount', 
      dataIndex: 'discount_amount', 
      key: 'discount_amount', 
      render: (val) => <span style={{ color: '#10b981' }}>{formatCurrency(val)}</span> 
    },
    { 
      title: 'Tax', 
      dataIndex: 'gst_amount', 
      key: 'gst_amount', 
      render: (val) => formatCurrency(val || 0) 
    },
    { 
      title: 'Amount', 
      dataIndex: 'net_amount', 
      key: 'net_amount', 
      render: (val) => <div style={{ fontWeight: 600 }}>{formatCurrency(val)}</div> 
    },
    ...(!billExists ? [{
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Remove this charge?"
          description="This cannot be undone."
          okText="Remove"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
          onConfirm={() => deleteChargeMutation.mutate(record.charge_id)}
        >
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deleteChargeMutation.isPending}
          />
        </Popconfirm>
      )
    }] : [])
  ];

  if (chargesLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading episode details...</div>
      </div>
    );
  }

  return (
    <div>
      <Card 
        title={
          <Space>
            <span>{`${visitType} Bill - Episode #${episodeId}`}</span>
            {billExists && <Tag color="green">Bill Already Generated</Tag>}
          </Space>
        }
        extra={
          <Space>
            {!billExists && (
              <Button 
                icon={<PlusOutlined />} 
                onClick={() => setAddChargeModal(true)}
              >
                Add Charge
              </Button>
            )}
            <Button 
              icon={<FilePdfOutlined />} 
              onClick={handleDownloadPDF}
              disabled={charges.length === 0}
            >
              Download PDF
            </Button>
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
              disabled={charges.length === 0}
            >
              Print
            </Button>
            {!billExists && (
              <Button 
                type="primary" 
                icon={<DollarOutlined />} 
                onClick={() => setPaymentModal(true)}
                disabled={charges.length === 0}
              >
                Generate Bill & Collect Payment
              </Button>
            )}
            {billExists && existingBill.balance_amount > 0 && (
              <Button 
                type="primary" 
                icon={<DollarOutlined />} 
                onClick={() => navigate('/billing')}
              >
                Go to Billing to Pay
              </Button>
            )}
            {billExists && existingBill.balance_amount === 0 && (
              <Tag color="success" style={{ fontSize: 14, padding: '4px 12px' }}>
                Fully Paid
              </Tag>
            )}
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Patient">
                {patient.first_name} {patient.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="UHID">{patient.uhid}</Descriptions.Item>
              <Descriptions.Item label="Episode Type">{episode.episode_type}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Episode Date">
                {formatDate(episode.start_date)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={episode.status === 'Open' ? 'green' : 'red'}>
                  {episode.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Charges">
                <strong style={{ color: '#0a0a0a' }}>
                  {formatCurrency(totals.net_amount || 0)}
                </strong>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        {billExists && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card size="small" style={{ background: '#f0f9ff', border: '1px solid #3b82f6' }}>
                <Descriptions column={4} size="small">
                  <Descriptions.Item label="Bill Number">
                    <Tag color="blue">{existingBill.bill_number}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Net Amount">
                    <strong style={{ color: '#0a0a0a' }}>{formatCurrency(existingBill.net_amount)}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Paid Amount">
                    <strong style={{ color: '#10b981' }}>{formatCurrency(existingBill.paid_amount)}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Balance">
                    <strong style={{ color: existingBill.balance_amount > 0 ? '#ef4444' : '#10b981' }}>
                      {formatCurrency(existingBill.balance_amount)}
                    </strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Status" span={4}>
                    <Tag color={existingBill.payment_status === 'Paid' ? 'green' : existingBill.payment_status === 'Partial' ? 'orange' : 'red'}>
                      {existingBill.payment_status}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        )}

        <Divider>Charges</Divider>

        <Table 
          columns={chargeColumns} 
          dataSource={charges} 
          pagination={false}
          rowKey="charge_id"
          summary={() => (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6} align="right">
                  <strong>Gross Amount:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  <strong>{formatCurrency(totals.gross_amount || 0)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell />
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6} align="right">
                  Discount:
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  {formatCurrency(totals.discount_amount || 0)}
                </Table.Summary.Cell>
                <Table.Summary.Cell />
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6} align="right">
                  Tax:
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  {formatCurrency(totals.tax_amount || 0)}
                </Table.Summary.Cell>
                <Table.Summary.Cell />
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6} align="right">
                  <strong style={{ fontSize: 16 }}>Net Amount:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  <strong style={{ fontSize: 16, color: '#0a0a0a' }}>
                    {formatCurrency(totals.net_amount || 0)}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell />
              </Table.Summary.Row>
            </>
          )}
        />
      </Card>

      {/* Add Charge Modal */}
      <SliderModal
        title="Add Charge"
        open={addChargeModal}
        onCancel={() => setAddChargeModal(false)}
        footer={null}
        width={600}
      >
        <Form 
          form={chargeForm} 
          layout="vertical" 
          onFinish={handleAddCharge}
        >
          <Form.Item 
            name="charge_master_id" 
            label="Service" 
            rules={[{ required: true, message: 'Please select a service' }]}
          >
            <Select
              placeholder="Select service"
              showSearch
              optionFilterProp="children"
            >
              {chargeMasters.map(master => (
                <Select.Option key={master.charge_id} value={master.charge_id}>
                  {master.service_name} - {formatCurrency(master.charge_amount)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="quantity" 
                label="Quantity" 
                rules={[{ required: true, message: 'Please enter quantity' }]}
                initialValue={1}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="discount_percent" 
                label="Discount %" 
                initialValue={0}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAddChargeModal(false)}>Cancel</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={addChargeMutation.isPending}
              >
                Add Charge
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Payment Modal */}
      <SliderModal
        title="Generate Bill & Collect Payment"
        open={paymentModal}
        onCancel={() => setPaymentModal(false)}
        footer={null}
        width={600}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handlePayment}>
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Total Amount">
              <strong style={{ fontSize: 18, color: '#0a0a0a' }}>
                {formatCurrency(totals.net_amount || 0)}
              </strong>
            </Descriptions.Item>
          </Descriptions>

          <Form.Item 
            name="payment_mode" 
            label="Payment Mode" 
            rules={[{ required: true, message: 'Please select payment mode' }]}
          >
            <Select>
              <Select.Option value="Cash">Cash</Select.Option>
              <Select.Option value="Card">Card</Select.Option>
              <Select.Option value="UPI">UPI</Select.Option>
              <Select.Option value="Cheque">Cheque</Select.Option>
              <Select.Option value="Insurance">Insurance</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="amount_paid" 
            label="Amount Paid" 
            rules={[{ required: true, message: 'Please enter amount' }]}
            initialValue={totals.net_amount}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              max={totals.net_amount}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="transaction_ref" label="Transaction Reference">
            <Input placeholder="Card/UPI/Cheque reference" />
          </Form.Item>

          <Form.Item name="bank_name" label="Bank Name">
            <Input placeholder="Bank name (for card/cheque payments)" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setPaymentModal(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerateBill}
                loading={generateBillMutation.isPending}
              >
                Generate Bill Only
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={processPaymentMutation.isPending}
              >
                Generate Bill & Process Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default BillGeneration;
