import { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, DatePicker, Select, Space, Tag, Modal, Form, InputNumber, message, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { employeeAttendanceService, payrollService, employeeService } from '@/services';
import dayjs from 'dayjs';

const AttendancePayroll = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payrollModal, setPayrollModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchPayroll();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await employeeAttendanceService.getAll();
      if (response.success) {
        const formattedData = (response.data || []).map(att => {
          const checkIn = att.check_in_time;
          const checkOut = att.check_out_time;
          let hours = 0;
          if (checkIn && checkOut) {
            const inTime = dayjs(`2000-01-01 ${checkIn}`);
            const outTime = dayjs(`2000-01-01 ${checkOut}`);
            hours = outTime.diff(inTime, 'hour', true);
          }
          return {
            id: att.attendance_id,
            emp_code: att.employee?.emp_code || 'N/A',
            name: att.employee?.full_name || 'Unknown',
            date: att.attendance_date,
            check_in: checkIn || '-',
            check_out: checkOut || '-',
            status: att.status,
            hours: Math.round(hours * 10) / 10
          };
        });
        setAttendanceData(formattedData);
      }
    } catch (error) {
      message.error('Failed to fetch attendance data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const response = await payrollService.getAll();
      if (response.success) {
        const formattedData = (response.data || []).map(pay => ({
          id: pay.payroll_id,
          emp_code: pay.employee?.emp_code || 'N/A',
          name: pay.employee?.full_name || 'Unknown',
          month: `${dayjs().month(pay.month - 1).format('MMMM')} ${pay.year}`,
          basic: pay.basic_salary,
          allowances: pay.total_allowances,
          deductions: pay.total_deductions,
          net: pay.net_salary,
          status: pay.status === 'Paid' ? 'Paid' : 'Pending'
        }));
        setPayrollData(formattedData);
      }
    } catch (error) {
      message.error('Failed to fetch payroll data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = (record) => {
    setSelectedEmployee(record);
    form.setFieldsValue(record);
    setPayrollModal(true);
  };

  const handlePayrollSubmit = (values) => {
    const net = values.basic + values.allowances - values.deductions;
    setPayrollData(payrollData.map(p => 
      p.id === selectedEmployee.id ? { ...p, ...values, net, status: 'Paid' } : p
    ));
    message.success('Payroll processed successfully');
    setPayrollModal(false);
  };

  const attendanceColumns = [
    { title: 'Emp Code', dataIndex: 'emp_code', key: 'code', width: 120 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
    { title: 'Check In', dataIndex: 'check_in', key: 'in', width: 100 },
    { title: 'Check Out', dataIndex: 'check_out', key: 'out', width: 100 },
    { title: 'Hours', dataIndex: 'hours', key: 'hours', width: 80 },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = { Present: 'green', Absent: 'red', 'Half Day': 'orange' };
        const icons = { Present: <CheckCircleOutlined />, Absent: <CloseCircleOutlined /> };
        return <Tag color={colors[status]} icon={icons[status]}>{status}</Tag>;
      }
    }
  ];

  const payrollColumns = [
    { title: 'Emp Code', dataIndex: 'emp_code', key: 'code', width: 120 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Month', dataIndex: 'month', key: 'month', width: 150 },
    { title: 'Basic', dataIndex: 'basic', key: 'basic', width: 100, render: (val) => `₹${val}` },
    { title: 'Allowances', dataIndex: 'allowances', key: 'allow', width: 120, render: (val) => `₹${val}` },
    { title: 'Deductions', dataIndex: 'deductions', key: 'deduct', width: 120, render: (val) => `₹${val}` },
    { title: 'Net Salary', dataIndex: 'net', key: 'net', width: 120, render: (val) => <strong>₹{val}</strong> },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status) => <Tag color={status === 'Paid' ? 'green' : 'orange'}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button 
          size="small" 
          type="primary" 
          icon={<DollarOutlined />}
          onClick={() => handleProcessPayroll(record)}
          disabled={record.status === 'Paid'}
        >
          Process
        </Button>
      )
    }
  ];

  return (
    <Card title="Attendance & Payroll">
      <Tabs
        items={[
          {
            key: '1',
            label: 'Attendance',
            children: (
              <div>
                <Space style={{ marginBottom: 16 }}>
                  <DatePicker.RangePicker />
                  <Select 
                    placeholder="Select Employee" 
                    style={{ width: 200 }} 
                    allowClear
                    options={employees.map(emp => ({ label: emp.full_name, value: emp.employee_id }))}
                  />
                  <Select placeholder="Status" style={{ width: 150 }} allowClear options={[
                    { label: 'Present', value: 'Present' },
                    { label: 'Absent', value: 'Absent' },
                    { label: 'Half Day', value: 'Half Day' }
                  ]} />
                </Space>
                <Spin spinning={loading}>
                  <Table columns={attendanceColumns} dataSource={attendanceData} rowKey="id" />
                </Spin>
              </div>
            )
          },
          {
            key: '2',
            label: 'Payroll',
            children: (
              <div>
                <Space style={{ marginBottom: 16 }}>
                  <DatePicker picker="month" />
                  <Select 
                    placeholder="Select Employee" 
                    style={{ width: 200 }} 
                    allowClear
                    options={employees.map(emp => ({ label: emp.full_name, value: emp.employee_id }))}
                  />
                  <Button type="primary">Generate Payroll</Button>
                </Space>
                <Spin spinning={loading}>
                  <Table columns={payrollColumns} dataSource={payrollData} rowKey="id" />
                </Spin>
              </div>
            )
          }
        ]}
      />

      <Modal
        title="Process Payroll"
        open={payrollModal}
        onCancel={() => setPayrollModal(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handlePayrollSubmit}>
          <Form.Item label="Employee">
            <strong>{selectedEmployee?.name}</strong>
          </Form.Item>
          <Form.Item name="basic" label="Basic Salary" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} prefix="₹" />
          </Form.Item>
          <Form.Item name="allowances" label="Allowances" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} prefix="₹" />
          </Form.Item>
          <Form.Item name="deductions" label="Deductions" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} prefix="₹" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AttendancePayroll;
