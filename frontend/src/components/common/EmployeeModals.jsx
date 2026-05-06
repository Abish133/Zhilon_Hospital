import { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Row, Col, message } from 'antd';
import SliderModal from './SliderModal';
import { employeeService, departmentService, userService } from '@/services';
import AuthService from '@/services/AuthService';
import dayjs from 'dayjs';

export const EmployeeFormModal = ({ open, onCancel, onSuccess, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Get hospital_id from logged in user
  const currentUser = AuthService.getCurrentUser();
  const hospitalId = currentUser?.hospital_id;

  // Fetch departments and users on mount
  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  // Set form values when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        joining_date: initialData.joining_date ? dayjs(initialData.joining_date) : null,
        date_of_birth: initialData.date_of_birth ? dayjs(initialData.date_of_birth) : null
      });
      setSelectedUser(null);
    } else {
      form.resetFields();
      setSelectedUser(null);
    }
  }, [initialData, form]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll();
      if (response.success) {
        // Filter out admin users
        const filteredUsers = (response.data || []).filter(user => user.role !== 'admin');
        setUsers(filteredUsers);
      }
    } catch (error) {
    }
  };

  const handleUserSelect = (userId, option) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      form.setFieldsValue({
        full_name: user.name,
        email: user.email,
        role: user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : undefined,
      });
    }
  };

  // Generate employee code
  const generateEmpCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `EMP${timestamp}`;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Format dates
      const formattedValues = {
        ...values,
        joining_date: values.joining_date?.format('YYYY-MM-DD'),
        date_of_birth: values.date_of_birth?.format('YYYY-MM-DD'),
        hospital_id: hospitalId,
        user_id: selectedUser ? selectedUser.id : undefined
      };

      if (initialData) {
        // Update existing employee
        await employeeService.update(initialData.employee_id, formattedValues);
      } else {
        // Create new employee
        await employeeService.create({
          ...formattedValues,
          emp_code: generateEmpCode()
        });
      }

      form.resetFields();
      setSelectedUser(null);
      onSuccess?.();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error('Failed to save employee: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedUser(null);
    onCancel?.();
  };

  return (
    <SliderModal
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      title={initialData ? "Edit Employee" : "Add Employee"}
      width={700}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Select a user or type name"
                optionFilterProp="label"
                onChange={handleUserSelect}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={users.map(u => ({ label: `${u.name} (${u.email})`, value: u.id }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
              <Select options={[
                { label: 'Male', value: 'M' },
                { label: 'Female', value: 'F' },
                { label: 'Other', value: 'O' }
              ]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date_of_birth" label="Date of Birth">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="mobile" label="Mobile" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input disabled={!!selectedUser} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Select disabled={!!selectedUser} options={[
                { label: 'Doctor', value: 'Doctor' },
                { label: 'Nurse', value: 'Nurse' },
                { label: 'Pharmacist', value: 'Pharmacist' },
                { label: 'Lab Technician', value: 'LabTech' },
                { label: 'Receptionist', value: 'Receptionist' },
                { label: 'Admin', value: 'Admin' }
              ]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="department_id" label="Department" rules={[{ required: true }]}>
              <Select
                options={departments.map(d => ({
                  label: d.department_name,
                  value: d.id
                }))}
                placeholder="Select department"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="joining_date" label="Joining Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="qualification" label="Qualification">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="address" label="Address">
              <Input.TextArea rows={1} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="designation" label="Designation">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="bank_account_number" label="Bank Account No.">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="ifsc_code" label="IFSC Code">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="pan_number" label="PAN Number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="uan_number" label="UAN (EPF)">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="emergency_contact_name" label="Emergency Contact Name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="emergency_contact_number" label="Emergency Contact Number">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </SliderModal>
  );
};

export const DepartmentFormModal = ({ open, onCancel, onSuccess, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Get hospital_id from logged in user
  const currentUser = AuthService.getCurrentUser();
  const hospitalId = currentUser?.hospital_id;

  // Set form values when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        department_name: initialData.department_name,
        description: initialData.description
      });
    } else {
      form.resetFields();
    }
  }, [initialData, form, open]);

  // Generate department code
  const generateDeptCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `DEPT${timestamp}`;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        department_code: initialData?.department_code || generateDeptCode(),
        department_name: values.department_name,
        description: values.description,
        hospital_id: hospitalId
      };

      if (initialData) {
        await departmentService.update(initialData.id, payload);
      } else {
        await departmentService.create(payload);
      }

      form.resetFields();
      onSuccess?.();
    } catch (error) {
      if (error.errorFields) return;
      message.error('Failed to save department: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  return (
    <SliderModal
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      title={initialData ? "Edit Department" : "Add Department"}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="department_name" label="Department Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </SliderModal>
  );
};

