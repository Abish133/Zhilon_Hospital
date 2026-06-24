import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, DatePicker, Select, Input,
  InputNumber, Tag, Tooltip, App, Row, Col, Divider, Typography
} from 'antd';
import SliderModal from '@components/common/SliderModal';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, CalculatorOutlined
} from '@ant-design/icons';
import { salaryStructureService, employeeService } from '@/services';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SalaryStructure = () => {
  const { message, modal } = App.useApp();
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  // Watch form values for live net-salary preview
  const watchedBasic = Form.useWatch('basic_salary', form);
  const watchedHra = Form.useWatch('hra', form);
  const watchedMedical = Form.useWatch('medical_allowance', form);
  const watchedTransport = Form.useWatch('transport_allowance', form);
  const watchedOtherAllow = Form.useWatch('other_allowances', form);
  const watchedBonus = Form.useWatch('bonus', form);
  const watchedPfPct = Form.useWatch('pf_percentage', form);
  const watchedPt = Form.useWatch('pt_amount', form);
  const watchedEsiPct = Form.useWatch('esi_percentage', form);
  const watchedLwf = Form.useWatch('lwf_amount', form);
  const watchedTdsPct = Form.useWatch('tds_percentage', form);
  const watchedOtherDed = Form.useWatch('other_deductions', form);

  useEffect(() => {
    fetchStructures();
    fetchEmployees();
  }, []);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const response = await salaryStructureService.getAll();
      setStructures(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch salary structures');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      setEmployees(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch employees');
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      basic_salary: 0,
      hra: 0,
      medical_allowance: 0,
      transport_allowance: 0,
      other_allowances: 0,
      bonus: 0,
      gratuity: 0,
      pf_percentage: 12,
      pt_amount: 200,
      esi_percentage: 0,
      lwf_amount: 0,
      tds_percentage: 0,
      other_deductions: 0,
      effective_from: dayjs()
    });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      employee_id: record.employee_id,
      basic_salary: parseFloat(record.basic_salary) || 0,
      hra: parseFloat(record.hra) || 0,
      medical_allowance: parseFloat(record.medical_allowance) || 0,
      transport_allowance: parseFloat(record.transport_allowance) || 0,
      other_allowances: parseFloat(record.other_allowances) || 0,
      bonus: parseFloat(record.bonus) || 0,
      gratuity: parseFloat(record.gratuity) || 0,
      pf_percentage: parseFloat(record.pf_percentage) || 0,
      pt_amount: parseFloat(record.pt_amount) || 0,
      esi_percentage: parseFloat(record.esi_percentage) || 0,
      lwf_amount: parseFloat(record.lwf_amount) || 0,
      tds_percentage: parseFloat(record.tds_percentage) || 0,
      other_deductions: parseFloat(record.other_deductions) || 0,
      effective_from: record.effective_from ? dayjs(record.effective_from) : null,
      effective_to: record.effective_to ? dayjs(record.effective_to) : null
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        effective_from: values.effective_from?.format('YYYY-MM-DD'),
        effective_to: values.effective_to ? values.effective_to.format('YYYY-MM-DD') : null
      };

      if (editing) {
        // Don't send employee_id on update
        delete payload.employee_id;
        await salaryStructureService.update(editing.structure_id, payload);
        message.success('Salary structure updated');
      } else {
        await salaryStructureService.create(payload);
        message.success('Salary structure created');
      }

      setModalOpen(false);
      form.resetFields();
      fetchStructures();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save salary structure');
    }
  };

  const handleDelete = (record) => {
    modal.confirm({
      title: 'Deactivate Salary Structure',
      content: `Deactivate salary structure for ${record.employee?.full_name || 'this employee'}? Payroll generation will skip them until a new structure is created.`,
      okText: 'Deactivate',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await salaryStructureService.delete(record.structure_id);
          message.success('Salary structure deactivated');
          fetchStructures();
        } catch (error) {
          message.error('Failed to deactivate salary structure');
        }
      }
    });
  };

  // Live preview computation â€” mirrors backend PayrollController logic for a
  // full attendance month (no proration).
  const previewGross = (Number(watchedBasic) || 0)
    + (Number(watchedHra) || 0)
    + (Number(watchedMedical) || 0)
    + (Number(watchedTransport) || 0)
    + (Number(watchedOtherAllow) || 0)
    + (Number(watchedBonus) || 0);
  const previewPf = (Number(watchedBasic) || 0) * ((Number(watchedPfPct) || 0) / 100);
  const previewPt = Number(watchedPt) || 0;
  const previewEsi = previewGross * ((Number(watchedEsiPct) || 0) / 100);
  const previewLwf = Number(watchedLwf) || 0;
  const previewTds = (previewGross - previewPf - previewPt - previewEsi) * ((Number(watchedTdsPct) || 0) / 100);
  const previewOther = Number(watchedOtherDed) || 0;
  const previewTotalDed = previewPf + previewPt + previewEsi + previewLwf + previewTds + previewOther;
  const previewNet = previewGross - previewTotalDed;

  const fmt = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.employee?.full_name || `Emp #${r.employee_id}`}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.employee?.emp_code}</Text>
        </div>
      )
    },
    {
      title: 'Basic',
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      align: 'right',
      render: (v) => fmt(v)
    },
    {
      title: 'HRA',
      dataIndex: 'hra',
      key: 'hra',
      align: 'right',
      render: (v) => fmt(v)
    },
    {
      title: 'Allowances',
      key: 'allowances',
      align: 'right',
      render: (_, r) => fmt(
        (Number(r.medical_allowance) || 0)
        + (Number(r.transport_allowance) || 0)
        + (Number(r.other_allowances) || 0)
      )
    },
    {
      title: 'Gross',
      key: 'gross',
      align: 'right',
      render: (_, r) => {
        const gross = (Number(r.basic_salary) || 0)
          + (Number(r.hra) || 0)
          + (Number(r.medical_allowance) || 0)
          + (Number(r.transport_allowance) || 0)
          + (Number(r.other_allowances) || 0);
        return <Text strong>{fmt(gross)}</Text>;
      }
    },
    {
      title: 'PF %',
      dataIndex: 'pf_percentage',
      key: 'pf_percentage',
      align: 'right',
      render: (v) => `${Number(v) || 0}%`
    },
    {
      title: 'PT',
      dataIndex: 'pt_amount',
      key: 'pt_amount',
      align: 'right',
      render: (v) => fmt(v)
    },
    {
      title: 'TDS %',
      dataIndex: 'tds_percentage',
      key: 'tds_percentage',
      align: 'right',
      render: (v) => `${Number(v) || 0}%`
    },
    {
      title: 'Net (estimated)',
      key: 'net',
      align: 'right',
      render: (_, r) => {
        const basic = Number(r.basic_salary) || 0;
        const gross = basic + (Number(r.hra) || 0)
          + (Number(r.medical_allowance) || 0)
          + (Number(r.transport_allowance) || 0)
          + (Number(r.other_allowances) || 0)
          + (Number(r.bonus) || 0);
        const pf = basic * ((Number(r.pf_percentage) || 0) / 100);
        const pt = Number(r.pt_amount) || 0;
        const esi = gross * ((Number(r.esi_percentage) || 0) / 100);
        const lwf = Number(r.lwf_amount) || 0;
        const tds = (gross - pf - pt - esi) * ((Number(r.tds_percentage) || 0) / 100);
        const net = gross - (pf + pt + esi + lwf + tds + (Number(r.other_deductions) || 0));
        return <Text strong style={{ color: '#52c41a' }}>{fmt(net)}</Text>;
      }
    },
    {
      title: 'Effective',
      key: 'effective',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div>From: {r.effective_from ? dayjs(r.effective_from).format('DD-MMM-YYYY') : 'â€”'}</div>
          <div>
            To: {r.effective_to
              ? dayjs(r.effective_to).format('DD-MMM-YYYY')
              : <Tag color="green" style={{ marginLeft: 0 }}>Current</Tag>}
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Tooltip title="Deactivate">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <DollarOutlined /> Salary Structures
          </Title>
          <Text type="secondary">
            Define each employee's CTC components. Payroll generation reads these to compute net salary.
          </Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Structure
          </Button>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={structures}
          loading={loading}
          rowKey="structure_id"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <SliderModal
        title={editing ? 'Edit Salary Structure' : 'New Salary Structure'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editing ? 'Update' : 'Create'}
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Employee"
                name="employee_id"
                rules={[{ required: true, message: 'Select an employee' }]}
              >
                <Select
                  placeholder="Select employee"
                  showSearch
                  optionFilterProp="label"
                  disabled={!!editing}
                  options={employees.map((e) => ({
                    value: e.employee_id,
                    label: `${e.full_name || e.emp_code} (${e.emp_code})`
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Effective From"
                name="effective_from"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Effective To (optional)" name="effective_to">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain style={{ marginTop: 0 }}>Earnings (Monthly)</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Basic Salary"
                name="basic_salary"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} step={1000} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="HRA" name="hra">
                <InputNumber min={0} step={500} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Medical Allowance" name="medical_allowance">
                <InputNumber min={0} step={100} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Transport Allowance" name="transport_allowance">
                <InputNumber min={0} step={100} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Other Allowances" name="other_allowances">
                <InputNumber min={0} step={100} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Bonus" name="bonus" tooltip="Flat earning added to salary (not prorated by attendance).">
                <InputNumber min={0} step={500} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Gratuity (employer)" name="gratuity" tooltip="Monthly employer gratuity provision — shown on the payslip, NOT added to take-home pay.">
                <InputNumber min={0} step={100} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>Deductions</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="PF %" name="pf_percentage" tooltip="Provident Fund â€” typically 12% of basic">
                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Professional Tax" name="pt_amount" tooltip="Flat monthly amount as per state">
                <InputNumber min={0} step={50} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="ESI %" name="esi_percentage" tooltip="Employee State Insurance — employee share, % of gross (≈0.75% if applicable; 0 if not)">
                <InputNumber min={0} max={100} step={0.25} style={{ width: '100%' }} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="LWF" name="lwf_amount" tooltip="Labour Welfare Fund — flat employee deduction.">
                <InputNumber min={0} step={5} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="TDS %" name="tds_percentage" tooltip="Tax Deducted at Source â€” applied on (gross âˆ’ PF âˆ’ PT âˆ’ ESI)">
                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Other Deductions" name="other_deductions">
                <InputNumber min={0} step={100} style={{ width: '100%' }} addonBefore="₹" />
              </Form.Item>
            </Col>
          </Row>

          <Card
            size="small"
            style={{ background: '#fafafa', marginTop: 8 }}
            title={<><CalculatorOutlined /> Net Salary Preview (full attendance)</>}
          >
            <Row gutter={16}>
              <Col span={6}><Text type="secondary">Gross</Text><div><Text strong>{fmt(previewGross)}</Text></div></Col>
              <Col span={6}><Text type="secondary">PF</Text><div>{fmt(previewPf)}</div></Col>
              <Col span={6}><Text type="secondary">PT + TDS + Other</Text><div>{fmt(previewPt + previewTds + previewOther)}</div></Col>
              <Col span={6}>
                <Text type="secondary">Net Take-Home</Text>
                <div><Text strong style={{ color: '#52c41a', fontSize: 16 }}>{fmt(previewNet)}</Text></div>
              </Col>
            </Row>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Actual payroll prorates basic + allowances by attendance days and adds overtime at 2Ã— hourly rate (Factories Act).
            </Text>
          </Card>
        </Form>
      </SliderModal>
    </div>
  );
};

export default SalaryStructure;
