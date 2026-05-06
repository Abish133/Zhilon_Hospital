import { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Select, Modal, DatePicker, Checkbox, Input, Tag, App, Row, Col } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ipdAdmissionService } from '@services';
import nursingChecklistService from '@services/NursingChecklistService';
import DataTable from '@components/common/DataTable';
import { useAuthStore } from '@store';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import dayjs from 'dayjs';

const SHIFTS = [
  { label: 'Morning (6 AM - 2 PM)', value: 'Morning' },
  { label: 'Afternoon (2 PM - 10 PM)', value: 'Afternoon' },
  { label: 'Night (10 PM - 6 AM)', value: 'Night' }
];

const NursingChecklist = () => {
  const { user } = useAuthStore();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [template, setTemplate] = useState({});

  const { data: listData, isLoading, refetch } = useApiQuery(
    ['nursing-checklists'],
    () => nursingChecklistService.getAll()
  );

  const { data: admissionsData } = useApiQuery(
    ['ipd-admissions-active'],
    () => ipdAdmissionService.getAll()
  );

  useEffect(() => {
    nursingChecklistService.template()
      .then(res => setTemplate(res?.data?.data || {}))
      .catch(() => setTemplate({}));
  }, []);

  const list = listData?.data?.data || listData?.data || [];
  const admissions = (admissionsData?.data || []).filter(a => a.status === 'Admitted');

  const createMutation = useApiMutation(
    (data) => nursingChecklistService.create(data),
    {
      onSuccess: () => {
        message.success('Checklist saved');
        setModalOpen(false);
        form.resetFields();
        refetch();
      },
      onError: (err) => message.error(err?.response?.data?.message || 'Failed to save checklist')
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }) => nursingChecklistService.update(id, data),
    {
      onSuccess: () => {
        message.success('Checklist updated');
        setModalOpen(false);
        setEditing(null);
        form.resetFields();
        refetch();
      },
      onError: (err) => message.error(err?.response?.data?.message || 'Failed to update checklist')
    }
  );

  const deleteMutation = useApiMutation(
    (id) => nursingChecklistService.delete(id),
    {
      onSuccess: () => { message.success('Deleted'); refetch(); },
      onError: () => message.error('Failed to delete')
    }
  );

  const handleSubmit = (values) => {
    const itemKeys = Object.keys(template);
    const items = {};
    itemKeys.forEach(k => { items[k] = !!values[`item_${k}`]; });

    const payload = {
      admission_id: values.admission_id,
      hospital_id: user?.hospital_id,
      shift: values.shift,
      check_date: values.check_date.format('YYYY-MM-DD'),
      items,
      notes: values.notes
    };

    if (editing) {
      updateMutation.mutate({ id: editing.checklist_id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (record) => {
    setEditing(record);
    const itemFields = {};
    Object.entries(record.items || {}).forEach(([k, v]) => { itemFields[`item_${k}`] = !!v; });
    form.setFieldsValue({
      admission_id: record.admission_id,
      shift: record.shift,
      check_date: dayjs(record.check_date),
      notes: record.notes,
      ...itemFields
    });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    modal.confirm({
      title: 'Delete checklist',
      content: 'Are you sure?',
      onOk: () => deleteMutation.mutate(id)
    });
  };

  const completedCount = (items) => Object.values(items || {}).filter(Boolean).length;
  const totalCount = (items) => Object.keys(items || {}).length;

  const formatItemLabel = (key) => key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const columns = [
    {
      title: 'Admission',
      dataIndex: 'admission_id',
      render: (id) => {
        const a = admissions.find(x => x.admission_id === id);
        return a ? `${a.patient?.first_name || ''} ${a.patient?.last_name || ''} (#${id})` : `#${id}`;
      }
    },
    { title: 'Date', dataIndex: 'check_date', render: (d) => d ? dayjs(d).format('DD-MM-YYYY') : '-' },
    { title: 'Shift', dataIndex: 'shift', render: (s) => <Tag color={s === 'Night' ? 'purple' : s === 'Afternoon' ? 'orange' : 'blue'}>{s}</Tag> },
    { title: 'Nurse', render: (_, r) => r.nurse?.name || '-' },
    {
      title: 'Completion',
      render: (_, r) => {
        const c = completedCount(r.items);
        const t = totalCount(r.items);
        const pct = t > 0 ? Math.round((c / t) * 100) : 0;
        return <Tag color={pct >= 80 ? 'green' : pct >= 50 ? 'orange' : 'red'}>{c}/{t} ({pct}%)</Tag>;
      }
    },
    { title: 'Notes', dataIndex: 'notes', render: (n) => n ? n.slice(0, 40) + (n.length > 40 ? 'â€¦' : '') : '-' },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.checklist_id)} />
        </Space>
      )
    }
  ];

  return (
    <Card
      title="Nursing Checklist"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditing(null);
          form.resetFields();
          form.setFieldsValue({ check_date: dayjs(), shift: 'Morning' });
          setModalOpen(true);
        }}>
          Add Checklist
        </Button>
      }
    >
      <DataTable columns={columns} dataSource={list} rowKey="checklist_id" loading={isLoading} />

      <SliderModal
        title={editing ? 'Edit Nursing Checklist' : 'New Nursing Checklist'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null}
        width={720}
        destroyOnHidden={false}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="admission_id" label="Patient (Admission)" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="Select admission"
                  filterOption={(input, option) =>
                    String(option.label).toLowerCase().includes(input.toLowerCase())
                  }
                  options={admissions.map(a => ({
                    label: `${a.patient?.first_name || ''} ${a.patient?.last_name || ''} - ${a.uhid || a.admission_id}`,
                    value: a.admission_id
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="check_date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shift" label="Shift" rules={[{ required: true }]}>
                <Select options={SHIFTS} />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title="Care Items" style={{ marginBottom: 16 }}>
            <Row gutter={[8, 8]}>
              {Object.keys(template).map(key => (
                <Col span={12} key={key}>
                  <Form.Item name={`item_${key}`} valuePropName="checked" noStyle>
                    <Checkbox>{formatItemLabel(key)}</Checkbox>
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Card>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Shift handover notes, observationsâ€¦" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Save'}
              </Button>
              <Button onClick={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>
    </Card>
  );
};

export default NursingChecklist;
