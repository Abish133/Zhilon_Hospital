import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Form, Input, Select, message, Tag, Switch, Spin } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { userService, employeeService, doctorService } from '@/services';
import AuthService from '@/services/AuthService';

const UserManagement = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetForm] = Form.useForm();

  // Get hospital_id from logged in user
  const currentUser = AuthService.getCurrentUser();
  const hospitalId = currentUser?.hospital_id;

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
    fetchEmployees();
    fetchDoctors();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch users: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      if (response.success) {
        setEmployees(response.data || []);
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

  const handleAdd = () => {
    setEditingUser(null);
    setSelectedRole(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    setSelectedRole(record.role);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      role: record.role,
      employee_id: record.employee_id,
      doctor_id: record.doctor_id
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (record) => {
    try {
      await userService.update(record.id, { isActive: !record.isActive });
      message.success('User status updated');
      fetchUsers();
    } catch (error) {
      message.error('Failed to update status: ' + (error.message || 'Unknown error'));
    }
  };

  const handleResetPassword = (user) => {
    setResetUser(user);
    resetForm.resetFields();
    setResetOpen(true);
  };

  const handleResetSubmit = async (values) => {
    if (!resetUser) return;
    setResetLoading(true);
    try {
      await userService.update(resetUser.id, { password: values.password });
      message.success(`Password reset for ${resetUser.name}`);
      setResetOpen(false);
      setResetUser(null);
    } catch (error) {
      message.error('Failed to reset password: ' + (error.message || 'Unknown error'));
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await userService.update(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        // Create new user with hospital_id
        await userService.create({
          ...values,
          hospital_id: hospitalId
        });
        message.success('User created successfully');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      message.error('Failed to save user: ' + (error.message || 'Unknown error'));
    }
  };

  const roleOptions = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Doctor', value: 'Doctor' },
    { label: 'Nurse', value: 'Nurse' },
    { label: 'Pharmacist', value: 'Pharmacist' },
    { label: 'Lab Technician', value: 'LabTech' },
    { label: 'Radiologist', value: 'Radiologist' },
    { label: 'Receptionist', value: 'Receptionist' },
    { label: 'Accountant', value: 'Accountant' },
    { label: 'HR', value: 'HR' },
    { label: 'Employee', value: 'Employee' }
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (val) => <><UserOutlined /> {val}</>
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color="blue">{role}</Tag>
    },
    
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (active, record) => (
        <Switch checked={active} onChange={() => handleToggleStatus(record)} />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Button size="small" icon={<LockOutlined />} onClick={() => handleResetPassword(record)}>Reset Password</Button>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="User Management"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add User</Button>}
    >
      <Spin spinning={loading}>
        <Table columns={columns} dataSource={users} rowKey="id" />
      </Spin>

      <SliderModal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select 
              options={roleOptions} 
              onChange={(value) => setSelectedRole(value)}
            />
          </Form.Item>


          {!editingUser && (
            <>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords that you entered do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </>
          )}
        </Form>
        <style>{`
          .ant-input-password input {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
        `}</style>
      </SliderModal>

      <SliderModal
        title={resetUser ? `Reset Password — ${resetUser.name}` : 'Reset Password'}
        open={resetOpen}
        onCancel={() => { setResetOpen(false); setResetUser(null); }}
        onOk={() => resetForm.submit()}
        okText="Reset Password"
        confirmLoading={resetLoading}
        width={600}
      >
        <Form form={resetForm} layout="vertical" onFinish={handleResetSubmit}>
          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="Confirm New Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm the new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords that you entered do not match!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>
        </Form>
        <style>{`
          .ant-input-password input {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
        `}</style>
      </SliderModal>
    </Card>
  );
};

export default UserManagement;
