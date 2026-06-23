import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Tabs } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, CalendarOutlined, MedicineBoxOutlined, TeamOutlined } from '@ant-design/icons';
import { opdVisitService, opdAppointmentService, opdConsultationService } from '@/services';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const OPDDashboard = () => {
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [visitsRes, appointmentsRes, consultationsRes] = await Promise.all([
        opdVisitService.getAll(),
        opdAppointmentService.getAll(),
        opdConsultationService.getAll()
      ]);

      if (visitsRes.success) setVisits(visitsRes.data || []);
      if (appointmentsRes.success) setAppointments(appointmentsRes.data || []);
      if (consultationsRes.success) setConsultations(consultationsRes.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getTodayStats = () => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayVisits = visits.filter(v => v.visit_date === today);
    const todayAppointments = appointments.filter(a => a.appointment_date === today);
    const todayConsultations = consultations.filter(c => dayjs(c.consultation_date).format('YYYY-MM-DD') === today);

    return {
      totalVisits: todayVisits.length,
      checkedIn: todayVisits.filter(v => v.status === 'Checked-in').length,
      inConsultation: todayVisits.filter(v => v.status === 'In-consultation').length,
      completed: todayVisits.filter(v => v.status === 'Completed').length,
      totalAppointments: todayAppointments.length,
      totalConsultations: todayConsultations.length
    };
  };

  const visitColumns = [
    {
      title: 'Token',
      dataIndex: 'token_number',
      key: 'token',
      render: (token) => <Tag color="blue" style={{ fontSize: 14 }}>#{token}</Tag>
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div>{record.patient?.first_name} {record.patient?.last_name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>UHID: {record.uhid}</div>
        </div>
      )
    },
    {
      title: 'Visit Type',
      dataIndex: 'visit_type',
      key: 'visit_type',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'Checked-in': 'processing',
          'In-consultation': 'warning',
          'Completed': 'success'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'Checked-in' && (
            <Button size="small" type="primary" onClick={() => navigate(`/opd/consultation/${record.visit_id}`)}>
              Consult
            </Button>
          )}
        </Space>
      )
    }
  ];

  const appointmentColumns = [
    {
      title: 'ID',
      dataIndex: 'appointment_id',
      key: 'id',
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => `${record.patient?.first_name} ${record.patient?.last_name}`
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_, record) => record.doctor?.name
    },
    {
      title: 'Time',
      dataIndex: 'appointment_time',
      key: 'time',
      render: (time) => dayjs(time, 'HH:mm:ss').format('hh:mm A')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'Booked' ? 'blue' : 'green'}>{status}</Tag>
    }
  ];

  const stats = getTodayStats();
  const today = dayjs().format('YYYY-MM-DD');
  const todayVisits = visits.filter(v => v.visit_date === today);
  const todayAppointments = appointments.filter(a => a.appointment_date === today);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's Visits"
              value={stats.totalVisits}
              prefix={<UserOutlined />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Checked In"
              value={stats.checkedIn}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Consultation"
              value={stats.inConsultation}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<MedicineBoxOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            {
              key: 'visits',
              label: `Today's Visits (${todayVisits.length})`,
              children: (
                <Table
                  columns={visitColumns}
                  dataSource={todayVisits}
                  rowKey="visit_id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            },
            {
              key: 'appointments',
              label: `Today's Appointments (${todayAppointments.length})`,
              children: (
                <Table
                  columns={appointmentColumns}
                  dataSource={todayAppointments}
                  rowKey="appointment_id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            }
          ]}
          tabBarExtraContent={
            <Space>
              <Button
                icon={<TeamOutlined />}
                onClick={() => navigate('/opd/board')}
              >
                Today's Board
              </Button>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/appointments/book')}
              >
                Book Appointment
              </Button>
            </Space>
          }
        />
      </Card>
    </div>
  );
};

export default OPDDashboard;
