import { Card, Table, Button, Space, message, Descriptions, Divider, Form, Select, InputNumber, Input, Row, Col, Tag, Spin, Popconfirm } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PrinterOutlined, DollarOutlined, FilePdfOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { generateBillPDF } from '@utils/pdfGenerator';
import { printBill } from '@utils/billPrintHelper';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// jspdf-autotable v5 doesn't attach doc.autoTable on plain import — apply the plugin.
applyPlugin(jsPDF);
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
  const departmentFilter = searchParams.get('department'); // Pharmacy, Investigation, etc.
  
  const [paymentModal, setPaymentModal] = useState(false);
  const [addChargeModal, setAddChargeModal] = useState(false);
  const [paymentForm] = Form.useForm();
  const [chargeForm] = Form.useForm();
  const [selectedCharges, setSelectedCharges] = useState([]);

  // Pharmacy itemized-detail drill-down (for a "Pharmacy charges" line)
  const [pharmacyModal, setPharmacyModal] = useState(false);
  const [pharmacySale, setPharmacySale] = useState(null);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);

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

  const { data: existingBillData, refetch: refetchBill } = useApiQuery(
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
        setSelectedCharges([]);
        paymentForm.resetFields();
        refetchCharges();
        if (refetchBill) refetchBill();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || 'Payment processing failed');
      }
    }
  );

  const rawCharges = chargesData?.data?.charges || [];
  const charges = departmentFilter ? rawCharges.filter(c => c.service_type === departmentFilter) : rawCharges;
  
  // Calculate dynamic totals for the filtered view
  const totals = departmentFilter ? {
    gross_amount: charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
    discount_amount: charges.reduce((sum, c) => sum + parseFloat(c.discount_amount || 0), 0),
    tax_amount: charges.reduce((sum, c) => sum + parseFloat(c.gst_amount || 0), 0),
    net_amount: charges.reduce((sum, c) => sum + parseFloat(c.net_amount || 0), 0),
    paid_amount: charges.reduce((sum, c) => sum + parseFloat(c.paid_amount || 0), 0),
    balance_amount: charges.reduce((sum, c) => sum + parseFloat(c.balance_amount || 0), 0)
  } : (chargesData?.data?.totals || {
    gross_amount: 0,
    discount_amount: 0,
    tax_amount: 0,
    net_amount: 0,
    paid_amount: 0,
    balance_amount: 0
  });

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
      if (refetchBill) refetchBill();
    } catch (error) {
    }
  };

  const handlePayment = async (values) => {
    if (!user?.hospital_id) {
      message.error('Hospital context missing. Please sign in again.');
      return;
    }
    try {
      // Generate bill if one doesn't exist yet
      let billId = existingBill?.bill_id;
      if (!billExists) {
        const billResponse = await generateBillMutation.mutateAsync({
          episode_id: episodeId,
          discount_amount: 0,
          generated_by: user.id,
          hospital_id: user.hospital_id
        });
        billId = billResponse.data.bill_id;
      }

      // Map selected charges to allocations
      const allocations = selectedCharges.map(chargeId => {
        const charge = charges.find(c => c.charge_id === chargeId);
        return {
          charge_id: chargeId,
          amount: parseFloat(charge.balance_amount)
        };
      });

      // Then process payment
      await processPaymentMutation.mutateAsync({
        bill_id: billId || null,
        payment_type: 'Bill Payment',
        amount_paid: values.amount_paid,
        payment_mode: values.payment_mode,
        transaction_ref: values.transaction_ref || null,
        bank_name: values.bank_name || null,
        received_by: user.id,
        hospital_id: user.hospital_id,
        allocations: allocations.length > 0 ? allocations : undefined
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

  // ── Pharmacy itemized detail ──────────────────────────────────────
  // A "Pharmacy charges" line is a single rolled-up BillCharge whose service_id
  // points at the PharmacySale. Fetch that sale's per-medicine breakdown.
  const openPharmacyDetail = async (record) => {
    setPharmacyModal(true);
    setPharmacyLoading(true);
    setPharmacySale(null);
    try {
      const resp = await apiClient.get(`/pharmacy-sales/${record.service_id}`);
      setPharmacySale(resp?.data || null);
    } catch (e) {
      message.error('Could not load pharmacy details');
    } finally {
      setPharmacyLoading(false);
    }
  };

  const pharmacyItems = pharmacySale?.details || [];
  const pharmacyHeader = () => ({
    title: episode.episode_type === 'IPD' ? 'PHARMACY ISSUE' : 'PHARMACY BILL',
    patient: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || (pharmacySale?.patient ? `${pharmacySale.patient.first_name || ''} ${pharmacySale.patient.last_name || ''}`.trim() : ''),
    uhid: patient.uhid || pharmacySale?.uhid || 'N/A',
    saleNo: `PH-${String(pharmacySale?.sale_id || '').padStart(6, '0')}`,
    date: formatDate(pharmacySale?.sale_date || new Date()),
    gross: Number(pharmacySale?.total_amount || 0),
    tax: Number(pharmacySale?.tax_amount || 0),
    net: Number(pharmacySale?.net_amount || 0)
  });

  const printPharmacy = () => {
    if (!pharmacySale) return;
    const h = pharmacyHeader();
    const rows = pharmacyItems.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${d.medicine_name || '-'}</td>
        <td style="text-align:center">${d.quantity || 0}</td>
        <td style="text-align:right">${Number(d.rate || 0).toFixed(2)}</td>
        <td style="text-align:center">${Number(d.gst_percentage || 0)}%</td>
        <td style="text-align:right">${Number(d.amount || 0).toFixed(2)}</td>
      </tr>`).join('');
    const html = `<html><head><title>${h.saleNo}</title><style>
      body{font-family:Arial,sans-serif;margin:24px;color:#111;font-size:13px}
      h2{text-align:center;margin:0 0 2px}
      .sub{text-align:center;color:#666;margin-bottom:14px}
      .meta{display:flex;justify-content:space-between;border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:6px 10px}
      th{background:#f3f4f6;text-align:left}
      tfoot td{font-weight:bold;border:none}
      .right{text-align:right}
    </style></head><body>
      <h2>Pharmacy ${episode.episode_type === 'IPD' ? 'Issue Note' : 'Bill'}</h2>
      <div class="sub">${h.saleNo} • ${h.date}</div>
      <div class="meta"><div><b>Patient:</b> ${h.patient}</div><div><b>UHID:</b> ${h.uhid}</div></div>
      <table><thead><tr><th>#</th><th>Medicine</th><th style="text-align:center">Qty</th><th class="right">Rate</th><th style="text-align:center">GST%</th><th class="right">Amount</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center">No items</td></tr>'}</tbody>
      <tfoot>
        <tr><td colspan="5" class="right">Gross</td><td class="right">₹${h.gross.toFixed(2)}</td></tr>
        <tr><td colspan="5" class="right">Tax</td><td class="right">₹${h.tax.toFixed(2)}</td></tr>
        <tr><td colspan="5" class="right">Net Total</td><td class="right">₹${h.net.toFixed(2)}</td></tr>
      </tfoot></table>
      <p style="margin-top:30px;text-align:right">Pharmacist: ____________________</p>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { message.error('Pop-up blocked. Allow pop-ups to print.'); return; }
    w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  const downloadPharmacyPDF = () => {
    if (!pharmacySale) return;
    const h = pharmacyHeader();
    const doc = new jsPDF();
    doc.setFontSize(15); doc.text(`Pharmacy ${episode.episode_type === 'IPD' ? 'Issue Note' : 'Bill'}`, 105, 18, { align: 'center' });
    doc.setFontSize(10); doc.text(`${h.saleNo}  •  ${h.date}`, 105, 25, { align: 'center' });
    doc.text(`Patient: ${h.patient}`, 14, 35);
    doc.text(`UHID: ${h.uhid}`, 150, 35);
    doc.autoTable({
      startY: 40,
      head: [['#', 'Medicine', 'Qty', 'Rate', 'GST%', 'Amount']],
      body: pharmacyItems.map((d, i) => [i + 1, d.medicine_name || '-', d.quantity || 0, Number(d.rate || 0).toFixed(2), `${Number(d.gst_percentage || 0)}%`, Number(d.amount || 0).toFixed(2)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    const y = (doc.lastAutoTable?.finalY || 60) + 8;
    doc.setFontSize(10);
    doc.text(`Gross: ${h.gross.toFixed(2)}`, 150, y);
    doc.text(`Tax: ${h.tax.toFixed(2)}`, 150, y + 6);
    doc.setFontSize(12); doc.text(`Net Total: ${h.net.toFixed(2)}`, 150, y + 14);
    doc.save(`${h.saleNo}.pdf`);
    message.success('Pharmacy bill downloaded');
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
    {
      title: 'Paid',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (val) => <span style={{ color: '#10b981' }}>{formatCurrency(val || 0)}</span>
    },
    {
      title: 'Balance',
      dataIndex: 'balance_amount',
      key: 'balance_amount',
      render: (val) => <strong style={{ color: parseFloat(val) > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(val || 0)}</strong>
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => (
        <Tag color={status === 'Paid' ? 'green' : status === 'Partial' ? 'orange' : 'red'}>
          {status || 'Unpaid'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Space>
          {record.service_type === 'Pharmacy' && record.service_id && (
            <Button
              icon={<EyeOutlined />}
              size="small"
              title="View pharmacy items"
              onClick={() => openPharmacyDetail(record)}
            />
          )}
          {!billExists && (
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
          )}
        </Space>
      )
    }
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
            {departmentFilter && <Tag color="blue">{departmentFilter} Department</Tag>}
          </Space>
        }
        extra={
          <Space>
            {!departmentFilter && (
              <Button onClick={() => navigate('/billing')}>Back to Billing</Button>
            )}
            {departmentFilter && (
              <Button onClick={() => navigate(-1)}>Back</Button>
            )}
            
            {!billExists && !departmentFilter && (
              <Button 
                icon={<PlusOutlined />} 
                onClick={() => setAddChargeModal(true)}
              >
                Add Charge
              </Button>
            )}
            
            {!billExists && !departmentFilter && (
              <Button onClick={handleGenerateBill}>
                Generate Bill Only
              </Button>
            )}
            
            {!((billExists && existingBill.balance_amount === 0) || (departmentFilter && totals.balance_amount === 0)) && (billExists || charges.length > 0) && (
              <Button 
                type="primary" 
                icon={<DollarOutlined />}
                onClick={() => {
                  const amt = selectedCharges.length > 0 
                    ? charges.filter(c => selectedCharges.includes(c.charge_id)).reduce((sum, c) => sum + parseFloat(c.balance_amount || 0), 0)
                    : (existingBill ? existingBill.balance_amount : totals.net_amount);
                  paymentForm.setFieldsValue({ amount_paid: amt || 0 });
                  setPaymentModal(true);
                }}
                disabled={charges.length === 0}
              >
                Collect Payment
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
            {((billExists && existingBill.balance_amount === 0) || (departmentFilter && totals.balance_amount === 0)) && (
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
          rowSelection={{
            selectedRowKeys: selectedCharges,
            onChange: (selectedRowKeys) => {
              setSelectedCharges(selectedRowKeys);
              // Recalculate modal default amount based on selected items
              const selectedTotal = charges
                .filter(c => selectedRowKeys.includes(c.charge_id))
                .reduce((sum, c) => sum + parseFloat(c.balance_amount || 0), 0);
              paymentForm.setFieldsValue({ amount_paid: selectedTotal || totals.net_amount });
            },
            getCheckboxProps: (record) => ({
              disabled: record.payment_status === 'Paid' || parseFloat(record.balance_amount || 0) <= 0,
              name: record.description,
            }),
          }}
          summary={() => (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={7} align="right">
                  <strong>Gross Amount:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  <strong>{formatCurrency(totals.gross_amount || 0)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell colSpan={4} />
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={7} align="right">
                  Discount:
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  {formatCurrency(totals.discount_amount || 0)}
                </Table.Summary.Cell>
                <Table.Summary.Cell colSpan={4} />
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={7} align="right">
                  Tax:
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  {formatCurrency(totals.tax_amount || 0)}
                </Table.Summary.Cell>
                <Table.Summary.Cell colSpan={4} />
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={7} align="right">
                  <strong style={{ fontSize: 16 }}>Net Amount:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  <strong style={{ fontSize: 16, color: '#0a0a0a' }}>
                    {formatCurrency(totals.net_amount || 0)}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell colSpan={4} />
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
        title={billExists ? "Collect Payment" : "Generate Bill & Collect Payment"}
        open={paymentModal}
        onCancel={() => setPaymentModal(false)}
        footer={null}
        width={600}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handlePayment}>
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Total Amount to Pay">
              <strong style={{ fontSize: 18, color: '#0a0a0a' }}>
                {formatCurrency(
                  selectedCharges.length > 0 
                    ? charges.filter(c => selectedCharges.includes(c.charge_id)).reduce((sum, c) => sum + parseFloat(c.balance_amount || 0), 0)
                    : (existingBill ? existingBill.balance_amount : totals.net_amount || 0)
                )}
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
              max={
                selectedCharges.length > 0 
                  ? charges.filter(c => selectedCharges.includes(c.charge_id)).reduce((sum, c) => sum + parseFloat(c.balance_amount || 0), 0)
                  : (existingBill ? existingBill.balance_amount : totals.net_amount)
              }
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
              {!billExists && (
                <Button 
                  onClick={handleGenerateBill}
                  loading={generateBillMutation.isPending}
                >
                  Generate Bill Only
                </Button>
              )}
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={processPaymentMutation.isPending}
              >
                {billExists ? 'Process Payment' : 'Generate Bill & Process Payment'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Pharmacy itemized detail — right-side slider drawer */}
      <SliderModal
        title={<Space><MedicineBoxOutlined style={{ color: '#2563eb' }} /><span>Pharmacy Items</span></Space>}
        open={pharmacyModal}
        onCancel={() => setPharmacyModal(false)}
        width={620}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPharmacyModal(false)}>Close</Button>
              <Button icon={<PrinterOutlined />} onClick={printPharmacy} disabled={!pharmacySale}>Print</Button>
              <Button type="primary" icon={<FilePdfOutlined />} onClick={downloadPharmacyPDF} disabled={!pharmacySale}>Download PDF</Button>
            </Space>
          </div>
        }
      >
        {pharmacyLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : !pharmacySale ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>No pharmacy details found for this charge.</div>
        ) : (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Sale No">{`PH-${String(pharmacySale.sale_id).padStart(6, '0')}`}</Descriptions.Item>
              <Descriptions.Item label="Date">{formatDate(pharmacySale.sale_date)}</Descriptions.Item>
              <Descriptions.Item label="Patient">{patient.first_name} {patient.last_name}</Descriptions.Item>
              <Descriptions.Item label="UHID">{patient.uhid || pharmacySale.uhid}</Descriptions.Item>
            </Descriptions>
            <Table
              size="small"
              pagination={false}
              rowKey={(r) => r.sale_detail_id || r.id || r.medicine_id}
              dataSource={pharmacyItems}
              columns={[
                { title: '#', key: 'idx', width: 48, align: 'center', render: (_, __, i) => i + 1 },
                { title: 'Medicine', dataIndex: 'medicine_name', key: 'medicine_name' },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'center', width: 70 },
                { title: 'Rate', dataIndex: 'rate', key: 'rate', align: 'right', width: 90, render: (v) => formatCurrency(v) },
                { title: 'GST%', dataIndex: 'gst_percentage', key: 'gst', align: 'center', width: 70, render: (v) => `${Number(v || 0)}%` },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', width: 100, render: (v) => <strong>{formatCurrency(v)}</strong> }
              ]}
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5} align="right">Gross</Table.Summary.Cell>
                    <Table.Summary.Cell align="right">{formatCurrency(pharmacySale.total_amount || 0)}</Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5} align="right">Tax</Table.Summary.Cell>
                    <Table.Summary.Cell align="right">{formatCurrency(pharmacySale.tax_amount || 0)}</Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5} align="right"><strong>Net Total</strong></Table.Summary.Cell>
                    <Table.Summary.Cell align="right"><strong>{formatCurrency(pharmacySale.net_amount || 0)}</strong></Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />
          </>
        )}
      </SliderModal>
    </div>
  );
};

export default BillGeneration;
