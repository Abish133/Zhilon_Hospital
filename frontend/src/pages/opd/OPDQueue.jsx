import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Row, Col, Statistic, Select, message } from 'antd';
import { ClockCircleOutlined, UserOutlined, CheckCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { opdVisitService, doctorService } from '@/services';
import { useAuthStore } from '@store';
import { useNavigate } from 'react-router-dom';
import OpdFlowHeader from '@components/opd/OpdFlowHeader';
import dayjs from 'dayjs';

const OPDQueue = () => {
  const [visits, setVisits] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [visitsRes, doctorsRes] = await Promise.all([
        opdVisitService.getAll({ visit_date: dayjs().format('YYYY-MM-DD'), hospital_id: user?.hospital_id }),
        doctorService.getAll()
      ]);

      if (visitsRes.success) {
        setVisits(visitsRes.data || []);
      }
      if (doctorsRes.success) setDoctors(doctorsRes.data || []);
    } catch (error) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (visitId, newStatus) => {
    try {
      await opdVisitService.update(visitId, { status: newStatus });
      message.success('Status updated successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const filteredVisits = selectedDoctor
    ? visits.filter(v => v.doctor_id === selectedDoctor)
    : visits;

  const getQueueStats = () => {
    return {
      waiting: filteredVisits.filter(v => v.status === 'Checked-in').length,
      inConsultation: filteredVisits.filter(v => v.status === 'In-consultation').length,
      completed: filteredVisits.filter(v => v.status === 'Completed').length,
      total: filteredVisits.length
    };
  };

  const columns = [
    {
      title: 'Queue #',
      key: 'queue',
      render: (_, record, index) => (
        <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
          {index + 1}
        </Tag>
      )
    },
    {
      title: 'Token',
      dataIndex: 'token_number',
      key: 'token',
      render: (token) => <Tag color="purple">#{token}</Tag>
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.patient?.first_name} {record.patient?.last_name}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            UHID: {record.uhid}
          </div>
        </div>
      )
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_, record) => record.doctor?.name || 'Not Assigned'
    },
    {
      title: 'Check-in Time',
      dataIndex: 'checked_in_at',
      key: 'checkin',
      render: (time) => time ? dayjs(time).format('hh:mm A') : '-'
    },
    {
      title: 'Wait Time',
      key: 'wait',
      render: (_, record) => {
        if (!record.checked_in_at) return '-';
        const minutes = dayjs().diff(dayjs(record.checked_in_at), 'minute');
        return `${minutes} min`;
      }
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
        <Space wrap>
          {record.status === 'Checked-in' && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => handleStatusUpdate(record.visit_id, 'In-consultation')}
              >
                Call Patient
              </Button>
              <Button
                size="small"
                onClick={() => navigate(`/opd/vitals/${record.visit_id}`)}
              >
                Vitals
              </Button>
            </>
          )}
          {(record.status === 'Checked-in' || record.status === 'In-consultation') && (
            <Button
              size="small"
              type={record.status === 'In-consultation' ? 'primary' : 'default'}
              onClick={() => navigate(`/opd/consultation/${record.visit_id}`)}
            >
              {record.status === 'In-consultation' ? 'Continue Consult' : 'Consult'}
            </Button>
          )}
          {record.status === 'In-consultation' && (
            <Button
              size="small"
              onClick={() => handleStatusUpdate(record.visit_id, 'Completed')}
            >
              Mark Completed
            </Button>
          )}
          {record.status === 'Completed' && record.billing_episode_id && (
            <Button
              size="small"
              style={{ borderColor: '#52c41a', color: '#52c41a' }}
              onClick={() => navigate(`/billing/generate/${record.billing_episode_id}`)}
            >
              Billing
            </Button>
          )}
        </Space>
      )
    }
  ];

  const stats = getQueueStats();

  return (
    <div>
      <OpdFlowHeader current="queue" />
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total in Queue"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Waiting"
              value={stats.waiting}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Consultation"
              value={stats.inConsultation}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="OPD Queue Management"
        extra={
          <Select
            placeholder="Filter by Doctor"
            style={{ width: 250 }}
            allowClear
            onChange={setSelectedDoctor}
            options={doctors.map(d => ({
              label: `${d.name} - ${d.specialization}`,
              value: d.id
            }))}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filteredVisits}
          rowKey="visit_id"
          loading={loading}
          pagination={false}
          rowClassName={(record) => {
            if (record.status === 'In-consultation') return 'row-in-consultation';
            if (record.status === 'Completed') return 'row-completed';
            return '';
          }}
        />
      </Card>

      <style>{`
        .row-in-consultation {
          background-color: #fff7e6;
        }
        .row-completed {
          background-color: #f6ffed;
        }
      `}</style>
    </div>
  );
};

export default OPDQueue;
