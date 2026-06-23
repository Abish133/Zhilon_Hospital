import { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Input, DatePicker, Select, message, Space, Tag, Row, Col, Statistic } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, UserAddOutlined, ClockCircleOutlined, ClearOutlined } from '@ant-design/icons';
import { opdVisitService, patientService, opdAppointmentService, doctorService, departmentService } from '@/services';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store';
import OpdFlowHeader from '@components/opd/OpdFlowHeader';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const VISIT_STATUSES = ['Checked-in', 'In-consultation', 'Completed'];

const defaultFilters = () => ({
  search: '',
  token: '',
  range: [dayjs(), dayjs()],
  status: undefined
});

const OPDVisits = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState(defaultFilters());
  const [form] = Form.useForm();

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const [from, to] = filters.range || [];
      const params = { hospital_id: user?.hospital_id };
      if (from) params.date_from = from.format('YYYY-MM-DD');
      if (to) params.date_to = to.format('YYYY-MM-DD');
      if (filters.search) params.search = filters.search.trim();
      if (filters.token) params.token_number = filters.token;
      if (filters.status) params.status = filters.status;

      const response = await opdVisitService.getAll(params);
      if (response.success) {
        setVisits(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (patch) => setFilters(prev => ({ ...prev, ...patch }));
  const resetFilters = () => setFilters(defaultFilters());

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      if (response.success) {
        setPatients(response.data || []);
      }
    } catch (error) {
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await opdAppointmentService.getAll();
      if (response.success) {
        const bookedAppointments = (response.data || []).filter(apt => apt.status === 'Booked');
        setAppointments(bookedAppointments);
      }
    } catch (error) {
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await doctorService.getAll();
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (error) {
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
    }
  };

  const handleCreateVisit = async (values) => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const todaysVisits = visits.filter(v => v.visit_date === today);
      const nextToken = todaysVisits.length > 0
        ? todaysVisits.reduce((max, v) => Math.max(max, v.token_number || 0), 0) + 1
        : 1;
      const selectedPatient = patients.find(p => p.patient_id === values.patient_id);

      const visitData = {
        patient_id: values.patient_id,
        uhid: selectedPatient?.uhid || null,
        doctor_id: values.doctor_id || null,
        department_id: values.department_id || null,
        appointment_id: values.appointment_id || null,
        visit_date: values.visit_date.format('YYYY-MM-DD'),
        token_number: nextToken,
        visit_type: values.visit_type || 'Walk-in',
        hospital_id: user?.hospital_id
      };

      const response = await opdVisitService.create(visitData);
      if (response.success) {
        message.success(`Visit registered! Token Number: ${nextToken}`);
        setModalVisible(false);
        form.resetFields();
        fetchVisits();
      }
    } catch (error) {
      message.error('Failed to create visit');
    }
  };

  const getTodayStats = () => {
    // `visits` is already scoped to the selected date by the API.
    return {
      total: visits.length,
      waiting: visits.filter(v => v.status === 'Checked-in').length
    };
  };

  const columns = [
    {
      title: 'Token',
      dataIndex: 'token_number',
      key: 'token',
      render: (token) => <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>#{token}</Tag>
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
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.doctor?.name || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.doctor?.specialization || ''}
          </div>
        </div>
      )
    },
    {
      title: 'Visit Date',
      dataIndex: 'visit_date',
      key: 'date',
      render: (date) => dayjs(date).format('DD MMM YYYY')
    },
    {
      title: 'Visit Type',
      dataIndex: 'visit_type',
      key: 'visit_type',
      render: (type) => {
        const colors = { 'New': 'blue', 'Follow-up': 'green', 'Walk-in': 'orange' };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
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
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          {(record.status === 'Checked-in' || record.status === 'In-consultation') && (
            <Button
              size="small"
              type="primary"
              onClick={() => navigate(`/opd/consultation/${record.visit_id}`)}
            >
              {record.status === 'In-consultation' ? 'Continue Consultation' : 'Start Consultation'}
            </Button>
          )}
          {(!record.status || record.status === 'Checked-in') && (
            <Button
              size="small"
              onClick={() => navigate(`/opd/vitals/${record.visit_id}`)}
            >
              Record Vitals
            </Button>
          )}
          {record.status === 'Completed' && record.billing_episode_id && (
            <Button
              size="small"
              type="default"
              onClick={() => navigate(`/billing/generate/${record.billing_episode_id}`)}
            >
              Billing
            </Button>
          )}
        </Space>
      )
    }
  ];

  const stats = getTodayStats();
  const [rangeFrom, rangeTo] = filters.range || [];
  const isSingleDay = rangeFrom && rangeTo && rangeFrom.isSame(rangeTo, 'day');
  const isToday = isSingleDay && rangeFrom.isSame(dayjs(), 'day');
  const visitsLabel = isToday
    ? "Today's Visits"
    : isSingleDay
      ? `Visits on ${rangeFrom.format('DD MMM')}`
      : 'Visits in range';

  return (
    <div>
      <OpdFlowHeader current="visit" />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title={visitsLabel}
              value={stats.total}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Waiting"
              value={stats.waiting}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="OPD Visits"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Register Visit
          </Button>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search patient name / UHID / mobile"
            allowClear
            style={{ width: 260 }}
            defaultValue={filters.search}
            onSearch={(val) => updateFilter({ search: val })}
          />
          <Input
            placeholder="Token #"
            allowClear
            style={{ width: 110 }}
            value={filters.token}
            onChange={(e) => updateFilter({ token: e.target.value.replace(/\D/g, '') })}
          />
          <RangePicker
            value={filters.range}
            onChange={(range) => updateFilter({ range: range || [] })}
            format="DD MMM YYYY"
            allowEmpty={[true, true]}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            value={filters.status}
            onChange={(status) => updateFilter({ status })}
            options={VISIT_STATUSES.map(s => ({ label: s, value: s }))}
          />
          <Button icon={<ClearOutlined />} onClick={resetFilters}>Reset</Button>
        </Space>
        <Table
          columns={columns}
          dataSource={visits}
          rowKey="visit_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <SliderModal
        title="Register OPD Visit"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateVisit}>
          <Form.Item
            name="patient_id"
            label="Patient"
            rules={[{ required: true, message: 'Please select patient' }]}
          >
            <Select
              showSearch
              placeholder="Search patient"
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={patients.map(p => ({
                label: `${p.first_name} ${p.last_name} (UHID: ${p.patient_id})`,
                value: p.patient_id
              }))}
            />
          </Form.Item>

          <Form.Item
            name="appointment_id"
            label="Link to Appointment (Optional)"
          >
            <Select
              placeholder="Select appointment if exists"
              allowClear
              options={appointments.map(apt => ({
                label: `Appointment #${apt.appointment_id} - ${apt.patient?.first_name} ${apt.patient?.last_name}`,
                value: apt.appointment_id
              }))}
            />
          </Form.Item>

          <Form.Item name="doctor_id" label="Doctor" rules={[{ required: true, message: 'Please select a doctor' }]}>
            <Select
              placeholder="Select doctor"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={doctors.map(d => ({
                label: `${d.name} - ${d.specialization}`,
                value: d.id
              }))}
            />
          </Form.Item>

          <Form.Item name="department_id" label="Department (Optional)">
            <Select
              placeholder="Select department"
              allowClear
              options={departments.map(dept => ({
                label: dept.department_name,
                value: dept.id
              }))}
            />
          </Form.Item>

          <Form.Item name="visit_type" label="Visit Type" initialValue="Walk-in">
            <Select
              options={[
                { label: 'Walk-in', value: 'Walk-in' },
                { label: 'New', value: 'New' },
                { label: 'Follow-up', value: 'Follow-up' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="visit_date"
            label="Visit Date"
            initialValue={dayjs()}
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default OPDVisits;
