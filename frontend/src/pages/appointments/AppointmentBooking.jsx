import { useState, useEffect } from 'react';
import { Card, Form, Select, DatePicker, TimePicker, Button, message, Row, Col, Divider, Tag, Space } from 'antd';
import { CalendarOutlined, UserOutlined, MedicineBoxOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { opdAppointmentService, patientService, doctorService, departmentService, doctorScheduleService, opdVisitService } from '@/services';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const AppointmentBooking = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      if (response.success) {
        setPatients(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch patients');
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await doctorService.getAll();
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch doctors');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch departments');
    }
  };

  const handleDoctorChange = async (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor);
    
    // Auto-select department based on doctor's specialization
    const dept = departments.find(d => 
      d.department_name.toLowerCase().includes(doctor?.specialization?.toLowerCase())
    );
    if (dept) {
      form.setFieldsValue({ department_id: dept.id });
    }

    // Fetch doctor schedules
    if (selectedDate) {
      await fetchAvailableSlots(doctorId, selectedDate);
    }
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    const doctorId = form.getFieldValue('doctor_id');
    if (doctorId && date) {
      await fetchAvailableSlots(doctorId, date);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const dayName = date.format('dddd');
      const response = await doctorScheduleService.getAll();
      
      if (response.success) {
        const doctorSchedule = response.data.find(
          s => s.doctor_id === doctorId && s.day_of_week === dayName && s.is_active
        );

        if (doctorSchedule) {
          const slots = generateTimeSlots(
            doctorSchedule.start_time,
            doctorSchedule.end_time,
            doctorSchedule.slot_duration_minutes
          );
          setAvailableSlots(slots);
        } else {
          setAvailableSlots([]);
          message.warning(`Doctor not available on ${dayName}`);
        }
      }
    } catch (error) {
      message.error('Failed to fetch available slots');
    }
  };

  const generateTimeSlots = (startTime, endTime, duration) => {
    const slots = [];
    let current = dayjs(startTime, 'HH:mm:ss');
    const end = dayjs(endTime, 'HH:mm:ss');

    while (current.isBefore(end)) {
      slots.push(current.format('HH:mm:ss'));
      current = current.add(duration, 'minute');
    }

    return slots;
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const appointmentData = {
        patient_id: values.patient_id,
        doctor_id: values.doctor_id,
        department_id: values.department_id,
        appointment_date: values.appointment_date.format('YYYY-MM-DD'),
        appointment_time: values.appointment_time,
        visit_type: values.visit_type,
        status: 'Booked',
        hospital_id: user?.hospital_id
      };

      const response = await opdAppointmentService.create(appointmentData);
      
      if (response.success) {
        // Auto-create visit
        const patient = patients.find(p => p.patient_id === values.patient_id);
        const visitsResponse = await opdVisitService.getAll();
        const visits = visitsResponse.success ? visitsResponse.data : [];
        const nextToken = visits.length > 0 ? Math.max(...visits.map(v => v.token_number)) + 1 : 1;
        
        const visitData = {
          patient_id: values.patient_id,
          uhid: patient?.uhid || null,
          doctor_id: values.doctor_id,
          department_id: values.department_id,
          appointment_id: response.data.appointment_id,
          visit_date: values.appointment_date.format('YYYY-MM-DD'),
          token_number: nextToken,
          visit_type: values.visit_type,
          hospital_id: user?.hospital_id
        };

        await opdVisitService.create(visitData);
        
        message.success(`Appointment booked! Visit created with Token #${nextToken}`);
        form.resetFields();
        setSelectedDoctor(null);
        setAvailableSlots([]);
        setSelectedDate(null);
      }
    } catch (error) {
      message.error('Failed to book appointment: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span>Book OPD Appointment</span>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ visit_type: 'New' }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="patient_id"
              label="Select Patient"
              rules={[{ required: true, message: 'Please select a patient' }]}
            >
              <Select
                showSearch
                placeholder="Search and select patient"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                size="large"
                prefix={<UserOutlined />}
              >
                {patients.map(patient => (
                  <Select.Option key={patient.patient_id} value={patient.patient_id}>
                    {patient.first_name} {patient.last_name} - {patient.uhid}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="visit_type"
              label="Visit Type"
              rules={[{ required: true, message: 'Please select visit type' }]}
            >
              <Select size="large">
                <Select.Option value="New">
                  <Tag color="blue">New Visit</Tag>
                </Select.Option>
                <Select.Option value="Follow-up">
                  <Tag color="green">Follow-up</Tag>
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="doctor_id"
              label="Select Doctor"
              rules={[{ required: true, message: 'Please select a doctor' }]}
            >
              <Select
                showSearch
                placeholder="Search and select doctor"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleDoctorChange}
                size="large"
              >
                {doctors.map(doctor => (
                  <Select.Option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="department_id"
              label="Department"
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select size="large" placeholder="Select department">
                {departments.map(dept => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {selectedDoctor && (
          <Card 
            size="small" 
            style={{ marginBottom: 16, background: '#f0f5ff', border: '1px solid #adc6ff' }}
          >
            <Space>
              <MedicineBoxOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{selectedDoctor.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {selectedDoctor.specialization} • {selectedDoctor.experience} years experience
                </div>
              </div>
            </Space>
          </Card>
        )}

        <Divider />

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="appointment_date"
              label="Appointment Date"
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                onChange={handleDateChange}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="appointment_time"
              label="Appointment Time"
              rules={[{ required: true, message: 'Please select time' }]}
            >
              {availableSlots.length > 0 ? (
                <Select size="large" placeholder="Select available time slot">
                  {availableSlots.map(slot => (
                    <Select.Option key={slot} value={slot}>
                      <ClockCircleOutlined /> {dayjs(slot, 'HH:mm:ss').format('hh:mm A')}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <Select size="large" placeholder="Select doctor and date first" disabled />
              )}
            </Form.Item>
          </Col>
        </Row>

        {availableSlots.length > 0 && (
          <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Space>
              <ClockCircleOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', fontWeight: 500 }}>
                {availableSlots.length} slots available
              </span>
            </Space>
          </Card>
        )}

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            loading={loading}
            block
            icon={<CalendarOutlined />}
          >
            Book Appointment
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AppointmentBooking;
