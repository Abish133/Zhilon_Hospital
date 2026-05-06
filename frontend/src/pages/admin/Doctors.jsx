import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Avatar, message, Spin, Modal, Form, Input, InputNumber, Select } from 'antd';
import { UserOutlined, PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { doctorService, employeeService } from '@/services';
import SearchBar from '@components/common/SearchBar';
import { useAuthStore } from '@store';

const Doctors = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [doctorEmployees, setDoctorEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { user } = useAuthStore();
  const hospitalId = user?.hospital_id;

  useEffect(() => {
    fetchDoctors();
    fetchDoctorEmployees();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorService.getAll();
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorEmployees = async () => {
    try {
      const response = await employeeService.getDoctorEmployees(hospitalId);
      if (response.success) {
        setDoctorEmployees(response.data || []);
      }
    } catch (error) {
    }
  };

  const filteredDoctors = doctors.filter(doc =>
    !searchQuery ||
    doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    form.resetFields();
    setSelectedDoctor(null);
    setSelectedEmployee(null);
    setModalOpen(true);
  };

  const handleEmployeeSelect = (employeeId, option) => {
    const employee = doctorEmployees.find(e => e.employee_id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      form.setFieldsValue({
        name: employeeId,
        email: employee.email
      });
    }
  };

  const handleEdit = (record) => {
    setSelectedDoctor(record);
    form.setFieldsValue(record);
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await doctorService.delete(id);
      if (response.success) {
        message.success('Doctor deleted successfully');
        fetchDoctors();
      }
    } catch (error) {
      message.error('Failed to delete doctor');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const employee = doctorEmployees.find(e => e.employee_id === values.name);
      const payload = {
        ...values,
        name: employee?.full_name || values.name,
        employee_id: values.name,
        hospital_id: hospitalId
      };

      if (selectedDoctor) {
        const response = await doctorService.update(selectedDoctor.id, payload);
        if (response.success) {
          message.success('Doctor updated successfully');
          fetchDoctors();
          setEditModalOpen(false);
        }
      } else {
        const response = await doctorService.create(payload);
        if (response.success) {
          message.success('Doctor added successfully');
          fetchDoctors();
          setModalOpen(false);
        }
      }
    } catch (error) {
      message.error(selectedDoctor ? 'Failed to update doctor' : 'Failed to add doctor');
    }
  };

  const columns = [
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: '#0a0a0a' }} />
          <div>
            <Button
              type="link"
              style={{ padding: 0, fontWeight: 500, height: 'auto' }}
              onClick={() => navigate(`/admin/doctors/${record.id}`)}
            >
              {record.name}
            </Button>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.registration_number}</div>
          </div>
        </Space>
      )
    },
    { 
      title: 'Specialization', 
      dataIndex: 'specialization', 
      render: (spec) => <Tag color="blue">{spec}</Tag> 
    },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phone', dataIndex: 'phone' },
    { 
      title: 'Experience', 
      dataIndex: 'experience', 
      render: (exp) => exp ? `${exp} years` : '-' 
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
          <Button
            icon={<FileTextOutlined />}
            size="small"
            onClick={() => navigate(`/admin/doctors/${record.id}`)}
            title="View Profile"
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            type="primary"
            onClick={() => handleEdit(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <SearchBar
          placeholder="Search doctors"
          onSearch={setSearchQuery}
          onAdd={handleAdd}
          addButtonText="Add Doctor"
        />
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredDoctors}
            rowKey="id"
          />
        </Spin>
      </Card>

      <Modal
        title={selectedDoctor ? 'Edit Doctor' : 'Add Doctor'}
        open={modalOpen || editModalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditModalOpen(false);
          setSelectedDoctor(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Doctor Name" rules={[{ required: true, message: 'Please select doctor name' }]}>
            <Select
              showSearch
              placeholder="Select doctor"
              optionFilterProp="label"
              onChange={handleEmployeeSelect}
              options={doctorEmployees.map(e => ({
                label: e.full_name,
                value: e.employee_id
              }))}
            />
          </Form.Item>
          <Form.Item name="specialization" label="Specialization" rules={[{ required: true, message: 'Please enter specialization' }]}>
            <Input placeholder="Cardiologist" />
          </Form.Item>
          <Form.Item name="registration_number" label="Registration Number" rules={[{ required: true, message: 'Please enter registration number' }]}>
            <Input placeholder="MED12345" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}>
            <Input placeholder="doctor@hospital.com" disabled={!!selectedEmployee} />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="555-0101" />
          </Form.Item>
          <Form.Item name="experience" label="Experience (years)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="10" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Doctors;
