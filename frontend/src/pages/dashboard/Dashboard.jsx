import { Row, Col, Card, Table, Tag, Space, Avatar, Typography, Progress, Button, Empty, Skeleton } from 'antd';
import {
  UserOutlined, MedicineBoxOutlined, BankOutlined, DollarOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, HeartOutlined,
  ExperimentOutlined, RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApiQuery } from '@hooks/useApi';
import ReportService from '@services/ReportService';
import { formatCurrency } from '@utils/helpers';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const Kpi = ({ icon, label, value, trend, up, onClick, loading }) => (
  <Card
    variant="borderless"
    onClick={onClick}
    hoverable={!!onClick}
    style={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }}
    styles={{ body: { padding: 18 } }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: '#0a0a0a', color: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
      }}>{icon}</div>
      {typeof trend === 'number' && !loading && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: up ? '#f0fdf4' : '#fef2f2',
          color: up ? '#166534' : '#991b1b'
        }}>
          {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, color: '#0a0a0a' }}>
        {loading ? <Skeleton.Input style={{ width: 80, height: 30, marginTop: 4 }} active size="small" /> : (value ?? '—')}
      </div>
      <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 2 }}>vs. yesterday</div>
    </div>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useApiQuery('dashboard-stats', () => ReportService.getDashboardStats());
  const stats = data?.data || {};

  const kpis = [
    { label: 'Total Patients', value: stats.totalPatients ?? 0, icon: <UserOutlined />, trend: stats.patientsTrend, up: (stats.patientsTrend ?? 0) >= 0, onClick: () => navigate('/patients'), loading: isLoading },
    { label: 'OPD Today', value: stats.opdToday ?? 0, icon: <MedicineBoxOutlined />, trend: stats.opdTrend, up: (stats.opdTrend ?? 0) >= 0, onClick: () => navigate('/opd'), loading: isLoading },
    { label: 'IPD Admissions', value: stats.ipdAdmissions ?? 0, icon: <BankOutlined />, trend: stats.ipdTrend, up: (stats.ipdTrend ?? 0) >= 0, onClick: () => navigate('/ipd'), loading: isLoading },
    { label: 'Revenue Today', value: formatCurrency(stats.revenueToday || 0), icon: <DollarOutlined />, trend: stats.revenueTrend, up: (stats.revenueTrend ?? 0) >= 0, onClick: () => navigate('/billing'), loading: isLoading }
  ];

  const recentAppointments = (stats.opdAppointments || []).slice(0, 6);

  const appointmentColumns = [
    {
      title: 'Patient', dataIndex: 'patient_name', key: 'patient',
      render: (name) => (
        <Space>
          <Avatar size={28}>{(name || 'P').charAt(0).toUpperCase()}</Avatar>
          <span style={{ fontWeight: 500 }}>{name || '—'}</span>
        </Space>
      )
    },
    { title: 'Doctor', dataIndex: 'doctor_name', key: 'doctor', responsive: ['md'], render: (name) => <Text type="secondary">{name || '—'}</Text> },
    {
      title: 'Time', dataIndex: 'appointment_time', key: 'time', responsive: ['sm'],
      render: (time) => <Space><ClockCircleOutlined style={{ color: '#737373' }} /><Text>{time || '—'}</Text></Space>
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status) => {
        const color = status === 'Completed' ? 'success' : status === 'Checked-in' ? 'processing' : 'default';
        return <Tag color={color}>{status || 'Scheduled'}</Tag>;
      }
    }
  ];

  const bedOcc = Math.min(100, Math.max(0, stats.bedOccupancy ?? 0));
  const pendingBills = stats.pendingBills ?? 0;
  const pendingLabs = stats.pendingLabTests ?? 0;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Welcome back{stats.userName ? `, ${stats.userName}` : ''}
          </Title>
          <Text className="hms-muted" style={{ fontSize: 13 }}>
            {dayjs().format('dddd, D MMMM YYYY')} · Here's what's happening today.
          </Text>
        </div>
        <Space>
          <Button onClick={() => navigate('/appointments/book')}>Book Appointment</Button>
          <Button type="primary" onClick={() => navigate('/patients')}>Register Patient</Button>
        </Space>
      </div>

      {/* KPIs */}
      <Row gutter={[16, 16]}>
          {kpis.map((kpi, i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Kpi {...kpi} />
            </Col>
          ))}
      </Row>

      {/* Main grid */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={16}>
          <Card
            title={<span style={{ fontWeight: 600 }}>Today's appointments</span>}
            extra={<Button type="link" size="small" onClick={() => navigate('/opd/appointments')}>View all <RightOutlined /></Button>}
            variant="borderless"
          >
            <Table
              columns={appointmentColumns}
              dataSource={recentAppointments}
              pagination={false}
              rowKey={(r) => r.appointment_id || `${r.patient_name}-${r.appointment_time}`}
              scroll={{ x: 'max-content' }}
              loading={isLoading}
              size="middle"
              locale={{ emptyText: <Empty description="No appointments today" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title={<span style={{ fontWeight: 600 }}>Operational snapshot</span>} variant="borderless" style={{ marginBottom: 16 }}>
            <Space orientation="vertical" style={{ width: '100%' }} size={16}>
              <SnapshotRow
                icon={<HeartOutlined />}
                label="Bed occupancy"
                value={`${bedOcc}%`}
                percent={bedOcc}
              />
              <SnapshotRow
                icon={<DollarOutlined />}
                label="Pending bills"
                value={pendingBills}
                percent={Math.min(100, pendingBills * 4)}
              />
              <SnapshotRow
                icon={<ExperimentOutlined />}
                label="Lab tests pending"
                value={pendingLabs}
                percent={Math.min(100, pendingLabs * 5)}
              />
            </Space>
          </Card>

          <Card variant="borderless" styles={{ body: { padding: 0, background: '#0a0a0a', borderRadius: 10 } }} style={{ background: '#0a0a0a', borderColor: '#0a0a0a' }}>
            <div style={{ padding: 20, color: '#ffffff' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Shortcut
              </Text>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6, color: '#ffffff' }}>Mark your attendance</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                Check in for today's shift with one click.
              </div>
              <Button
                block
                size="large"
                style={{ marginTop: 14, height: 40, background: '#ffffff', color: '#0a0a0a', fontWeight: 600, border: 'none' }}
                onClick={() => navigate('/attendance/mark')}
              >
                Go to Attendance
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const SnapshotRow = ({ icon, label, value, percent }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <Space size={8}>
        <span style={{ color: '#525252', fontSize: 14 }}>{icon}</span>
        <Text style={{ fontWeight: 500 }}>{label}</Text>
      </Space>
      <Text strong>{value}</Text>
    </div>
    <Progress percent={percent} showInfo={false} strokeColor="#0a0a0a" railColor="#f0f0f0" size={6} />
  </div>
);

export default Dashboard;
