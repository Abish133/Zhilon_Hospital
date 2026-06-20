import { Button, Space, Tag, Table, Descriptions, Divider, Typography, Spin, Empty } from 'antd';
import { PrinterOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import SliderModal from '@components/common/SliderModal';
import apiClient from '@services/apiClient';
import { useApiQuery } from '@hooks/useApi';
import { formatCurrency, formatDate, formatDateTime } from '@utils/helpers';

const { Text, Title } = Typography;

const statusColor = (s) => (s === 'Paid' ? 'green' : s === 'Partial' ? 'orange' : 'red');

// Neat, bill-specific detail view shown in a half-width slider drawer.
// Falls back gracefully when the line-item charges can't be loaded.
const BillDetailsDrawer = ({ open, onClose, bill, onPrint, onDownload }) => {
  const episodeId = bill?.episode_id;

  const { data: chargesData, isLoading } = useApiQuery(
    ['bill-charges', episodeId],
    async () => apiClient.get(`/bill-charges/episode/${episodeId}`),
    { enabled: !!(open && episodeId) }
  );

  if (!bill) return null;

  const charges = chargesData?.data?.charges || [];
  const patientName = `${bill.patient?.first_name || ''} ${bill.patient?.last_name || ''}`.trim() || '—';

  const chargeColumns = [
    { title: '#', key: 'idx', width: 48, render: (_, __, i) => i + 1 },
    {
      title: 'Service',
      key: 'desc',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.description || r.service_name || r.service_type || 'Service'}</div>
          {r.service_type && r.description && <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.service_type}</div>}
        </div>
      )
    },
    { title: 'Qty', dataIndex: 'quantity', key: 'qty', width: 60, align: 'right', render: (q) => q || 1 },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 100, align: 'right', render: (v) => formatCurrency(v || 0) },
    { title: 'Discount', dataIndex: 'discount_amount', key: 'disc', width: 100, align: 'right', render: (v) => <span style={{ color: '#10b981' }}>{formatCurrency(v || 0)}</span> },
    { title: 'Tax', dataIndex: 'gst_amount', key: 'tax', width: 90, align: 'right', render: (v) => formatCurrency(v || 0) },
    { title: 'Amount', key: 'amt', width: 110, align: 'right', render: (_, r) => <Text strong>{formatCurrency(r.net_amount ?? r.amount ?? 0)}</Text> }
  ];

  const SummaryRow = ({ label, value, color, strong, big }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: big ? 16 : 14 }}>
      <span style={{ color: '#64748b', fontWeight: strong ? 700 : 500 }}>{label}</span>
      <span style={{ color: color || '#0f172a', fontWeight: strong ? 800 : 600 }}>{value}</span>
    </div>
  );

  const footer = (
    <div style={{ textAlign: 'right' }}>
      <Space>
        <Button onClick={onClose}>Close</Button>
        {onPrint && <Button icon={<PrinterOutlined />} onClick={() => onPrint(bill)}>Print</Button>}
        {onDownload && <Button type="primary" icon={<FilePdfOutlined />} onClick={() => onDownload(bill)}>Download PDF</Button>}
      </Space>
    </div>
  );

  return (
    <SliderModal
      open={open}
      onClose={onClose}
      width="50%"
      title={<Space><FileTextOutlined /> Bill Details</Space>}
      footer={footer}
      styles={{ body: { padding: 24 } }}
    >
      {/* Header banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: 20,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #4c1d95 100%)',
          color: '#fff',
          marginBottom: 20
        }}
      >
        <div>
          <Text style={{ color: '#c7d2fe', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Bill Number</Text>
          <Title level={3} style={{ color: '#fff', margin: '2px 0 8px' }}>{bill.bill_number || '—'}</Title>
          <Space>
            <Tag color={bill.bill_type === 'OPD' ? 'blue' : 'green'}>{bill.bill_type}</Tag>
            <Tag color={statusColor(bill.payment_status)}>{bill.payment_status}</Tag>
          </Space>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ color: '#c7d2fe', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Net Amount</Text>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{formatCurrency(bill.net_amount)}</div>
          <Text style={{ color: '#c7d2fe', fontSize: 12 }}>{formatDate(bill.bill_date)}</Text>
        </div>
      </div>

      {/* Patient + meta */}
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Patient">{patientName}</Descriptions.Item>
        <Descriptions.Item label="UHID">{bill.patient?.uhid || bill.uhid || '—'}</Descriptions.Item>
        <Descriptions.Item label="Mobile">{bill.patient?.mobile_number || '—'}</Descriptions.Item>
        <Descriptions.Item label="Bill Date">{formatDateTime(bill.bill_date)}</Descriptions.Item>
        <Descriptions.Item label="Payment Mode">{bill.payment_mode || '—'}</Descriptions.Item>
        <Descriptions.Item label="Generated By">{bill.generatedBy?.name || bill.generatedBy?.username || 'System'}</Descriptions.Item>
      </Descriptions>

      {/* Line items */}
      <Divider orientation="left" style={{ fontWeight: 700, color: '#0f172a' }}>Charges</Divider>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      ) : charges.length === 0 ? (
        <Empty description="No itemized charges recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          columns={chargeColumns}
          dataSource={charges}
          rowKey={(r) => r.charge_id || r.bill_charge_id || `${r.description}-${r.rate}`}
          size="small"
          pagination={false}
          scroll={{ x: 600 }}
        />
      )}

      {/* Amount summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <div style={{ width: 320, maxWidth: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 18px' }}>
          <SummaryRow label="Gross Amount" value={formatCurrency(bill.gross_amount)} />
          <SummaryRow label="Discount" value={`- ${formatCurrency(bill.discount_amount || 0)}`} color="#10b981" />
          <SummaryRow label="Tax" value={formatCurrency(bill.tax_amount || 0)} />
          {bill.advance_adjusted > 0 && <SummaryRow label="Advance Adjusted" value={`- ${formatCurrency(bill.advance_adjusted)}`} color="#10b981" />}
          <Divider style={{ margin: '8px 0' }} />
          <SummaryRow label="Net Amount" value={formatCurrency(bill.net_amount)} strong big />
          <SummaryRow label="Paid" value={formatCurrency(bill.paid_amount || 0)} color="#10b981" />
          <SummaryRow
            label="Balance"
            value={formatCurrency(bill.balance_amount || 0)}
            color={bill.balance_amount > 0 ? '#ef4444' : '#10b981'}
            strong
          />
        </div>
      </div>
    </SliderModal>
  );
};

export default BillDetailsDrawer;
