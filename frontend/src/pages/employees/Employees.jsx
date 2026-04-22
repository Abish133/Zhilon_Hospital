import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Avatar, message, Spin, Modal } from 'antd';
import { UserOutlined, PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { employeeService } from '@/services';
import SearchBar from '@components/common/SearchBar';
import { EmployeeFormModal } from '@components/common/EmployeeModals';
import { ViewDetailsModal } from '@components/common/ActionModals';

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getAll();
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch employees: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp =>
    !searchQuery ||
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.emp_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Employee',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete ${record.full_name}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          // Send active=false which the backend EmployeeController handles as soft delete/deactivate
          await employeeService.update(record.employee_id, { is_active: false });
          message.success(`${record.full_name} deactivated successfully`);
          fetchEmployees();
        } catch (error) {
          message.error('Failed to delete employee: ' + (error.message || 'Unknown error'));
        }
      }
    });
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: '#6366f1' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.full_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.emp_code}</div>
          </div>
        </Space>
      )
    },
    { title: 'Role', dataIndex: 'role', render: (role) => <Tag color="blue">{role}</Tag> },
    { title: 'Mobile', dataIndex: 'mobile' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Joining Date', dataIndex: 'joining_date' },
    {
      title: 'Department',
      key: 'department',
      render: (_, record) => record.department?.department_name || '-'
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
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedEmployee(record);
              setViewModalOpen(true);
            }}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            type="primary"
            onClick={() => {
              setSelectedEmployee(record);
              setEditModalOpen(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record)}
          />
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <SearchBar
          placeholder="Search employees"
          onSearch={setSearchQuery}
          onAdd={() => setModalOpen(true)}
          addButtonText="Add Employee"
        />
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredEmployees}
            rowKey="employee_id"
          />
        </Spin>
      </Card>

      <EmployeeFormModal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setSelectedEmployee(null);
          fetchEmployees();
          message.success('Employee added successfully');
        }}
      />

      <EmployeeFormModal
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        initialData={selectedEmployee}
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedEmployee(null);
          fetchEmployees();
          message.success('Employee updated successfully');
        }}
      />

      <ViewDetailsModal
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setSelectedEmployee(null);
        }}
        record={selectedEmployee}
        type="Employee"
      />
    </div>
  );
};

export default Employees;
