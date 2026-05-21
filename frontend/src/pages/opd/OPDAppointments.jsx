import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, message, Spin } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { opdAppointmentService } from '@/services';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const OPDAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await opdAppointmentService.getAll();
      if (response.success) {
        setAppointments(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const response = await opdAppointmentService.updateStatus(appointmentId, newStatus);
      if (response.success) {
        message.success('Status updated successfully');
        fetchAppointments();
      }
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  // Check-in / consult both require a *visit*, not the appointment id. Calling
  // check-in creates the visit (or, if already checked in, the backend returns
  // 409 with the existing visit_id). Either way we navigate to the real visit.
  const goToVisitStage = async (appointmentId, stage) => {
    try {
      const response = await opdAppointmentService.checkIn(appointmentId);
      const visitId = response?.data?.visit?.visit_id;
      if (response?.success && visitId) {
        fetchAppointments();
        navigate(`/opd/${stage}/${visitId}`);
      }
    } catch (error) {
      const existingVisitId = error?.data?.visit_id;
      if (existingVisitId) {
        navigate(`/opd/${stage}/${existingVisitId}`);
      } else {
        message.error(error?.message || 'Failed to open visit');
      }
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const response = await opdAppointmentService.update(appointmentId, { status: 'Cancelled', is_active: false });
      if (response.success) {
        message.success('Appointment cancelled successfully');
        fetchAppointments();
      }
    } catch (error) {
      message.error('Failed to cancel appointment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Booked': 'blue',
      'Checked-in': 'cyan',
      'Consulted': 'purple',
      'Completed': 'green',
      'Cancelled': 'red',
      'No-show': 'orange'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Appointment ID',
      dataIndex: 'appointment_id',
      key: 'id',
      render: (id) => <Tag color="blue">#{id}</Tag>
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
            UHID: {record.patient?.patient_id}
          </div>
        </div>
      )
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.doctor?.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.doctor?.specialization}
          </div>
        </div>
      )
    },
    {
      title: 'Department',
      key: 'department',
      render: (_, record) => (
        <Tag color="purple">{record.department?.department_name}</Tag>
      )
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.appointment_date).format('DD MMM YYYY')}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {dayjs(record.appointment_time, 'HH:mm:ss').format('hh:mm A')}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.appointment_date).unix() - dayjs(b.appointment_date).unix()
    },
    {
      title: 'Visit Type',
      dataIndex: 'visit_type',
      key: 'visit_type',
      render: (type) => (
        <Tag color={type === 'New' ? 'blue' : 'green'}>
          {type}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'Booked' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => goToVisitStage(record.appointment_id, 'vitals')}
            >
              Check-in
            </Button>
          )}
          {record.status === 'Checked-in' && (
            <Button
              size="small"
              type="primary"
              icon={<MedicineBoxOutlined />}
              onClick={() => goToVisitStage(record.appointment_id, 'consultation')}
            >
              Consult
            </Button>
          )}
          {(record.status === 'Booked' || record.status === 'Checked-in') && (
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelAppointment(record.appointment_id)}
            >
              Cancel
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span>OPD Appointments</span>
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          icon={<CalendarOutlined />}
          onClick={() => navigate('/appointments/book')}
        >
          Book New Appointment
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={appointments}
          rowKey="appointment_id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>
    </Card>
  );
};

export default OPDAppointments;
