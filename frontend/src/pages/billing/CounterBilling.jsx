import { useState, useEffect, useMemo } from 'react';
import { Card, Form, Input, Button, Table, Space, message, Select, Descriptions, Divider, Row, Col, InputNumber, Tag, Statistic, Empty } from 'antd';
import { SearchOutlined, PlusOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@utils/helpers';
import { patientService } from '@services';
import apiClient from '@services/apiClient';
import { useAuthStore } from '@store';

// Item categories the cashier can add — each is sourced from a master.
const CATEGORIES = [
  { value: 'charge', label: 'Consultation / Charge', catalogKey: 'charges' },
  { value: 'lab', label: 'Lab Test', catalogKey: 'labTests' },
  { value: 'radiology', label: 'Radiology', catalogKey: 'radiologyTests' },
  { value: 'package', label: 'Package', catalogKey: 'packages' },
  { value: 'medicine', label: 'Medicine', catalogKey: 'medicines' }
];

const CounterBilling = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchForm] = Form.useForm();

  const [patient, setPatient] = useState(null);
  const [catalog, setCatalog] = useState({ charges: [], labTests: [], radiologyTests: [], packages: [], medicines: [] });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // add-item controls
  const [category, setCategory] = useState('charge');
  const [selectedRef, setSelectedRef] = useState(null);
  const [qty, setQty] = useState(1);

  // payment
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => { fetchCatalog(); }, []);

  const fetchCatalog = async () => {
    try {
      const res = await apiClient.get('/counter-billing/catalog');
      // apiClient unwraps to the JSON body ({ success, data }). Tolerate either
      // the unwrapped body or a raw axios response so nothing breaks.
      const body = (res && res.data && res.data.success !== undefined) ? res.data : res;
      const d = body?.data || {};
      setCatalog({
        charges: Array.isArray(d.charges) ? d.charges : [],
        labTests: Array.isArray(d.labTests) ? d.labTests : [],
        radiologyTests: Array.isArray(d.radiologyTests) ? d.radiologyTests : [],
        packages: Array.isArray(d.packages) ? d.packages : [],
        medicines: Array.isArray(d.medicines) ? d.medicines : []
      });
    } catch (error) {
      message.error('Failed to load billing catalogue');
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      const q = (values.search_value || '').trim();
      let found = null;
      if (/^\d+$/.test(q)) {
        try { const r = await patientService.getByUHID(q); found = (r?.data ?? r)?.data || null; } catch (e) { /* fall through */ }
      }
      if (!found) {
        const r = await patientService.getAll({ search: q, hospital_id: user?.hospital_id, pageSize: 10 });
        const body = r?.data ?? r;
        const list = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        found = list.find(p => p.uhid?.toLowerCase() === q.toLowerCase()) || list[0] || null;
      }
      if (!found) { message.error('Patient not found'); setPatient(null); return; }
      setPatient(found);
      message.success('Patient loaded');
    } catch (error) {
      message.error('Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  // options for the current category, from the loaded catalogue
  const itemOptions = useMemo(() => {
    const cat = CATEGORIES.find(c => c.value === category);
    const list = catalog[cat?.catalogKey] || [];
    if (category === 'charge') return list.map(c => ({ value: c.charge_id, label: `${c.service_name} — ${formatCurrency(c.charge_amount)}`, raw: c }));
    if (category === 'lab') return list.map(l => ({ value: l.test_id, label: `${l.test_name} — ${formatCurrency(l.charge)}`, raw: l }));
    if (category === 'radiology') return list.map(r => ({ value: r.rad_test_id, label: `${r.test_name} — ${formatCurrency(r.charge)}`, raw: r }));
    if (category === 'package') return list.map(p => ({ value: p.package_id, label: `${p.package_name} — ${formatCurrency(p.total_charge)}`, raw: p }));
    if (category === 'medicine') return list.map(m => ({
      value: m.medicine_id,
      label: `${m.brand_name || m.medicine_name}${m.generic_name ? ` (${m.generic_name})` : ''} — ${formatCurrency(m.mrp)} · stock ${m.available_quantity}`,
      raw: m,
      disabled: !m.in_stock
    }));
    return [];
  }, [category, catalog]);

  const addToCart = () => {
    if (!selectedRef) { message.warning('Select an item'); return; }
    const opt = itemOptions.find(o => o.value === selectedRef);
    if (!opt) return;
    const raw = opt.raw;
    let line;
    if (category === 'charge') line = { kind: 'charge', ref_id: raw.charge_id, name: raw.service_name, rate: parseFloat(raw.charge_amount || 0), gst: parseFloat(raw.gst_percentage || 0) };
    else if (category === 'lab') line = { kind: 'lab', ref_id: raw.test_id, name: `Lab - ${raw.test_name}`, rate: parseFloat(raw.charge || 0), gst: 0 };
    else if (category === 'radiology') line = { kind: 'radiology', ref_id: raw.rad_test_id, name: `Radiology - ${raw.test_name}`, rate: parseFloat(raw.charge || 0), gst: 0 };
    else if (category === 'package') line = { kind: 'package', ref_id: raw.package_id, name: `Package - ${raw.package_name}`, rate: parseFloat(raw.total_charge || 0), gst: 0 };
    else if (category === 'medicine') {
      if (qty > raw.available_quantity) { message.error(`Only ${raw.available_quantity} in stock for ${raw.brand_name || raw.medicine_name}`); return; }
      line = { kind: 'medicine', ref_id: raw.medicine_id, name: `${raw.brand_name || raw.medicine_name}${raw.generic_name ? ` (${raw.generic_name})` : ''}`, rate: parseFloat(raw.mrp || 0), gst: parseFloat(raw.gst_percentage || 0), stock: raw.available_quantity };
    }
    setCart(prev => [...prev, { key: Date.now() + Math.random(), quantity: qty, ...line }]);
    setSelectedRef(null);
    setQty(1);
  };

  const updateQty = (key, q) => setCart(prev => prev.map(l => l.key === key ? { ...l, quantity: q || 1 } : l));
  const removeLine = (key) => setCart(prev => prev.filter(l => l.key !== key));

  const totals = useMemo(() => {
    const gross = cart.reduce((s, l) => s + l.rate * l.quantity, 0);
    const tax = cart.reduce((s, l) => s + (l.rate * l.quantity) * (l.gst || 0) / 100, 0);
    const net = +(gross - (discount || 0) + tax).toFixed(2);
    return { gross: +gross.toFixed(2), tax: +tax.toFixed(2), net };
  }, [cart, discount]);

  useEffect(() => { setAmountPaid(totals.net); }, [totals.net]);

  const handleGenerate = async () => {
    if (!patient) { message.warning('Search and select a patient first'); return; }
    if (cart.length === 0) { message.warning('Add at least one item'); return; }
    setSubmitting(true);
    try {
      const res = await apiClient.post('/counter-billing', {
        uhid: patient.uhid,
        patient_id: patient.patient_id,
        items: cart.map(l => ({ kind: l.kind, ref_id: l.ref_id, quantity: l.quantity })),
        payment_mode: paymentMode,
        paid_amount: amountPaid,
        discount_amount: discount
      });
      const body = (res && res.data && res.data.success !== undefined) ? res.data : res;
      if (body?.success) {
        const bill = body.data?.bill;
        const episodeId = bill?.episode_id || body.data?.episode_id;
        message.success(`Bill ${bill?.bill_number || ''} created`);
        // reset for the next customer
        setCart([]); setPatient(null); setDiscount(0); searchForm.resetFields();
        fetchCatalog();
        if (episodeId) navigate(`/billing/generate/${episodeId}`);
      } else {
        message.error(body?.message || 'Failed to create bill');
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Type', dataIndex: 'kind', key: 'kind', width: 110, render: (k) => <Tag color={{ charge: 'blue', lab: 'cyan', radiology: 'geekblue', package: 'gold', medicine: 'purple' }[k]}>{k}</Tag> },
    { title: 'Item', dataIndex: 'name', key: 'name' },
    {
      title: 'Qty', key: 'qty', width: 110,
      render: (_, r) => <InputNumber min={1} max={r.kind === 'medicine' ? r.stock : undefined} value={r.quantity} onChange={(v) => updateQty(r.key, v)} style={{ width: 80 }} />
    },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 100, render: (v) => formatCurrency(v) },
    { title: 'GST%', dataIndex: 'gst', key: 'gst', width: 80, render: (v) => v ? `${v}%` : '-' },
    { title: 'Amount', key: 'amount', width: 120, render: (_, r) => formatCurrency(r.rate * r.quantity) },
    { title: '', key: 'x', width: 50, render: (_, r) => <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeLine(r.key)} /> }
  ];

  return (
    <div>
      <Card title="Counter Billing — add any service, test, package or medicine from masters">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="search_value" rules={[{ required: true, message: 'Enter UHID / name / mobile' }]}>
            <Input placeholder="Search patient — UHID / name / mobile" prefix={<SearchOutlined />} style={{ width: 320 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Search Patient</Button>
          </Form.Item>
        </Form>

        {patient && (
          <>
            <Divider />
            <Descriptions bordered column={3} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Patient">{patient.first_name} {patient.last_name}</Descriptions.Item>
              <Descriptions.Item label="UHID">{patient.uhid}</Descriptions.Item>
              <Descriptions.Item label="Mobile">{patient.mobile_number || '-'}</Descriptions.Item>
            </Descriptions>

            {/* Add item bar */}
            <Card size="small" style={{ background: '#fafafa', marginBottom: 16 }}>
              <Space wrap align="end">
                <div>
                  <div style={{ fontSize: 12, color: '#888' }}>Category</div>
                  <Select value={category} style={{ width: 190 }} onChange={(v) => { setCategory(v); setSelectedRef(null); }} options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#888' }}>Item (from master)</div>
                  <Select
                    showSearch value={selectedRef} style={{ width: 360 }} placeholder="Select item"
                    optionFilterProp="label" onChange={setSelectedRef} options={itemOptions}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#888' }}>Qty</div>
                  <InputNumber min={1} value={qty} onChange={(v) => setQty(v || 1)} style={{ width: 80 }} />
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={addToCart}>Add</Button>
              </Space>
            </Card>

            <Table
              columns={columns}
              dataSource={cart}
              rowKey="key"
              pagination={false}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No items yet — add from the bar above" /> }}
            />

            <Row gutter={16} style={{ marginTop: 20 }}>
              <Col span={14}>
                <Card size="small" title="Collect Payment">
                  <Space wrap>
                    <div>
                      <div style={{ fontSize: 12, color: '#888' }}>Discount (₹)</div>
                      <InputNumber min={0} value={discount} onChange={(v) => setDiscount(v || 0)} style={{ width: 120 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#888' }}>Payment Mode</div>
                      <Select value={paymentMode} onChange={setPaymentMode} style={{ width: 150 }} options={['Cash', 'Card', 'UPI', 'Net Banking', 'Pending'].map(m => ({ value: m, label: m }))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#888' }}>Amount Paid (₹)</div>
                      <InputNumber min={0} max={totals.net} value={amountPaid} onChange={(v) => setAmountPaid(v || 0)} style={{ width: 140 }} />
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={10}>
                <Card size="small">
                  <Row gutter={8}>
                    <Col span={8}><Statistic title="Gross" value={totals.gross} precision={2} prefix="₹" valueStyle={{ fontSize: 16 }} /></Col>
                    <Col span={8}><Statistic title="Tax" value={totals.tax} precision={2} prefix="₹" valueStyle={{ fontSize: 16 }} /></Col>
                    <Col span={8}><Statistic title="Net Payable" value={totals.net} precision={2} prefix="₹" valueStyle={{ fontSize: 18, color: '#7c3aed', fontWeight: 700 }} /></Col>
                  </Row>
                  <Button type="primary" size="large" block icon={<DollarOutlined />} loading={submitting} disabled={cart.length === 0} onClick={handleGenerate} style={{ marginTop: 16 }}>
                    Generate Bill &amp; Collect
                  </Button>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Card>
    </div>
  );
};

export default CounterBilling;
