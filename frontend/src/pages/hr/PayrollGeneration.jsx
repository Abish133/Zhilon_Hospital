import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, DatePicker, Select, message, Tag, Input, InputNumber, Descriptions, Statistic, Row, Col } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { DollarOutlined, CheckOutlined, CloseOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import { payrollService, employeeService, salaryStructureService, departmentService } from '@/services';
import dayjs from 'dayjs';

const PayrollGeneration = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [form] = Form.useForm();
  const [approveForm] = Form.useForm();
  const [processForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchPayrolls = async (params = {}) => {
    setLoading(true);
    try {
      const response = await payrollService.getAll({ ...filters, ...params });
      if (response.success) {
        setPayrolls(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch payroll');
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
      message.error('Failed to fetch employees');
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

  const handleGenerate = () => {
    form.resetFields();
    setGenerateModalOpen(true);
  };

  const handleGenerateSubmit = async (values) => {
    try {
      const payload = {
        month: values.month.month() + 1,
        year: values.month.year(),
        department_id: values.department_id
      };

      const response = await payrollService.generate(payload);
      if (response.success) {
        message.success(`Generated ${response.data.generated} payroll records`);
        fetchPayrolls();
      }
      setGenerateModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to generate payroll');
    }
  };

  const handleViewDetails = (record) => {
    setSelectedPayroll(record);
    setDetailModalOpen(true);
  };

  const handleApprove = (record) => {
    setSelectedPayroll(record);
    approveForm.resetFields();
    setApproveModalOpen(true);
  };

  const handleApproveSubmit = async (values) => {
    try {
      const response = await payrollService.approve(selectedPayroll.payroll_id, values.remarks);
      if (response.success) {
        message.success('Payroll approved successfully');
        fetchPayrolls();
      }
      setApproveModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to approve payroll');
    }
  };

  const handleProcess = (record) => {
    setSelectedPayroll(record);
    processForm.resetFields();
    setProcessModalOpen(true);
  };

  const handleProcessSubmit = async (values) => {
    try {
      const response = await payrollService.process(selectedPayroll.payroll_id, {
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        payment_mode: values.payment_mode,
        transaction_reference: values.transaction_reference
      });
      if (response.success) {
        message.success('Payroll processed successfully');
        fetchPayrolls();
      }
      setProcessModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to process payroll');
    }
  };

  const handleAdjust = (record) => {
    setSelectedPayroll(record);
    adjustForm.resetFields();
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (values) => {
    try {
      const response = await payrollService.adjust(selectedPayroll.payroll_id, {
        component: values.component,
        amount: values.amount,
        type: values.type,
        reason: values.reason
      });
      if (response.success) {
        message.success('Payroll adjusted successfully');
        fetchPayrolls();
      }
      setAdjustModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to adjust payroll');
    }
  };

  const handlePayslip = async (record) => {
    try {
      const blob = await payrollService.getPayslip(record.payroll_id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${record.employee?.emp_code || record.payroll_id}-${record.month}-${record.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Payslip downloaded');
    } catch (error) {
      message.error(error?.message || 'Failed to generate payslip');
    }
  };

  const handleCancel = async (record) => {
    Modal.confirm({
      title: 'Cancel Payroll',
      content: 'Are you sure you want to cancel this payroll?',
      onOk: async () => {
        try {
          const response = await payrollService.cancel(record.payroll_id);
          if (response.success) {
            message.success('Payroll cancelled successfully');
            fetchPayrolls();
          }
        } catch (error) {
          message.error('Failed to cancel payroll');
        }
      }
    });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchPayrolls(newFilters);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Generated': 'blue',
      'Approved': 'orange',
      'Paid': 'green',
      'Cancelled': 'red'
    };
    return colors[status] || 'default';
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => record.employee?.full_name || '-'
    },
    {
      title: 'Month/Year',
      key: 'period',
      render: (_, record) => `${getMonthName(record.month)} ${record.year}`
    },
    {
      title: 'Days Worked',
      dataIndex: 'days_worked',
      key: 'days_worked'
    },
    {
      title: 'Gross Salary',
      dataIndex: 'gross_salary',
      key: 'gross_salary',
      render: (val) => `â‚¹${parseFloat(val || 0).toLocaleString('en-IN')}`
    },
    {
      title: 'Deductions',
      dataIndex: 'total_deductions',
      key: 'total_deductions',
      render: (val) => `â‚¹${parseFloat(val || 0).toLocaleString('en-IN')}`
    },
    {
      title: 'Net Salary',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (val) => <strong>â‚¹{parseFloat(val || 0).toLocaleString('en-IN')}</strong>
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
          <Button size="small" onClick={() => handleViewDetails(record)}>View</Button>
          {record.status === 'Generated' && (
            <>
              <Button size="small" type="primary" onClick={() => handleApprove(record)}>
                Approve
              </Button>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleAdjust(record)}>
                Adjust
              </Button>
            </>
          )}
          {record.status === 'Approved' && (
            <Button size="small" type="primary" onClick={() => handleProcess(record)}>
              Process
            </Button>
          )}
          {record.status === 'Paid' && (
            <Button size="small" icon={<FileTextOutlined />} onClick={() => handlePayslip(record)}>
              Payslip
            </Button>
          )}
          {(record.status === 'Generated' || record.status === 'Approved') && (
            <Button size="small" danger onClick={() => handleCancel(record)}>
              Cancel
            </Button>
          )}
        </Space>
      )
    }
  ];

  // Calculate summary statistics
  const totalGross = payrolls.reduce((sum, p) => sum + parseFloat(p.gross_salary || 0), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + parseFloat(p.total_deductions || 0), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);
  const paidCount = payrolls.filter(p => p.status === 'Paid').length;

  return (
    <div>
      <Card
        title="Payroll Management"
        extra={
          <Button type="primary" icon={<DollarOutlined />} onClick={handleGenerate}>
            Generate Payroll
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <DatePicker
            picker="month"
            placeholder="Filter by Month"
            onChange={(date) => {
              if (date) {
                handleFilterChange('month', date.month() + 1);
                handleFilterChange('year', date.year());
              } else {
                handleFilterChange('month', null);
                handleFilterChange('year', null);
              }
            }}
          />
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
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => handleFilterChange('status', value)}
            options={[
              { label: 'Generated', value: 'Generated' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Paid', value: 'Paid' },
              { label: 'Cancelled', value: 'Cancelled' }
            ]}
          />
        </Space>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Gross" value={totalGross} prefix="â‚¹" precision={2} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Deductions" value={totalDeductions} prefix="â‚¹" precision={2} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Net" value={totalNet} prefix="â‚¹" precision={2} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Paid Count" value={paidCount} suffix={`/ ${payrolls.length}`} />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={payrolls}
          rowKey="payroll_id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Generate Modal */}
      <SliderModal
        title="Generate Payroll"
        open={generateModalOpen}
        onCancel={() => setGenerateModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleGenerateSubmit}>
          <Form.Item
            name="month"
            label="Month & Year"
            rules={[{ required: true, message: 'Please select month' }]}
          >
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="department_id" label="Department (Optional)">
            <Select placeholder="All Departments" allowClear>
              {departments.map(dept => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.department_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Detail Modal */}
      <SliderModal
        title="Payroll Details"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedPayroll && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Employee" span={2}>
              {selectedPayroll.employee?.full_name} ({selectedPayroll.employee?.emp_code})
            </Descriptions.Item>
            <Descriptions.Item label="Period">
              {getMonthName(selectedPayroll.month)} {selectedPayroll.year}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedPayroll.status)}>{selectedPayroll.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Days Worked">{selectedPayroll.days_worked}</Descriptions.Item>
            <Descriptions.Item label="Days Absent">{selectedPayroll.days_absent}</Descriptions.Item>
            <Descriptions.Item label="Overtime Hours">{selectedPayroll.overtime_hours || 0}</Descriptions.Item>
            <Descriptions.Item label="Basic Salary">
              â‚¹{parseFloat(selectedPayroll.basic_salary || 0).toLocaleString('en-IN')}
            </Descriptions.Item>
            <Descriptions.Item label="Total Allowances">
              â‚¹{parseFloat(selectedPayroll.total_allowances || 0).toLocaleString('en-IN')}
            </Descriptions.Item>
            <Descriptions.Item label="Total Deductions">
              â‚¹{parseFloat(selectedPayroll.total_deductions || 0).toLocaleString('en-IN')}
            </Descriptions.Item>
            <Descriptions.Item label="Gross Salary">
              â‚¹{parseFloat(selectedPayroll.gross_salary || 0).toLocaleString('en-IN')}
            </Descriptions.Item>
            <Descriptions.Item label="Net Salary" span={2}>
              <strong>â‚¹{parseFloat(selectedPayroll.net_salary || 0).toLocaleString('en-IN')}</strong>
            </Descriptions.Item>
            {selectedPayroll.payment_date && (
              <>
                <Descriptions.Item label="Payment Date">{selectedPayroll.payment_date}</Descriptions.Item>
                <Descriptions.Item label="Payment Mode">{selectedPayroll.payment_mode}</Descriptions.Item>
              </>
            )}
            {selectedPayroll.remarks && (
              <Descriptions.Item label="Remarks" span={2}>{selectedPayroll.remarks}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </SliderModal>

      {/* Approve Modal */}
      <SliderModal
        title="Approve Payroll"
        open={approveModalOpen}
        onCancel={() => setApproveModalOpen(false)}
        onOk={() => approveForm.submit()}
      >
        <Form form={approveForm} layout="vertical" onFinish={handleApproveSubmit}>
          <Form.Item name="remarks" label="Remarks (Optional)">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Process Modal */}
      <SliderModal
        title="Process Payment"
        open={processModalOpen}
        onCancel={() => setProcessModalOpen(false)}
        onOk={() => processForm.submit()}
      >
        <Form form={processForm} layout="vertical" onFinish={handleProcessSubmit}>
          <Form.Item
            name="payment_date"
            label="Payment Date"
            rules={[{ required: true, message: 'Please select payment date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="payment_mode"
            label="Payment Mode"
            rules={[{ required: true, message: 'Please select payment mode' }]}
          >
            <Select placeholder="Select payment mode">
              <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
              <Select.Option value="Cash">Cash</Select.Option>
              <Select.Option value="Cheque">Cheque</Select.Option>
              <Select.Option value="NEFT">NEFT</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="transaction_reference" label="Transaction Reference">
            <Input placeholder="Optional" />
          </Form.Item>
        </Form>
      </SliderModal>

      {/* Adjust Modal */}
      <SliderModal
        title="Adjust Payroll"
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        onOk={() => adjustForm.submit()}
      >
        <Form form={adjustForm} layout="vertical" onFinish={handleAdjustSubmit}>
          <Form.Item
            name="component"
            label="Component Name"
            rules={[{ required: true, message: 'Please enter component name' }]}
          >
            <Input placeholder="e.g., Bonus, Penalty" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select placeholder="Select type">
              <Select.Option value="allowance">Allowance</Select.Option>
              <Select.Option value="deduction">Deduction</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber style={{ width: '100%' }} prefix="â‚¹" min={0} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Input.TextArea rows={3} placeholder="Reason for adjustment" />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default PayrollGeneration;

