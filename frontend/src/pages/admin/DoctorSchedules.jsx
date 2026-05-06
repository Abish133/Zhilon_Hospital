import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Form, Select, TimePicker, InputNumber, message, Tag, Spin } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, CalendarOutlined, DeleteOutlined } from '@ant-design/icons';
import { doctorScheduleService, doctorService } from '@/services';
import dayjs from 'dayjs';

const DoctorSchedules = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [form] = Form.useForm();
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchSchedules();
    fetchDoctors();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await doctorScheduleService.getAll();
      if (response.success) {
        setSchedules(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch schedules');
    } finally {
      setLoading(false);
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

  const handleAdd = () => {
    setEditingSchedule(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingSchedule(record);
    form.setFieldsValue({
      doctor_id: record.doctor_id,
      day_of_week: record.day_of_week,
      start_time: dayjs(record.start_time, 'HH:mm:ss'),
      end_time: dayjs(record.end_time, 'HH:mm:ss'),
      slot_duration_minutes: record.slot_duration_minutes,
      max_appointments: record.max_appointments
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await doctorScheduleService.delete(id);
      if (response.success) {
        message.success('Schedule deleted successfully');
        fetchSchedules();
      }
    } catch (error) {
      message.error('Failed to delete schedule');
    }
  };

  const handleSubmit = async (values) => {
    const scheduleData = {
      doctor_id: values.doctor_id,
      day_of_week: values.day_of_week,
      start_time: values.start_time.format('HH:mm:ss'),
      end_time: values.end_time.format('HH:mm:ss'),
      slot_duration_minutes: values.slot_duration_minutes,
      max_appointments: values.max_appointments
    };

    try {
      if (editingSchedule) {
        const response = await doctorScheduleService.update(editingSchedule.schedule_id, scheduleData);
        if (response.success) {
          message.success('Schedule updated successfully');
          fetchSchedules();
        }
      } else {
        const response = await doctorScheduleService.create(scheduleData);
        if (response.success) {
          message.success('Schedule created successfully');
          fetchSchedules();
        }
      }
      setModalOpen(false);
    } catch (error) {
      message.error(editingSchedule ? 'Failed to update schedule' : 'Failed to create schedule');
    }
  };

  const columns = [
    { 
      title: 'Doctor', 
      key: 'doctor',
      render: (_, record) => record.doctor?.name || 'N/A'
    },
    { 
      title: 'Specialization', 
      key: 'specialization',
      render: (_, record) => <Tag color="blue">{record.doctor?.specialization || 'N/A'}</Tag>
    },
    { 
      title: 'Day', 
      dataIndex: 'day_of_week', 
      key: 'day',
      render: (day) => <Tag color="green">{day}</Tag>
    },
    { 
      title: 'Time', 
      key: 'time', 
      render: (_, record) => `${record.start_time?.substring(0, 5)} - ${record.end_time?.substring(0, 5)}`
    },
    { 
      title: 'Slot Duration', 
      dataIndex: 'slot_duration_minutes', 
      key: 'slot', 
      render: (val) => `${val} min`
    },
    { 
      title: 'Max Appointments', 
      dataIndex: 'max_appointments', 
      key: 'max'
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.schedule_id)}>Delete</Button>
        </Space>
      )
    }
  ];

  return (
    <Card
      title={<><CalendarOutlined /> Doctor Schedules</>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Schedule</Button>}
    >
      <Spin spinning={loading}>
        <Table columns={columns} dataSource={schedules} rowKey="schedule_id" />
      </Spin>

      <SliderModal
        title={editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="doctor_id" label="Doctor" rules={[{ required: true, message: 'Please select a doctor' }]}>
            <Select
              showSearch
              placeholder="Select doctor"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {doctors.map(d => (
                <Select.Option key={d.id} value={d.id}>
                  {d.name} - {d.specialization}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="day_of_week" label="Day of Week" rules={[{ required: true, message: 'Please select a day' }]}>
            <Select placeholder="Select day">
              {weekDays.map(day => (
                <Select.Option key={day} value={day}>{day}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="start_time" label="Start Time" rules={[{ required: true, message: 'Please select start time' }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_time" label="End Time" rules={[{ required: true, message: 'Please select end time' }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="slot_duration_minutes" label="Slot Duration (minutes)" rules={[{ required: true, message: 'Please select slot duration' }]}>
            <Select placeholder="Select duration">
              <Select.Option value={10}>10 minutes</Select.Option>
              <Select.Option value={15}>15 minutes</Select.Option>
              <Select.Option value={20}>20 minutes</Select.Option>
              <Select.Option value={30}>30 minutes</Select.Option>
              <Select.Option value={45}>45 minutes</Select.Option>
              <Select.Option value={60}>60 minutes</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="max_appointments" label="Max Appointments" rules={[{ required: true, message: 'Please enter max appointments' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter max appointments" />
          </Form.Item>
        </Form>
      </SliderModal>
    </Card>
  );
};

export default DoctorSchedules;
