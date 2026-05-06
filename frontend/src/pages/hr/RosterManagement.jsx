import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Select, DatePicker, message, Tag, Input, Row, Col } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined, CalendarOutlined } from '@ant-design/icons';
import { rosterService, shiftService, employeeService } from '@/services';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const RosterManagement = () => {
  const [rosters, setRosters] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [generateForm] = Form.useForm();
  const [swapForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchRosters();
    fetchShifts();
    fetchEmployees();
  }, []);

  const fetchRosters = async (params = {}) => {
    setLoading(true);
    try {
      const response = await rosterService.getAll({ ...filters, ...params });
      if (response.success) {
        setRosters(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch roster');
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await shiftService.getAll();
      if (response.success) {
        setShifts(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch shifts');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch employees');
    }
  };

  const handleAdd = () => {
    setSelectedRoster(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleBulkAdd = () => {
    bulkForm.resetFields();
    setBulkModalOpen(true);
  };

  const handleGenerate = () => {
    generateForm.resetFields();
    setGenerateModalOpen(true);
  };

  const handleSwap = (record) => {
    setSelectedRoster(record);
    swapForm.resetFields();
    swapForm.setFieldsValue({ roster_id: record.roster_id });
    setSwapModalOpen(true);
  };

  const handleLeave = (record) => {
    setSelectedRoster(record);
    leaveForm.resetFields();
    setLeaveModalOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedRoster(record);
    form.setFieldsValue({
      employee_id: record.employee_id,
      shift_id: record.shift_id,
      roster_date: dayjs(record.roster_date),
      remarks: record.remarks
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Delete Roster Entry',
      content: 'Are you sure you want to delete this roster entry?',
      onOk: async () => {
        try {
          const response = await rosterService.delete(id);
          if (response.success) {
            message.success('Roster entry deleted successfully');
            fetchRosters();
          }
        } catch (error) {
          message.error('Failed to delete roster entry');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        employee_id: values.employee_id,
        shift_id: values.shift_id,
        roster_date: values.roster_date.format('YYYY-MM-DD'),
        remarks: values.remarks
      };

      if (selectedRoster) {
        const response = await rosterService.update(selectedRoster.roster_id, payload);
        if (response.success) {
          message.success('Roster updated successfully');
          fetchRosters();
        }
      } else {
        const response = await rosterService.create(payload);
        if (response.success) {
          message.success('Roster created successfully');
          fetchRosters();
        }
      }
      setModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save roster');
    }
  };

  const handleBulkSubmit = async (values) => {
    try {
      const payload = {
        employee_ids: values.employee_ids,
        shift_id: values.shift_id,
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD')
      };

      const response = await rosterService.bulkCreate(payload);
      if (response.success) {
        message.success(`Created ${response.data.created} roster entries`);
        fetchRosters();
      }
      setBulkModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create roster entries');
    }
  };

  const handleGenerateSubmit = async (values) => {
    try {
      const payload = {
        month: values.month.month() + 1,
        year: values.month.year()
      };

      const response = await rosterService.generateMonthly(payload);
      if (response.success) {
        message.success(`Generated ${response.data.created} roster entries`);
        fetchRosters();
      }
      setGenerateModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to generate roster');
    }
  };

  const handleSwapSubmit = async (values) => {
    try {
      const payload = {
        roster_id: values.roster_id,
        swap_with_employee_id: values.swap_with_employee_id,
        swap_date: values.swap_date.format('YYYY-MM-DD')
      };

      const response = await rosterService.requestSwap(payload);
      if (response.success) {
        message.success('Swap request created');
        fetchRosters();
      }
      setSwapModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to request swap');
    }
  };

  const handleLeaveSubmit = async (values) => {
    try {
      const response = await rosterService.markLeave(selectedRoster.roster_id, {
        leave_type: values.leave_type,
        remarks: values.remarks
      });
      if (response.success) {
        message.success('Roster marked as leave');
        fetchRosters();
      }
      setLeaveModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to mark leave');
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchRosters(newFilters);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'blue',
      'Confirmed': 'green',
      'Swap Requested': 'orange',
      'On Leave': 'red',
      'Cancelled': 'default'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => record.employee?.full_name || '-'
    },
    {
      title: 'Date',
      dataIndex: 'roster_date',
      key: 'roster_date'
    },
    {
      title: 'Shift',
      key: 'shift',
      render: (_, record) => record.shift?.shift_name || '-'
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
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" icon={<SwapOutlined />} onClick={() => handleSwap(record)} />
          <Button size="small" onClick={() => handleLeave(record)}>Leave</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.roster_id)} />
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Roster Management"
        extra={
          <Space>
            <Button icon={<CalendarOutlined />} onClick={handleGenerate}>
              Generate Monthly
            </Button>
            <Button onClick={handleBulkAdd}>Bulk Assign</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Entry
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="Filter by Employee"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => handleFilterChange('employee_id', value)}
            options={employees.map(emp => ({
              label: emp.full_name,
              value: emp.employee_id
            }))}
          />
          <Select
            placeholder="Filter by Shift"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => handleFilterChange('shift_id', value)}
            options={shifts.map(shift => ({
              label: shift.shift_name,
              value: shift.shift_id
            }))}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => handleFilterChange('status', value)}
            options={[
              { label: 'Scheduled', value: 'Scheduled' },
              { label: 'Confirmed', value: 'Confirmed' },
              { label: 'Swap Requested', value: 'Swap Requested' },
              { label: 'On Leave', value: 'On Leave' }
            ]}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                handleFilterChange('start_date', dates[0].format('YYYY-MM-DD'));
                handleFilterChange('end_date', dates[1].format('YYYY-MM-DD'));
              } else {
                handleFilterChange('start_date', null);
                handleFilterChange('end_date', null);
              }
            }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={rosters}
          rowKey="roster_id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <SliderModal
        title={selectedRoster ? 'Edit Roster Entry' : 'Add Roster Entry'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="employee_id"
            label="Employee"
            rules={[{ required: true, message: 'Please select employee' }]}
          >
            <Select placeholder="Select employee">
              {employees.map(emp => (
                <Select.Option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.emp_code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="shift_id"
            label="Shift"
            rules={[{ required: true, message: 'Please select shift' }]}
          >
            <Select placeholder="Select shift">
              {shifts.map(shift => (
                <Select.Option key={shift.shift_id} value={shift.shift_id}>
                  {shift.shift_name} ({shift.start_time} - {shift.end_time})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="roster_date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Bulk Assign Modal */}
      <SliderModal
        title="Bulk Assign Shifts"
        open={bulkModalOpen}
        onCancel={() => setBulkModalOpen(false)}
        onOk={() => bulkForm.submit()}
        width={600}
      >
        <Form form={bulkForm} layout="vertical" onFinish={handleBulkSubmit}>
          <Form.Item
            name="employee_ids"
            label="Employees"
            rules={[{ required: true, message: 'Please select employees' }]}
          >
            <Select mode="multiple" placeholder="Select employees">
              {employees.map(emp => (
                <Select.Option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.emp_code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="shift_id"
            label="Shift"
            rules={[{ required: true, message: 'Please select shift' }]}
          >
            <Select placeholder="Select shift">
              {shifts.map(shift => (
                <Select.Option key={shift.shift_id} value={shift.shift_id}>
                  {shift.shift_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="date_range"
            label="Date Range"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Generate Monthly Modal */}
      <SliderModal
        title="Generate Monthly Roster"
        open={generateModalOpen}
        onCancel={() => setGenerateModalOpen(false)}
        onOk={() => generateForm.submit()}
      >
        <Form form={generateForm} layout="vertical" onFinish={handleGenerateSubmit}>
          <Form.Item
            name="month"
            label="Month & Year"
            rules={[{ required: true, message: 'Please select month' }]}
          >
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Swap Modal */}
      <SliderModal
        title="Request Shift Swap"
        open={swapModalOpen}
        onCancel={() => setSwapModalOpen(false)}
        onOk={() => swapForm.submit()}
      >
        <Form form={swapForm} layout="vertical" onFinish={handleSwapSubmit}>
          <Form.Item name="roster_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="swap_with_employee_id"
            label="Swap With Employee"
            rules={[{ required: true, message: 'Please select employee' }]}
          >
            <Select placeholder="Select employee">
              {employees.map(emp => (
                <Select.Option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="swap_date"
            label="Swap Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Leave Modal */}
      <SliderModal
        title="Mark as Leave"
        open={leaveModalOpen}
        onCancel={() => setLeaveModalOpen(false)}
        onOk={() => leaveForm.submit()}
      >
        <Form form={leaveForm} layout="vertical" onFinish={handleLeaveSubmit}>
          <Form.Item
            name="leave_type"
            label="Leave Type"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select placeholder="Select leave type">
              <Select.Option value="Sick Leave">Sick Leave</Select.Option>
              <Select.Option value="Casual Leave">Casual Leave</Select.Option>
              <Select.Option value="Annual Leave">Annual Leave</Select.Option>
              <Select.Option value="Emergency Leave">Emergency Leave</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default RosterManagement;

