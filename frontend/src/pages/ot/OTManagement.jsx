import { useAuthStore } from '@store';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Space, Button, Tag, Card, Row, Col, Statistic, message, Modal, Form, Input, Select, DatePicker, TimePicker } from 'antd';
import { EyeOutlined, MedicineBoxOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { ViewDetailsModal } from '@components/common/ActionModals';
import OTService from '../../services/OTService';
import PatientService from '../../services/PatientService';
import DoctorService from '../../services/DoctorService';
import { formatDate } from '@utils/helpers';

const OTManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBookings();
    fetchPatients();
    fetchDoctors();
    fetchRooms();
    fetchAdmissions();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await OTService.getBookings();
      setBookings(response.data || []);
    } catch (error) {
      message.error('Failed to fetch OT bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await PatientService.getAll();
      setPatients(response.data || []);
    } catch (error) {
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await DoctorService.getAll();
      setDoctors(response.data || []);
    } catch (error) {
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await OTService.getRooms();
      setRooms(response.data || []);
    } catch (error) {
    }
  };

  const fetchAdmissions = async () => {
    try {
      const response = await PatientService.getAdmissions();
      setAdmissions(response.data || []);
    } catch (error) {
    }
  };

  const handlePatientChange = (patientId) => {
    const selectedPatient = patients.find(p => p.patient_id === patientId);
    if (selectedPatient) {
      form.setFieldsValue({ uhid: selectedPatient.uhid });
    }
  };

  const columns = [
    { title: 'Booking ID', dataIndex: 'booking_id', key: 'booking_id', render: (id) => <Tag color="purple">#{id}</Tag> },
    { title: 'UHID', dataIndex: 'uhid', key: 'uhid' },
    { title: 'Patient', dataIndex: ['patient', 'first_name'], key: 'patient_name', render: (_, record) => <div style={{ fontWeight: 500 }}>{record.patient?.first_name} {record.patient?.last_name}</div> },
    { title: 'Surgery', dataIndex: 'surgery_name', key: 'surgery_name' },
    { title: 'Surgeon', dataIndex: ['surgeon', 'name'], key: 'surgeon_name' },
    { title: 'Date', dataIndex: 'surgery_date', key: 'surgery_date', render: (date) => formatDate(date) },
    { title: 'OT Room', dataIndex: ['otRoom', 'room_name'], key: 'ot_room', render: (room) => <Tag color="blue">{room}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Completed' ? 'green' : s === 'In Progress' ? 'processing' : 'orange'}>{s}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedBooking(record); setViewModalOpen(true); }}>View</Button>
          {record.status === 'Scheduled' && (
            <>
              <Button size="small" onClick={() => navigate(`/ot/preop`)}>Pre-Op</Button>
              <Button size="small" type="primary" onClick={() => handleStartSurgery(record.booking_id)}>Start</Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const handleBookOT = async (values) => {
    try {
      const bookingData = {
        ...values,
        surgery_date: values.surgery_date?.format('YYYY-MM-DD'),
        surgery_time: values.surgery_time?.format('HH:mm:ss'),
        hospital_id: user?.hospital_id,
        booked_by: 1,
        status: 'Scheduled'
      };
      
      await OTService.createBooking(bookingData);
      message.success('OT booked successfully');
      setBookingModalOpen(false);
      form.resetFields();
      fetchBookings();
    } catch (error) {
      message.error('Failed to book OT');
    }
  };

  const handleStartSurgery = async (bookingId) => {
    try {
      await OTService.updateBooking(bookingId, { 
        status: 'In Progress',
        actual_start_time: new Date()
      });
      message.success('Surgery started');
      fetchBookings();
    } catch (error) {
      message.error('Failed to start surgery');
    }
  };

  const filteredBookings = bookings.filter(booking => 
    booking.surgery_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.patient?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.uhid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    scheduled: bookings.filter(b => b.status === 'Scheduled').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    today: bookings.filter(b => new Date(b.surgery_date).toDateString() === new Date().toDateString()).length
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Bookings" value={stats.total} prefix={<MedicineBoxOutlined />} valueStyle={{ color: '#0a0a0a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Scheduled" value={stats.scheduled} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Completed" value={stats.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10b981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Today" value={stats.today} valueStyle={{ color: '#3b82f6' }} /></Card></Col>
      </Row>

      <Card>
        <SearchBar placeholder="Search by Patient or Surgery" onSearch={setSearchQuery} onAdd={() => setBookingModalOpen(true)} addButtonText="Book OT" />
        <DataTable columns={columns} dataSource={filteredBookings} loading={loading} rowKey="booking_id" />
      </Card>

      <Modal open={bookingModalOpen} onCancel={() => setBookingModalOpen(false)} onOk={() => form.submit()} title="Book Operation Theatre" width={700}>
        <Form form={form} layout="vertical" onFinish={handleBookOT}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patient_id" label="Patient" rules={[{ required: true }]}>
                <Select 
                  showSearch 
                  placeholder="Select patient" 
                  optionFilterProp="children"
                  onChange={handlePatientChange}
                >
                  {patients.map(p => (
                    <Select.Option key={p.patient_id} value={p.patient_id}>
                      {p.uhid} - {p.first_name} {p.last_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="uhid" label="UHID">
                <Input placeholder="Auto-filled" disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="admission_id" label="Admission ID">
                <Select placeholder="Select admission (if IPD)">
                  {admissions.map(a => (
                    <Select.Option key={a.admission_id} value={a.admission_id}>
                      #{a.admission_id} - {a.patient?.first_name} {a.patient?.last_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="surgery_name" label="Surgery Name" rules={[{ required: true }]}>
                <Input placeholder="e.g., Appendectomy" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="surgeon_id" label="Surgeon" rules={[{ required: true }]}>
                <Select placeholder="Select surgeon">
                  {doctors.map(d => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.name} - {d.specialization}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assistant_surgeon_id" label="Assistant Surgeon">
                <Select placeholder="Select assistant surgeon">
                  {doctors.map(d => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.name} - {d.specialization}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="anesthetist_id" label="Anesthetist">
                <Select placeholder="Select anesthetist">
                  {doctors.map(d => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.name} - {d.specialization}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="estimated_duration_minutes" label="Estimated Duration (minutes)">
                <Input type="number" placeholder="e.g., 120" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="surgery_date" label="Surgery Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="surgery_time" label="Surgery Time" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actual_start_time" label="Actual Start Time">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actual_end_time" label="Actual End Time">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ot_room_id" label="OT Room" rules={[{ required: true }]}>
                <Select placeholder="Select OT room">
                  {rooms.map(r => (
                    <Select.Option key={r.room_id} value={r.room_id}>
                      {r.room_name} ({r.room_type})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="surgery_type" label="Surgery Type">
                <Select placeholder="Select type">
                  <Select.Option value="Elective">Elective</Select.Option>
                  <Select.Option value="Emergency">Emergency</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <ViewDetailsModal
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        record={selectedBooking}
        type="OT Booking"
      />
    </div>
  );
};

export default OTManagement;
