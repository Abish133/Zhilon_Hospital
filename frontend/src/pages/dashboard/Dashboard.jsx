import { Row, Col, Card, Table, Tag, Space, Avatar, Typography, Progress, Button, Empty, Skeleton } from 'antd';
import {
  UserOutlined, MedicineBoxOutlined, BankOutlined, DollarOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, HeartOutlined,
  ExperimentOutlined, RightOutlined, FileTextOutlined
} from '@ant-design/icons';
import { Area, Column, Pie } from '@ant-design/charts';
import { useNavigate } from 'react-router-dom';
import { useApiQuery } from '@hooks/useApi';
import ReportService from '@services/ReportService';
import { formatCurrency } from '@utils/helpers';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const Kpi = ({ icon, label, value, trend, up, onClick, loading, accent = '#0a0a0a' }) => (
  <Card variant="borderless" onClick={onClick} hoverable={!!onClick}
    style={{ height: '100%', cursor: onClick ? 'pointer' : 'default', borderRadius: 14 }}
    styles={{ body: { padding: 18 } }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{icon}</div>
      {!loading && typeof trend === 'number' && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
          borderRadius: 6, fontSize: 12, fontWeight: 600, background: up ? '#f0fdf4' : '#fef2f2', color: up ? '#166534' : '#991b1b' }}>
          {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{Math.abs(trend)}%
        </div>
      )}
      {!loading && trend === null && (
        <div title="No data for yesterday to compare" style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
          borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#f5f5f5', color: '#a3a3a3' }}>—</div>
      )}
    </div>
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, color: '#0a0a0a' }}>
        {loading ? <Skeleton.Input style={{ width: 80, height: 30, marginTop: 4 }} active size="small" /> : (value ?? '—')}
      </div>
      <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 2 }}>vs. yesterday</div>
    </div>
  </Card>
);

