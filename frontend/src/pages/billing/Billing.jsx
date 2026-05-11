import { useState } from 'react';
import { Space, Button, Tag, Card, Row, Col, Statistic, message, Select, Input, DatePicker } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { EyeOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, FileTextOutlined, PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import { PaymentModal, ViewDetailsModal } from '@components/common/ActionModals';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { formatDate, formatCurrency } from '@utils/helpers';
import { PAYMENT_STATUS } from '@utils/constants';
import { useNavigate } from 'react-router-dom';
import { generateBillPDF } from '@utils/pdfGenerator';
import { printBill } from '@utils/billPrintHelper';
import apiClient from '@services/apiClient';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Billing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [unbilledModalOpen, setUnbilledModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [filters, setFilters] = useState({ payment_status: '', bill_type: '', date_range: null });

  const { data: billsData, isLoading, refetch } = useApiQuery(
    ['bills', searchQuery, filters],
    async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.payment_status) params.append('payment_status', filters.payment_status);
      if (filters.bill_type) params.append('bill_type', filters.bill_type);
      if (filters.date_range) {
        params.append('start_date', filters.date_range[0].format('YYYY-MM-DD'));
        params.append('end_date', filters.date_range[1].format('YYYY-MM-DD'));
      }
      const response = await apiClient.get(`/bills?${params}`);
      return response;
    }
  );

  const { data: summaryData } = useApiQuery(
    ['billing-summary', filters.date_range],
    async () => {
      const params = new URLSearchParams();
      if (filters.date_range) {
        params.append('start_date', filters.date_range[0].format('YYYY-MM-DD'));
        params.append('end_date', filters.date_range[1].format('YYYY-MM-DD'));
      }
      const response = await apiClient.get(`/bills/summary?${params}`);
      return response;
    }
  );

  const { data: unbilledData, isLoading: unbilledLoading } = useApiQuery(
    ['unbilled-episodes'],
    async () => {
      const response = await apiClient.get('/billing-episodes/unbilled');
      return response;
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
        setPaymentModalOpen(false);
        refetch();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || 'Payment processing failed');
      },
      invalidateKeys: [['bills'], ['billing-summary']]
    }
  );

  const getStatusColor = (status) => {
    const colors = { [PAYMENT_STATUS.PAID]: 'green', [PAYMENT_STATUS.UNPAID]: 'red', [PAYMENT_STATUS.PARTIAL]: 'orange' };
    return colors[status] || 'default';
  };

  const handlePrintBill = async (record) => {
    try {
      const chargesRes = await apiClient.get(`/bill-charges/episode/${record.episode_id}`);
      const charges = chargesRes?.data?.charges || [];
      const billData = {
        bill_number: record.bill_number, bill_date: record.bill_date, bill_type: record.bill_type,
        patient_name: `${record.patient?.first_name || ''} ${record.patient?.last_name || ''}`.trim(),
        uhid: record.patient?.uhid || record.uhid || 'N/A',
        mobile: record.patient?.mobile_number || 'N/A', patient: record.patient,
        gross_amount: record.gross_amount, discount_amount: record.discount_amount,
        tax_amount: record.tax_amount, net_amount: record.net_amount,
        paid_amount: record.paid_amount || 0, balance_amount: record.balance_amount,
        payment_status: record.payment_status, payment_mode: record.payment_mode || 'Pending'
      };
      printBill(billData, charges);
    } catch (error) {
      message.error('Failed to print bill');
    }
  };

  const handleDownloadBillPDF = (record) => {
    const billData = {
      bill_no: record.bill_number, date: new Date(record.bill_date),
      patient_name: `${record.patient?.first_name || ''} ${record.patient?.last_name || ''}`.trim(),
      uhid: record.patient?.uhid || record.uhid || 'N/A', visit_type: record.bill_type,
      items: [{ service_name: `${record.bill_type} Services`, quantity: 1, rate: parseFloat(record.gross_amount || 0), amount: parseFloat(record.net_amount || 0) }],
      gross_amount: parseFloat(record.gross_amount || 0), discount: parseFloat(record.discount_amount || 0),
      tax: parseFloat(record.tax_amount || 0), net_amount: parseFloat(record.net_amount || 0),
      payment_mode: record.payment_status === 'Paid' ? 'Completed' : 'Pending', payment_status: record.payment_status
    };
    try { generateBillPDF(billData); message.success('Bill PDF downloaded'); }
    catch { message.error('Failed to generate PDF'); }
  };

  const bills = billsData?.data || [];
  const summary = summaryData?.data?.totals || {};
  const unbilledEpisodes = unbilledData?.data || [];

  const unbilledColumns = [
    { title: 'Patient', key: 'patient', render: (_, r) => <div><div style={{ fontWeight: 500 }}>{r.patient?.first_name} {r.patient?.last_name}</div><div style={{ fontSize: 12, color: '#666' }}>UHID: {r.patient?.uhid || r.uhid}</div></div> },
    { title: 'Type', dataIndex: 'episode_type', render: (t) => <Tag color={t === 'OPD' ? 'blue' : 'green'}>{t}</Tag> },
    { title: 'Date', dataIndex: 'start_date', render: (d) => formatDate(d) },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Open' ? 'green' : 'default'}>{s}</Tag> },
    { title: 'Action', key: 'action', render: (_, r) => <Button type="primary" size="small" onClick={() => { navigate(`/billing/generate/${r.episode_id}?type=${r.episode_type}`); setUnbilledModalOpen(false); }}>Generate Bill</Button> }
  ];

  const columns = [
    { title: 'Bill No.', dataIndex: 'bill_number', width: 140, render: (n) => <Tag color="blue">{n}</Tag> },
    { title: 'Patient', key: 'patient', render: (_, r) => <div><div style={{ fontWeight: 500 }}>{r.patient?.first_name} {r.patient?.last_name}</div><div style={{ fontSize: 12, color: '#666' }}>UHID: {r.patient?.uhid}</div></div> },
    { title: 'Type', dataIndex: 'bill_type', width: 70, render: (t) => <Tag color={t === 'OPD' ? 'blue' : 'green'}>{t}</Tag> },
    { title: 'Gross', dataIndex: 'gross_amount', render: (a) => formatCurrency(a) },
    { title: 'Discount', dataIndex: 'discount_amount', render: (a) => <span style={{ color: '#10b981' }}>{formatCurrency(a)}</span> },
    { title: 'Net Amount', dataIndex: 'net_amount', render: (a) => <div style={{ fontWeight: 600, color: '#0a0a0a' }}>{formatCurrency(a)}</div> },
    { title: 'Paid', dataIndex: 'paid_amount', render: (a) => <span style={{ color: '#10b981' }}>{formatCurrency(a)}</span> },
    { title: 'Balance', dataIndex: 'balance_amount', render: (a) => <span style={{ color: a > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(a)}</span> },
    { title: 'Date', dataIndex: 'bill_date', render: (d) => formatDate(d) },
    { title: 'Status', dataIndex: 'payment_status', render: (s) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    {
      title: 'Actions', key: 'actions', fixed: 'right', width: 220,
      render: (_, record) => (
        <Space size={4}>
          <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedBill(record); setViewModalOpen(true); }}>View</Button>
          <Button icon={<PrinterOutlined />} size="small" onClick={() => handlePrintBill(record)}>Print</Button>
          <Button icon={<FilePdfOutlined />} size="small" onClick={() => handleDownloadBillPDF(record)}>PDF</Button>
          <Button icon={<FileTextOutlined />} size="small" onClick={() => navigate(`/billing/generate/${record.episode_id}?type=${record.bill_type}`)}>Details</Button>
          {record.payment_status !== PAYMENT_STATUS.PAID && record.balance_amount > 0 && (
            <Button icon={<DollarOutlined />} size="small" type="primary" onClick={() => { setSelectedBill(record); setPaymentModalOpen(true); }}>Pay</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Revenue" value={summary.total_revenue || 0} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#0a0a0a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Collected" value={summary.total_collected || 0} formatter={(v) => formatCurrency(v)} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10b981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pending" value={summary.total_pending || 0} formatter={(v) => formatCurrency(v)} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#ef4444' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Bills" value={summary.total_bills || 0} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
      </Row>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={7}><Input.Search placeholder="Search by UHID or Patient Name" onSearch={setSearchQuery} allowClear /></Col>
          <Col span={4}><Select placeholder="Payment Status" style={{ width: '100%' }} allowClear onChange={(v) => setFilters(p => ({ ...p, payment_status: v || '' }))}><Option value="Unpaid">Unpaid</Option><Option value="Partial">Partial</Option><Option value="Paid">Paid</Option></Select></Col>
          <Col span={4}><Select placeholder="Bill Type" style={{ width: '100%' }} allowClear onChange={(v) => setFilters(p => ({ ...p, bill_type: v || '' }))}><Option value="OPD">OPD</Option><Option value="IPD">IPD</Option></Select></Col>
          <Col span={9}><Space style={{ width: '100%', justifyContent: 'flex-end' }}><RangePicker onChange={(dates) => setFilters(p => ({ ...p, date_range: dates }))} /><Button type="primary" icon={<PlusOutlined />} onClick={() => setUnbilledModalOpen(true)}>Generate New Bill</Button></Space></Col>
        </Row>
        <DataTable columns={columns} dataSource={bills} loading={isLoading} rowKey="bill_id" scroll={{ x: 1300 }} />
      </Card>

      <PaymentModal open={paymentModalOpen} onCancel={() => setPaymentModalOpen(false)} bill={selectedBill} onSuccess={() => { setPaymentModalOpen(false); refetch(); }} loading={processPaymentMutation.isPending} />
      <ViewDetailsModal open={viewModalOpen} onCancel={() => setViewModalOpen(false)} record={selectedBill} type="Bill" />
      <SliderModal title="Generate New Bill â€” Select Visit / Episode" open={unbilledModalOpen} onCancel={() => setUnbilledModalOpen(false)} footer={null} width={900}>
        <DataTable columns={unbilledColumns} dataSource={unbilledEpisodes} loading={unbilledLoading} rowKey="episode_id" pagination={{ pageSize: 10 }} />
      </SliderModal>
    </div>
  );
};

export default Billing;
