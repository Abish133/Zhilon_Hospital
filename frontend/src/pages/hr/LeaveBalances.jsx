import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Select, InputNumber, Form, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import SliderModal from '@components/common/SliderModal';
import apiClient from '@services/apiClient';
import { employeeService } from '@services';
import dayjs from 'dayjs';

const unwrap = (res) => (res && res.data && res.data.success !== undefined) ? res.data : res;

const LeaveBalances = () => {
  const [year, setYear] = useState(dayjs().year());
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const body = unwrap(await apiClient.get('/leave-balances', { params: { year } }));
      setRows(body?.data || []);
    } catch (e) { message.error('Failed to load leave balances'); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try { setEmployees((await employeeService.getAll())?.data || []); } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchBalances(); }, [year]);
  useEffect(() => { fetchEmployees(); }, []);

  const openAllocate = () => {
    form.resetFields();
    form.setFieldsValue({ year, casual_allocated: 12, medical_allocated: 12, earned_allocated: 15 });
    setModalOpen(true);
  };

  const handleAllocate = async (values) => {
    try {
      const body = unwrap(await apiClient.post('/leave-balances', values));
      if (body?.success) { message.success('Leave balance saved'); setModalOpen(false); fetchBalances(); }
      else message.error(body?.message || 'Failed to save');
    } catch (e) { message.error(e?.response?.data?.message || 'Failed to save'); }
  };

  const bar = (used, allocated) => {
    const bal = Number(allocated) - Number(used);
    const color = bal <= 0 ? 'red' : bal <= 2 ? 'orange' : 'green';
    return <Tag color={color}>{bal} left <span style={{ opacity: 0.6 }}>({used}/{allocated})</span></Tag>;
  };

  const columns = [
    { title: 'Employee', key: 'emp', render: (_, r) => (
      <div><div style={{ fontWeight: 600 }}>{r.employee?.full_name || `#${r.employee_id}`}</div>
      <div style={{ fontSize: 12, color: '#888' }}>{r.employee?.emp_code} · {r.employee?.role}</div></div>) },
    { title: 'Year', dataIndex: 'year', key: 'year', width: 90 },
    { title: 'Casual', key: 'casual', render: (_, r) => bar(r.casual_used, r.casual_allocated) },
    { title: 'Medical', key: 'medical', render: (_, r) => bar(r.medical_used, r.medical_allocated) },
    { title: 'Earned', key: 'earned', render: (_, r) => bar(r.earned_used, r.earned_allocated) }
  ];

  return (
    <div>
      <Card
        title="Leave Balances"
        extra={
          <Space>
            <Select value={year} onChange={setYear} style={{ width: 110 }}
              options={[0, 1, 2].map(d => { const y = dayjs().year() - d; return { value: y, label: y }; })} />
            <Button icon={<ReloadOutlined />} onClick={fetchBalances} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openAllocate}>Allocate / Update</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rows}
          rowKey="balance_id"
          loading={loading}
          locale={{ emptyText: 'No leave balances allocated for this year yet — use “Allocate / Update”.' }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <SliderModal title="Allocate Leave Balance" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Save" width={520}>
        <Form form={form} layout="vertical" onFinish={handleAllocate}>
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true, message: 'Select an employee' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Select employee"
              options={employees.map(e => ({ label: `${e.full_name} (${e.emp_code})`, value: e.employee_id }))} />
          </Form.Item>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}>
            <InputNumber min={2020} max={2100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="casual_allocated" label="Casual Leave (days/year)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="medical_allocated" label="Medical Leave (days/year)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="earned_allocated" label="Earned Leave (days/year)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default LeaveBalances;