const SnapshotRow = ({ icon, label, value, percent, color = '#0a0a0a' }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <Space size={8}><span style={{ color: '#525252', fontSize: 14 }}>{icon}</span><Text style={{ fontWeight: 500 }}>{label}</Text></Space>
      <Text strong>{value}</Text>
    </div>
    <Progress percent={percent} showInfo={false} strokeColor={color} size={6} />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  const today = dayjs();
  const from = today.subtract(13, 'day').format('YYYY-MM-DD');
  const to = today.format('YYYY-MM-DD');

  const { data, isLoading } = useApiQuery('dashboard-stats', () => ReportService.getDashboardStats());
  const stats = data?.data || {};

  // OPD footfall trend (last 14 days) — shown to everyone.
  const { data: opdData, isLoading: opdLoading } = useApiQuery(['dash-opd-trend', from, to], () => ReportService.getOPDFootfall({ from, to }));
  const trend = (opdData?.data || [])
    .map(r => ({ date: dayjs(r.date).format('DD MMM'), _d: r.date, count: Number(r.total_appointments || 0), completed: Number(r.completed || 0) }))
    .sort((a, b) => new Date(a._d) - new Date(b._d));

  // Revenue by service — ADMIN ONLY.
  const { data: revData } = useApiQuery(['dash-revenue', from, to], () => ReportService.getRevenue({ from, to }), { enabled: isAdmin });
  const revenue = (revData?.data || []).map(r => ({ service: r.service || 'Other', revenue: Number(r.revenue || 0) })).filter(r => r.revenue > 0);

  // Appointment status distribution (from today's list).
  const apptList = stats.opdAppointments || [];
  const statusCounts = apptList.reduce((acc, a) => { const s = a.status || 'Scheduled'; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  const statusPie = Object.entries(statusCounts).map(([type, value]) => ({ type, value }));

  const kpis = [
    { label: 'Total Patients', value: stats.totalPatients ?? 0, icon: <UserOutlined />, trend: stats.patientsTrend, up: (stats.patientsTrend ?? 0) >= 0, onClick: () => navigate('/patients'), loading: isLoading, accent: '#0a0a0a' },
    { label: 'OPD Today', value: stats.opdToday ?? 0, icon: <MedicineBoxOutlined />, trend: stats.opdTrend, up: (stats.opdTrend ?? 0) >= 0, onClick: () => navigate('/opd'), loading: isLoading, accent: '#7c3aed' },
    { label: 'IPD Admissions', value: stats.ipdAdmissions ?? 0, icon: <BankOutlined />, trend: stats.ipdTrend, up: (stats.ipdTrend ?? 0) >= 0, onClick: () => navigate('/ipd'), loading: isLoading, accent: '#2563eb' },
    // Revenue is admin-only; everyone else sees Pending Bills instead.
    isAdmin
      ? { label: 'Revenue Today', value: formatCurrency(stats.revenueToday || 0), icon: <DollarOutlined />, trend: stats.revenueTrend, up: (stats.revenueTrend ?? 0) >= 0, onClick: () => navigate('/billing'), loading: isLoading, accent: '#16a34a' }
      : { label: 'Pending Bills', value: stats.pendingBills ?? 0, icon: <FileTextOutlined />, onClick: () => navigate('/billing'), loading: isLoading, accent: '#ea580c' }
  ];

  const appointmentColumns = [
    { title: 'Patient', dataIndex: 'patient_name', key: 'patient', render: (name) => (
      <Space><Avatar size={28} style={{ background: '#ede9fe', color: '#4c1d95', fontWeight: 600 }}>{(name || 'P').charAt(0).toUpperCase()}</Avatar><span style={{ fontWeight: 500 }}>{name || '—'}</span></Space>) },
    { title: 'Doctor', dataIndex: 'doctor_name', key: 'doctor', responsive: ['md'], render: (name) => <Text type="secondary">{name || '—'}</Text> },
    { title: 'Time', dataIndex: 'appointment_time', key: 'time', responsive: ['sm'], render: (time) => <Space><ClockCircleOutlined style={{ color: '#737373' }} /><Text>{time || '—'}</Text></Space> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => {
      const color = status === 'Completed' ? 'success' : status === 'Checked-in' ? 'processing' : status === 'In-consultation' ? 'warning' : 'default';
      return <Tag color={color}>{status || 'Scheduled'}</Tag>;
    } }
  ];

  const bedOcc = Math.min(100, Math.max(0, stats.bedOccupancy ?? 0));
  const pendingBills = stats.pendingBills ?? 0;
  const pendingLabs = stats.pendingLabTests ?? 0;

  const cardStyle = { borderRadius: 14 };
  const palette = ['#7c3aed', '#2563eb', '#06b6d4', '#16a34a', '#f59e0b', '#ef4444'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Welcome back{stats.userName ? `, ${stats.userName}` : ''}
          </Title>
          <Text className="hms-muted" style={{ fontSize: 13 }}>{today.format('dddd, D MMMM YYYY')} · Here's what's happening today.</Text>
        </div>
        <Space>
          <Button onClick={() => navigate('/appointments/book')}>Book Appointment</Button>
          <Button type="primary" onClick={() => navigate('/patients')}>Register Patient</Button>
        </Space>
      </div>

      {/* KPIs */}
      <Row gutter={[16, 16]}>
        {kpis.map((kpi, i) => (<Col xs={24} sm={12} lg={6} key={i}><Kpi {...kpi} /></Col>))}
      </Row>

      {/* Charts row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={16}>
          <Card title={<span style={{ fontWeight: 600 }}>OPD footfall · last 14 days</span>} variant="borderless" style={cardStyle}>
            {opdLoading ? <Skeleton active /> : trend.length === 0
              ? <Empty description="No OPD data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} />
              : <Area data={trend} xField="date" yField="count" height={280} smooth shapeField="smooth"
                  style={{ fill: 'l(270) 0:rgba(124,58,237,0.05) 1:rgba(124,58,237,0.45)' }}
                  line={{ style: { stroke: '#7c3aed', lineWidth: 2 } }}
                  axis={{ y: { title: false }, x: { title: false } }} />}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title={<span style={{ fontWeight: 600 }}>Bed occupancy</span>} variant="borderless" style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <Progress type="dashboard" percent={bedOcc} strokeColor={{ '0%': '#7c3aed', '100%': '#2563eb' }} size={150} />
              <div style={{ marginTop: 8, color: '#737373', fontSize: 13 }}>of beds occupied</div>
            </div>
          </Card>
          <Card title={<span style={{ fontWeight: 600 }}>Operational snapshot</span>} variant="borderless" style={cardStyle}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <SnapshotRow icon={<HeartOutlined />} label="Bed occupancy" value={`${bedOcc}%`} percent={bedOcc} color="#7c3aed" />
              <SnapshotRow icon={<FileTextOutlined />} label="Pending bills" value={pendingBills} percent={Math.min(100, pendingBills * 4)} color="#ea580c" />
              <SnapshotRow icon={<ExperimentOutlined />} label="Lab tests pending" value={pendingLabs} percent={Math.min(100, pendingLabs * 5)} color="#06b6d4" />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Revenue (admin) + status distribution */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {isAdmin && (
          <Col xs={24} xl={12}>
            <Card title={<span style={{ fontWeight: 600 }}>Revenue by service · last 14 days</span>} variant="borderless" style={cardStyle}>
              {revenue.length === 0
                ? <Empty description="No revenue in range" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} />
                : <Column data={revenue} xField="service" yField="revenue" height={280}
                    style={{ fill: '#16a34a', radiusTopLeft: 6, radiusTopRight: 6 }}
                    axis={{ y: { labelFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` }, x: { title: false } }} />}
            </Card>
          </Col>
        )}
        <Col xs={24} xl={isAdmin ? 12 : 24}>
          <Card title={<span style={{ fontWeight: 600 }}>Today's appointment status</span>} variant="borderless" style={cardStyle}>
            {statusPie.length === 0
              ? <Empty description="No appointments today" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} />
              : <Pie data={statusPie} angleField="value" colorField="type" height={280} innerRadius={0.55}
                  scale={{ color: { range: palette } }}
                  legend={{ color: { position: 'bottom' } }}
                  label={{ text: 'value', position: 'outside' }} />}
          </Card>
        </Col>
      </Row>

      {/* Today's appointments + shortcut */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={16}>
          <Card title={<span style={{ fontWeight: 600 }}>Today's appointments</span>}
            extra={<Button type="link" size="small" onClick={() => navigate('/opd/appointments')}>View all <RightOutlined /></Button>}
            variant="borderless" style={cardStyle}>
            <Table columns={appointmentColumns} dataSource={apptList.slice(0, 6)} pagination={false}
              rowKey={(r) => r.appointment_id || `${r.patient_name}-${r.appointment_time}`} scroll={{ x: 'max-content' }}
              loading={isLoading} size="middle"
              locale={{ emptyText: <Empty description="No appointments today" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card variant="borderless" styles={{ body: { padding: 0, background: 'linear-gradient(135deg,#0a0a0a,#1e1b4b)', borderRadius: 14 } }} style={{ ...cardStyle, background: '#0a0a0a', borderColor: '#0a0a0a' }}>
            <div style={{ padding: 22, color: '#ffffff' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Shortcut</Text>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6, color: '#ffffff' }}>Mark your attendance</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>Check in for today's shift with one click.</div>
              <Button block size="large" style={{ marginTop: 14, height: 40, background: '#ffffff', color: '#0a0a0a', fontWeight: 600, border: 'none' }}
                onClick={() => navigate('/attendance/mark')}>Go to Attendance</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
