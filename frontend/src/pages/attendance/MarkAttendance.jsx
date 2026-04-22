import { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Tag, message, Row, Col, Table, Empty, Alert } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, LogoutOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '@store';
import EmployeeAttendanceService from '@services/EmployeeAttendanceService';
import PageHeader from '@components/common/PageHeader';

const { Title, Text } = Typography;

const ROLE_ADMIN = 'admin';

const MarkAttendance = () => {
  const { user } = useAuthStore();
  const isAdmin = (user?.role || '').toLowerCase() === ROLE_ADMIN;

  const [now, setNow] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [team, setTeam] = useState([]);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadToday = async () => {
    try {
      const res = await EmployeeAttendanceService.getToday();
      if (res?.success) {
        setToday(res.data);
        if (res.message && !res.data) setNotice(res.message);
        else setNotice(null);
      }
    } catch (e) {
      setNotice(e?.message || 'Failed to load attendance');
    }
  };

  const loadTeam = async () => {
    if (!isAdmin) return;
    setTeamLoading(true);
    try {
      const res = await EmployeeAttendanceService.listByDate(dayjs().format('YYYY-MM-DD'));
      if (res?.success) setTeam(res.data || []);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    loadToday();
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doCheckIn = async () => {
    setLoading(true);
    try {
      const res = await EmployeeAttendanceService.checkIn();
      if (res?.success) {
        message.success('Checked in');
        setToday(res.data);
        loadTeam();
      }
    } catch (e) {
      message.error(e?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const doCheckOut = async () => {
    setLoading(true);
    try {
      const res = await EmployeeAttendanceService.checkOut();
      if (res?.success) {
        message.success('Checked out');
        setToday(res.data);
        loadTeam();
      }
    } catch (e) {
      message.error(e?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const checkedIn = !!today?.check_in_time;
  const checkedOut = !!today?.check_out_time;

  const hours = (() => {
    if (!today?.check_in_time) return null;
    const end = today.check_out_time
      ? dayjs(`${today.attendance_date} ${today.check_out_time}`)
      : now;
    const start = dayjs(`${today.attendance_date} ${today.check_in_time}`);
    return end.diff(start, 'minute') / 60;
  })();

  const teamColumns = [
    { title: 'Employee', key: 'name', render: (_, r) => r.employee?.full_name || '—' },
    { title: 'Code', dataIndex: ['employee', 'emp_code'], key: 'code', responsive: ['sm'] },
    { title: 'Role', dataIndex: ['employee', 'role'], key: 'role', responsive: ['md'] },
    { title: 'Check-in', dataIndex: 'check_in_time', key: 'in', render: (v) => v ? <Tag color="success">{v}</Tag> : <Text type="secondary">—</Text> },
    { title: 'Check-out', dataIndex: 'check_out_time', key: 'out', render: (v) => v ? <Tag color="red">{v}</Tag> : <Text type="secondary">—</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> }
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        subTitle="Check in and out for your shift. Admins can review the whole team below."
      />

      {notice && <Alert type="info" showIcon message={notice} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card variant="borderless" style={{ textAlign: 'center' }}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <div style={{
                width: 56, height: 56, margin: '4px auto 10px', borderRadius: 14,
                background: '#0a0a0a', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
              }}>
                <ClockCircleOutlined />
              </div>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{now.format('HH:mm:ss')}</Title>
              <Text className="hms-muted" style={{ fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 6 }} />
                {now.format('dddd, D MMMM YYYY')}
              </Text>

              <div style={{ marginTop: 18, width: '100%' }}>
                {!checkedIn && (
                  <Button
                    type="primary" block size="large"
                    icon={<CheckCircleOutlined />}
                    loading={loading}
                    onClick={doCheckIn}
                    style={{ height: 46, fontWeight: 600 }}
                  >
                    Check in
                  </Button>
                )}
                {checkedIn && !checkedOut && (
                  <Button
                    danger block size="large"
                    icon={<LogoutOutlined />}
                    loading={loading}
                    onClick={doCheckOut}
                    style={{ height: 46, fontWeight: 600 }}
                  >
                    Check out
                  </Button>
                )}
                {checkedOut && (
                  <Tag color="success" style={{ padding: '6px 14px', fontSize: 13 }}>
                    Shift complete
                  </Tag>
                )}
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={<span style={{ fontWeight: 600 }}>Today's summary</span>} variant="borderless">
            <Row gutter={[16, 16]}>
              <Col xs={12}>
                <div className="hms-kpi">
                  <div className="label">Check-in</div>
                  <div className="value" style={{ fontSize: 20 }}>{today?.check_in_time || '—'}</div>
                </div>
              </Col>
              <Col xs={12}>
                <div className="hms-kpi">
                  <div className="label">Check-out</div>
                  <div className="value" style={{ fontSize: 20 }}>{today?.check_out_time || '—'}</div>
                </div>
              </Col>
              <Col xs={12}>
                <div className="hms-kpi">
                  <div className="label">Hours worked</div>
                  <div className="value" style={{ fontSize: 20 }}>{hours !== null ? hours.toFixed(2) : '—'}</div>
                </div>
              </Col>
              <Col xs={12}>
                <div className="hms-kpi">
                  <div className="label">Status</div>
                  <div className="value" style={{ fontSize: 20 }}>
                    {today?.status ? <Tag color={today.status === 'Present' ? 'success' : 'default'} style={{ fontSize: 13 }}>{today.status}</Tag> : '—'}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {isAdmin && (
        <Card
          title={<span style={{ fontWeight: 600 }}>Team attendance · {dayjs().format('D MMM YYYY')}</span>}
          variant="borderless"
          style={{ marginTop: 16 }}
        >
          <Table
            columns={teamColumns}
            dataSource={team}
            loading={teamLoading}
            rowKey="attendance_id"
            size="middle"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No attendance records today" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          />
        </Card>
      )}
    </div>
  );
};

export default MarkAttendance;
