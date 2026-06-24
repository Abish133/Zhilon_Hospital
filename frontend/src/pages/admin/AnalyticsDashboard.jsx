import { Card, Row, Col, Statistic, Progress, Table, DatePicker, Space, Spin, Empty, Alert, Tag } from 'antd';
import {
  UserOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined,
  MedicineBoxOutlined, BankOutlined, ExperimentOutlined
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import apiClient from '@config/api';
import { formatCurrency } from '@utils/helpers';
import { useAuthStore } from '@store';

const { RangePicker } = DatePicker;

// Helper: safe-fetch — never let one failing widget crash the whole dashboard.
// Returns the unwrapped data field (apiClient interceptor already returns response.data).
const safeFetch = async (url, params) => {
  try {
    const res = await apiClient.get(url, { params });
    // Endpoints inconsistently return { success, data } or the raw object.
    return res?.data ?? res ?? null;
  } catch (e) {
    console.warn(`Analytics widget failed (${url}):`, e?.message || e);
    return null;
  }
};

// Pretty arrow + colour based on trend value coming from dashboard-stats.
const TrendBadge = ({ value }) => {
  if (value == null || isNaN(value)) return null;
  const positive = Number(value) >= 0;
  return (
    <span style={{ color: positive ? '#10b981' : '#ef4444', fontSize: 12 }}>
      {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(value)}% vs yesterday
    </span>
  );
};

const AnalyticsDashboard = () => {
  const { user } = useAuthStore();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  // Default reporting window: last 30 days. Single source of truth — every
  // backend call passes the same from/to so widgets stay in sync.
  const [range, setRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    dashboard: null,
    revenue: [],
    doctors: [],
    departments: []
  });

  const loadAll = async () => {
    setLoading(true);
    const [from, to] = range;
    const fromStr = from.format('YYYY-MM-DD');
    const toStr = to.format('YYYY-MM-DD');

    // Run all four in parallel; safeFetch ensures one slow/failing widget
    // can't deny the page to the user.
    const [dashboard, revenue, doctors, departments] = await Promise.all([
      safeFetch('/reports/dashboard-stats'),
      // The classic ReportController accepts from/to (no underscore).
      safeFetch('/reports/revenue', { from: fromStr, to: toStr }),
      safeFetch('/reports/doctor-performance', { from: fromStr, to: toStr }),
      // The enhanced controller uses from_date/to_date — these endpoint
      // contracts diverge but both are real.
      safeFetch('/reports-advanced/departments/performance', { from_date: fromStr, to_date: toStr })
    ]);

    setData({
      dashboard: dashboard || null,
      revenue: Array.isArray(revenue) ? revenue : [],
      doctors: Array.isArray(doctors) ? doctors : [],
      departments: Array.isArray(departments) ? departments : []
    });
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range[0]?.valueOf(), range[1]?.valueOf()]);

  const stats = data.dashboard?.stats || data.dashboard || {};
  // Different report endpoints return different field names — normalize here.
  const totalRevenue = useMemo(
    () => data.revenue.reduce((s, r) => s + Number(r.revenue || r.total_revenue || 0), 0),
    [data.revenue]
  );

  const revenueColumns = [
    { title: 'Service', dataIndex: 'service', key: 'service' },
    { title: 'Bills', dataIndex: 'count', key: 'count' },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (v) => formatCurrency(v),
      sorter: (a, b) => Number(a.revenue || 0) - Number(b.revenue || 0)
    }
  ];

  const doctorColumns = [
    { title: 'Doctor', dataIndex: 'doctor_name', key: 'name' },
    { title: 'Specialization', dataIndex: 'specialization', key: 'spec', render: (v) => v ? <Tag>{v}</Tag> : '—' },
    {
      title: 'Consultations',
      dataIndex: 'consultations',
      key: 'cons',
      align: 'right',
      sorter: (a, b) => (a.consultations || 0) - (b.consultations || 0),
      defaultSortOrder: 'descend'
    }
  ];

  const departmentColumns = [
    { title: 'Department', dataIndex: 'name', key: 'name' },
    { title: 'OPD Patients', dataIndex: 'total_opd_patients', key: 'opd', align: 'right' },
    { title: 'IPD Patients', dataIndex: 'total_ipd_patients', key: 'ipd', align: 'right' },
    // Revenue column is admin-only.
    ...(isAdmin ? [{
      title: 'Revenue',
      dataIndex: 'total_revenue',
      key: 'rev',
      align: 'right',
      render: (v) => formatCurrency(v),
      sorter: (a, b) => Number(a.total_revenue || 0) - Number(b.total_revenue || 0),
      defaultSortOrder: 'descend'
    }] : [])
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Analytics Dashboard</h2>
        <Space>
          <span style={{ color: '#64748b' }}>Period:</span>
          <RangePicker
            value={range}
            onChange={(v) => v && setRange(v)}
            allowClear={false}
            format="DD-MM-YYYY"
            presets={[
              { label: 'Today', value: [dayjs(), dayjs()] },
              { label: 'Last 7 days', value: [dayjs().subtract(6, 'day'), dayjs()] },
              { label: 'Last 30 days', value: [dayjs().subtract(29, 'day'), dayjs()] },
              { label: 'This month', value: [dayjs().startOf('month'), dayjs()] },
              { label: 'This year', value: [dayjs().startOf('year'), dayjs()] }
            ]}
          />
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* ── Top-line stats — these come from /reports/dashboard-stats (today vs yesterday) ── */}
        <Row gutter={[16, 16]}>
          {isAdmin && (
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Revenue Today"
                  value={Number(stats.revenue_today || stats.revenueToday || 0)}
                  formatter={(v) => formatCurrency(v)}
                  prefix={<DollarOutlined />}
                />
                <div style={{ marginTop: 8 }}>
                  <TrendBadge value={stats.revenue_trend ?? stats.revenueTrend} />
                </div>
              </Card>
            </Col>
          )}
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Patients"
                value={Number(stats.total_patients || stats.totalPatients || 0)}
                prefix={<UserOutlined />}
              />
              <div style={{ marginTop: 8 }}>
                <TrendBadge value={stats.patients_trend ?? stats.patientsTrend} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Bed Occupancy"
                value={Number(stats.bed_occupancy ?? stats.bedOccupancy ?? 0)}
                suffix="%"
                prefix={<BankOutlined />}
              />
              <Progress
                percent={Number(stats.bed_occupancy ?? stats.bedOccupancy ?? 0)}
                showInfo={false}
                strokeColor={
                  (stats.bed_occupancy ?? stats.bedOccupancy ?? 0) > 85 ? '#ef4444' :
                  (stats.bed_occupancy ?? stats.bedOccupancy ?? 0) > 60 ? '#f59e0b' : '#10b981'
                }
              />
              <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                {stats.bed_occupied ?? stats.bedOccupied ?? 0} of {stats.bed_total ?? stats.bedTotal ?? 0} beds
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending Bills"
                value={Number(stats.pending_bills ?? stats.pendingBills ?? 0)}
                prefix={<ExperimentOutlined />}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                {stats.pending_labs ?? stats.pendingLabs ?? 0} lab orders pending
              </div>
            </Card>
          </Col>
        </Row>

        {/* If the dashboard endpoint failed entirely, tell the user — better than blank cards. */}
        {!data.dashboard && !loading && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
            message="Live dashboard stats are unavailable"
            description="Could not reach /api/reports/dashboard-stats. The numbers above will show as zero. Period-based reports below may still work."
          />
        )}

        {/* ── Revenue breakdown by service type — admin only ── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {isAdmin && (
            <Col xs={24} lg={12}>
              <Card
                title={`Revenue by Service (${range[0].format('DD MMM')} – ${range[1].format('DD MMM')})`}
                extra={<strong>{formatCurrency(totalRevenue)}</strong>}
              >
                {data.revenue.length === 0 ? (
                  <Empty description="No billing activity in this period" />
                ) : (
                  <Table
                    dataSource={data.revenue}
                    rowKey={(r, i) => r.service || i}
                    columns={revenueColumns}
                    pagination={false}
                    size="small"
                  />
                )}
              </Card>
            </Col>
          )}

          <Col xs={24} lg={isAdmin ? 12 : 24}>
            <Card title="Doctor Productivity">
              {data.doctors.length === 0 ? (
                <Empty description="No consultation data in this period" />
              ) : (
                <Table
                  dataSource={data.doctors}
                  rowKey={(r) => r.doctor_id || r.doctor_name}
                  columns={doctorColumns}
                  pagination={{ pageSize: 8, hideOnSinglePage: true }}
                  size="small"
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* ── Department performance — combines OPD/IPD/billing in one row per dept ── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card title="Department Performance">
              {data.departments.length === 0 ? (
                <Empty description="No department activity in this period" />
              ) : (
                <Table
                  dataSource={data.departments}
                  rowKey={(r) => r.id || r.name}
                  columns={departmentColumns}
                  pagination={false}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default AnalyticsDashboard;
