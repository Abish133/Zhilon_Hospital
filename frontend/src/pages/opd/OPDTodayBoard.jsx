import { useState, useEffect, useMemo } from 'react';
import { Card, Tag, Button, Space, Empty, message, Select, Tooltip, Badge } from 'antd';
import {
  CalendarOutlined, UserAddOutlined, TeamOutlined, CheckCircleOutlined,
  DollarOutlined, ReloadOutlined, ClockCircleOutlined, RightOutlined
} from '@ant-design/icons';
import { opdVisitService, opdAppointmentService, doctorService } from '@/services';
import { useAuthStore } from '@store';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

/**
 * OPD Today Board — a live, today-only view of every patient and the exact
 * step they are at right now. Unlike Appointments / Visits / Queue (which list
 * all-day records in tables), this is a single board: each patient is a card
 * sitting under their current step, and one click moves them to the next step.
 *
 * Step columns:
 *   1. Booked          → appointment booked, patient not yet arrived
 *   2. Checked-in      → arrived, waiting for vitals / to be called
 *   3. In Consultation → with the doctor now
 *   4. Completed       → consultation done (collect billing)
 */

const today = () => dayjs().format('YYYY-MM-DD');

const OPDTodayBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [visitsRes, apptRes, docRes] = await Promise.all([
        opdVisitService.getAll({ visit_date: today(), hospital_id: user?.hospital_id }),
        opdAppointmentService.getAll(),
        doctorService.getAll()
      ]);
      if (visitsRes.success) setVisits(visitsRes.data || []);
      if (apptRes.success) {
        const todaysBooked = (apptRes.data || []).filter(
          a => a.status === 'Booked' && dayjs(a.appointment_date).format('YYYY-MM-DD') === today()
        );
        setAppointments(todaysBooked);
      }
      if (docRes.success) setDoctors(docRes.data || []);
    } catch (error) {
      message.error('Failed to load today\'s board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000); // keep the board fresh
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- actions (move a patient to the next step) ----
  const checkIn = async (appointmentId) => {
    try {
      const res = await opdAppointmentService.checkIn(appointmentId);
      const visitId = res?.data?.visit?.visit_id;
      if (res?.success && visitId) {
        message.success('Patient checked in');
        navigate(`/opd/vitals/${visitId}`);
      }
    } catch (error) {
      const existing = error?.data?.visit_id;
      if (existing) navigate(`/opd/vitals/${existing}`);
      else message.error(error?.message || 'Check-in failed');
    }
  };

  const setVisitStatus = async (visitId, status) => {
    try {
      await opdVisitService.update(visitId, { status });
      message.success('Updated');
      fetchData();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  // ---- group patients into step columns ----
  const byDoctor = (docId) => (row) => !selectedDoctor || docId === selectedDoctor;

  const columns = useMemo(() => {
    const v = (status) => visits.filter(x => x.status === status).filter(x => byDoctor(x.doctor_id)(x));
    const bookedAppts = appointments.filter(a => byDoctor(a.doctor_id)(a));
    return [
      {
        key: 'booked',
        title: 'Booked',
        hint: 'Scheduled, not arrived yet',
        icon: <CalendarOutlined />,
        color: '#1890ff',
        kind: 'appointment',
        items: bookedAppts
      },
      {
        key: 'checkedin',
        title: 'Checked-in',
        hint: 'Arrived · waiting for vitals / call',
        icon: <UserAddOutlined />,
        color: '#722ed1',
        kind: 'visit',
        items: v('Checked-in')
      },
      {
        key: 'consult',
        title: 'In Consultation',
        hint: 'With the doctor now',
        icon: <TeamOutlined />,
        color: '#fa8c16',
        kind: 'visit',
        items: v('In-consultation')
      },
      {
        key: 'completed',
        title: 'Completed',
        hint: 'Done · collect billing',
        icon: <CheckCircleOutlined />,
        color: '#52c41a',
        kind: 'visit',
        items: v('Completed')
      }
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, appointments, selectedDoctor]);

  const renderCard = (col, record) => {
    const patientName = `${record.patient?.first_name || ''} ${record.patient?.last_name || ''}`.trim() || 'Unknown';
    const uhid = record.uhid || record.patient?.patient_id;
    const doctorName = record.doctor?.name || 'Not assigned';

    // step-specific footer line + primary action
    let meta = null;
    let actions = null;

    if (col.kind === 'appointment') {
      meta = (
        <span><ClockCircleOutlined /> {dayjs(record.appointment_time, 'HH:mm:ss').format('hh:mm A')}</span>
      );
      actions = (
        <Button size="small" type="primary" block onClick={() => checkIn(record.appointment_id)}>
          Check-in <RightOutlined />
        </Button>
      );
    } else {
      const waited = record.checked_in_at
        ? `${dayjs().diff(dayjs(record.checked_in_at), 'minute')} min`
        : null;
      meta = (
        <Space size={4}>
          <Tag color="purple" style={{ marginInlineEnd: 0 }}>#{record.token_number}</Tag>
          {waited && <span style={{ color: '#8c8c8c' }}><ClockCircleOutlined /> {waited}</span>}
        </Space>
      );

      if (record.status === 'Checked-in') {
        actions = (
          <Space size={4} style={{ width: '100%' }}>
            <Button size="small" onClick={() => navigate(`/opd/vitals/${record.visit_id}`)} style={{ flex: 1 }}>Vitals</Button>
            <Button size="small" type="primary" onClick={() => setVisitStatus(record.visit_id, 'In-consultation')} style={{ flex: 1 }}>
              Call in <RightOutlined />
            </Button>
          </Space>
        );
      } else if (record.status === 'In-consultation') {
        actions = (
          <Space size={4} style={{ width: '100%' }}>
            <Button size="small" type="primary" onClick={() => navigate(`/opd/consultation/${record.visit_id}`)} style={{ flex: 1 }}>Consult</Button>
            <Button size="small" onClick={() => setVisitStatus(record.visit_id, 'Completed')} style={{ flex: 1 }}>Done</Button>
          </Space>
        );
      } else if (record.status === 'Completed') {
        actions = record.billing_episode_id ? (
          <Button size="small" block icon={<DollarOutlined />}
            style={{ borderColor: '#52c41a', color: '#52c41a' }}
            onClick={() => navigate(`/billing/generate/${record.billing_episode_id}`)}>
            Collect Billing
          </Button>
        ) : null;
      }
    }

    return (
      <div key={record.visit_id || `appt-${record.appointment_id}`} style={{
        background: '#fff', border: '1px solid #f0f0f0', borderLeft: `3px solid ${col.color}`,
        borderRadius: 8, padding: '10px 12px', marginBottom: 10
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#262626' }}>{patientName}</div>
        <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>UHID: {uhid} · {doctorName}</div>
        <div style={{ fontSize: 12, marginBottom: actions ? 8 : 0 }}>{meta}</div>
        {actions}
      </div>
    );
  };

  const totalToday = columns.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div>
      <Card
        size="small"
        style={{ marginBottom: 16, borderRadius: 12 }}
        styles={{ body: { padding: '12px 16px' } }}
        title={
          <Space>
            <TeamOutlined style={{ color: '#0a0a0a' }} />
            <span>OPD Today — Live Patient Flow</span>
            <Tag>{dayjs().format('DD MMM YYYY')}</Tag>
            <Badge count={totalToday} showZero color="#0a0a0a" overflowCount={999} />
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="All doctors"
              style={{ width: 220 }}
              allowClear
              value={selectedDoctor}
              onChange={setSelectedDoctor}
              options={doctors.map(d => ({ label: `${d.name} — ${d.specialization}`, value: d.id }))}
            />
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} />
            </Tooltip>
          </Space>
        }
      >
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
          Each patient sits under the step they are at right now. Use the button on a card to move them forward.
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, alignItems: 'start' }}>
        {columns.map(col => (
          <Card
            key={col.key}
            size="small"
            style={{ borderRadius: 12, borderTop: `3px solid ${col.color}` }}
            styles={{ header: { borderBottom: `1px solid ${col.color}22` }, body: { padding: 12, background: '#fafafa', minHeight: 120 } }}
            title={
              <Space>
                <span style={{ color: col.color }}>{col.icon}</span>
                <span style={{ fontWeight: 700 }}>{col.title}</span>
                <Tag color={col.color} style={{ marginInlineEnd: 0 }}>{col.items.length}</Tag>
              </Space>
            }
          >
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 10 }}>{col.hint}</div>
            {col.items.length > 0
              ? col.items.map(item => renderCard(col, item))
              : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ fontSize: 12 }}>No patients</span>} />
            }
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OPDTodayBoard;
