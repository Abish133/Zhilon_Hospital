import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, DatePicker, Form, Select, InputNumber, Input, message, Row, Col, Statistic } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import SliderModal from '@components/common/SliderModal';
import { formatCurrency } from '@utils/helpers';
import apiClient from '@services/apiClient';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const unwrap = (res) => (res && res.data && res.data.success !== undefined) ? res.data : res;
const CATEGORIES = ['Payroll', 'Utilities', 'Maintenance', 'Procurement', 'Rent', 'Other'];
const CAT_COLOR = { Payroll: 'purple', Utilities: 'blue', Maintenance: 'orange', Procurement: 'cyan', Rent: 'geekblue', Other: 'default' };

const Expenses = () => {
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byCategory: {} });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (range?.[0] && range?.[1]) { params.from = range[0].format('YYYY-MM-DD'); params.to = range[1].format('YYYY-MM-DD'); }
      const body = unwrap(await apiClient.get('/expenses', { params }));
      setRows(body?.data || []);
      setSummary(body?.summary || { total: 0, byCategory: {} });
    } catch (e) { message.error('Failed to load expenses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); /* eslint-disable-next-line */ }, [range]);

  const openAdd = () => {
    form.resetFields();
    form.setFieldsValue({ expense_date: dayjs(), category: 'Other', payment_mode: 'Cash' });
    setModalOpen(true);
  };

  const handleAdd = async (values) => {
    try {
      const body = unwrap(await apiClient.post('/expenses', { ...values, expense_date: values.expense_date.format('YYYY-MM-DD') }));
      if (body?.success) { message.success('Expense recorded'); setModalOpen(false); fetchExpenses(); }
      else message.error(body?.message || 'Failed');
    } catch (e) { message.error(e?.response?.data?.message || 'Failed'); }
  };

  const columns = [
    { title: 'Date', dataIndex: 'expense_date', key: 'date', width: 120, render: (d) => dayjs(d).format('DD MMM YYYY') },
    { title: 'No.', dataIndex: 'expense_number', key: 'no', width: 130 },
    { title: 'Category', dataIndex: 'category', key: 'cat', render: (c) => <Tag color={CAT_COLOR[c] || 'default'}>{c}</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Mode', dataIndex: 'payment_mode', key: 'mode', width: 110 },
    { title: 'Amount', dataIndex: 'amount', key: 'amt', align: 'right', render: (v) => <b>{formatCurrency(v)}</b> }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total (range)" value={summary.total} precision={2} prefix="₹" /></Card></Col>
        {Object.entries(summary.byCategory || {}).slice(0, 3).map(([k, v]) => (
          <Col xs={12} sm={6} key={k}><Card size="small"><Statistic title={k} value={v} precision={2} prefix="₹" valueStyle={{ fontSize: 18 }} /></Card></Col>
        ))}
      </Row>

      <Card
        title="Expense Ledger"
        extra={
          <Space>
            <RangePicker value={range} onChange={setRange} format="DD MMM YYYY" allowClear={false} />
            <Button icon={<ReloadOutlined />} onClick={fetchExpenses} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Record Expense</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rows}
          rowKey="expense_id"
          loading={loading}
          locale={{ emptyText: 'No expenses in this range. Paid payroll is posted here automatically.' }}
          pagination={{ pageSize: 12 }}
          summary={(data) => {
            const total = data.reduce((s, r) => s + Number(r.amount || 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={5} align="right"><b>Total</b></Table.Summary.Cell>
                <Table.Summary.Cell align="right"><b>{formatCurrency(total)}</b></Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      <SliderModal title="Record Expense" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Save" width={520}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="expense_date" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD MMM YYYY" /></Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={CATEGORIES.map(c => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="description" label="Description"><Input placeholder="e.g. Electricity bill — June" /></Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: 'Enter the amount' }]}>
            <InputNumber min={0} step={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="payment_mode" label="Payment Mode">
            <Select options={['Cash', 'Bank Transfer', 'Card', 'UPI', 'Cheque'].map(m => ({ value: m, label: m }))} />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default Expenses;
