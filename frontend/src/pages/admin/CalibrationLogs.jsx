import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Form, Input, Select, DatePicker,
  message, Tag, Spin, Popconfirm, Segmented
} from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { calibrationLogService } from '@/services';
import EquipmentService from '@services/EquipmentService';
import { useAuthStore } from '@/store';
import dayjs from 'dayjs';

const RESULTS = ['Pass', 'Fail', 'Conditional'];
const RESULT_COLORS = { Pass: 'green', Fail: 'red', Conditional: 'orange' };

const CalibrationLogs = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [logs, setLogs] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [filterEquipment, setFilterEquipment] = useState(null);
  const [view, setView] = useState('All');
  const [dueDays, setDueDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filterEquipment, view, dueDays]);

  const fetchEquipment = async () => {
    try {
      const response = await EquipmentService.getAll();
      if (response.success) setEquipment(response.data || []);
    } catch {
      message.error('Failed to load equipment');
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let response;
      if (view === 'Due') {
        response = await calibrationLogService.getDue(dueDays);
      } else {
        const params = filterEquipment ? { equipment_id: filterEquipment } : {};
        response = await calibrationLogService.getAll(params);
      }
      if (response.success) setLogs(response.data || []);
    } catch {
      message.error('Failed to load calibration logs');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      equipment_id: filterEquipment || undefined,
      result: 'Pass',
      calibration_date: dayjs()
    });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      calibration_date: record.calibration_date ? dayjs(record.calibration_date) : null,
      next_due_date: record.next_due_date ? dayjs(record.next_due_date) : null
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await calibrationLogService.delete(id);
      if (response.success) {
        message.success('Calibration log removed');
        fetchLogs();
      }
    } catch {
      message.error('Failed to remove calibration log');
    }
  };

  const handleSubmit = async (values) => {
    if (!user?.hospital_id) {
      message.error('Hospital context missing');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        hospital_id: user.hospital_id,
        calibration_date: values.calibration_date ? values.calibration_date.format('YYYY-MM-DD') : null,
        next_due_date: values.next_due_date ? values.next_due_date.format('YYYY-MM-DD') : null
      };
      const response = editing
        ? await calibrationLogService.update(editing.calibration_id, payload)
        : await calibrationLogService.create(payload);
      if (response.success) {
        message.success(editing ? 'Calibration log updated' : 'Calibration log added');
        setModalOpen(false);
        fetchLogs();
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to save calibration log');
    } finally {
      setSubmitting(false);
    }
  };

  const equipmentName = (id) => {
    const e = equipment.find(x => x.equipment_id === id);
    return e ? `${e.equipment_name} (${e.serial_number || e.equipment_code || ''})` : `#${id}`;
  };

  const daysUntilDue = (date) => {
    if (!date) return null;
    return dayjs(date).diff(dayjs().startOf('day'), 'day');
  };

  const columns = [
    {
      title: 'Equipment',
      dataIndex: 'equipment_id',
      render: (id) => equipmentName(id)
    },
    {
      title: 'Calibration Date',
      dataIndex: 'calibration_date',
      render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '-'
    },
    {
      title: 'Next Due',
      dataIndex: 'next_due_date',
      render: (v) => {
        if (!v) return '-';
        const days = daysUntilDue(v);
        const color = days < 0 ? 'red' : days <= 30 ? 'orange' : 'default';
        return <Tag color={color}>{dayjs(v).format('DD MMM YYYY')}</Tag>;
      }
    },
    { title: 'Agency', dataIndex: 'agency' },
    { title: 'Certificate No.', dataIndex: 'certificate_number' },
    {
      title: 'Result',
      dataIndex: 'result',
      render: (v) => <Tag color={RESULT_COLORS[v] || 'default'}>{v}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="primary"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Remove this calibration log?"
            onConfirm={() => handleDelete(record.calibration_id)}
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1e293b' }}>Calibration Logs</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
          Track equipment calibration records, certificates, and due dates
        </p>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Segmented
            value={view}
            onChange={setView}
            options={['All', 'Due']}
          />
          {view === 'All' ? (
            <Select
              style={{ width: 320 }}
              placeholder="Filter by equipment"
              allowClear
              showSearch
              optionFilterProp="label"
              value={filterEquipment}
              onChange={setFilterEquipment}
              options={equipment.map(e => ({
                label: `${e.equipment_name} (${e.serial_number || e.equipment_code || ''})`,
                value: e.equipment_id
              }))}
            />
          ) : (
            <Select
              style={{ width: 200 }}
              value={dueDays}
              onChange={setDueDays}
              options={[
                { label: 'Due in 7 days', value: 7 },
                { label: 'Due in 15 days', value: 15 },
                { label: 'Due in 30 days', value: 30 },
                { label: 'Due in 60 days', value: 60 },
                { label: 'Due in 90 days', value: 90 }
              ]}
            />
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Calibration
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="calibration_id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      <SliderModal
        title={editing ? 'Edit Calibration Log' : 'Add Calibration Log'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="equipment_id"
            label="Equipment"
            rules={[{ required: true, message: 'Please select equipment' }]}
          >
            <Select
              showSearch
              placeholder="Select equipment"
              optionFilterProp="label"
              disabled={!!editing}
              options={equipment.map(e => ({
                label: `${e.equipment_name} (${e.serial_number || e.equipment_code || ''})`,
                value: e.equipment_id
              }))}
            />
          </Form.Item>
          <Form.Item
            name="calibration_date"
            label="Calibration Date"
            rules={[{ required: true, message: 'Please select calibration date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="next_due_date" label="Next Due Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="calibrated_by" label="Calibrated By">
            <Input placeholder="Technician / Engineer name" />
          </Form.Item>
          <Form.Item name="agency" label="Agency">
            <Input placeholder="Calibration agency / vendor" />
          </Form.Item>
          <Form.Item name="certificate_number" label="Certificate Number">
            <Input placeholder="Certificate / report number" />
          </Form.Item>
          <Form.Item name="certificate_path" label="Certificate File Path">
            <Input placeholder="Path / URL to certificate file" />
          </Form.Item>
          <Form.Item
            name="result"
            label="Result"
            rules={[{ required: true, message: 'Please select result' }]}
          >
            <Select options={RESULTS.map(r => ({ label: r, value: r }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Observations, deviations, corrective actions" />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default CalibrationLogs;
