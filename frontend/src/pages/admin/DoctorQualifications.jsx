import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Form, Input, Select, DatePicker, InputNumber,
  message, Tag, Spin, Popconfirm
} from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { doctorQualificationService, doctorService } from '@/services';
import { useAuthStore } from '@/store';
import dayjs from 'dayjs';

const DoctorQualifications = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qualifications, setQualifications] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterDoctor, setFilterDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchQualifications();
  }, [filterDoctor]);

  const fetchDoctors = async () => {
    try {
      const response = await doctorService.getAll();
      if (response.success) setDoctors(response.data || []);
    } catch {
      message.error('Failed to load doctors');
    }
  };

  const fetchQualifications = async () => {
    setLoading(true);
    try {
      const params = filterDoctor ? { doctor_id: filterDoctor } : {};
      const response = await doctorQualificationService.getAll(params);
      if (response.success) setQualifications(response.data || []);
    } catch {
      message.error('Failed to load qualifications');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ doctor_id: filterDoctor || undefined });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      valid_till: record.valid_till ? dayjs(record.valid_till) : null
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await doctorQualificationService.delete(id);
      if (response.success) {
        message.success('Qualification removed');
        fetchQualifications();
      }
    } catch {
      message.error('Failed to remove qualification');
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
        valid_till: values.valid_till ? values.valid_till.format('YYYY-MM-DD') : null
      };
      const response = editing
        ? await doctorQualificationService.update(editing.qualification_id, payload)
        : await doctorQualificationService.create(payload);
      if (response.success) {
        message.success(editing ? 'Qualification updated' : 'Qualification added');
        setModalOpen(false);
        fetchQualifications();
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to save qualification');
    } finally {
      setSubmitting(false);
    }
  };

  const doctorName = (id) => doctors.find(d => d.id === id)?.name || `#${id}`;

  const columns = [
    {
      title: 'Doctor',
      dataIndex: 'doctor_id',
      render: (id) => doctorName(id)
    },
    { title: 'Degree', dataIndex: 'degree', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Institution', dataIndex: 'institution' },
    { title: 'Year', dataIndex: 'year_obtained', align: 'center' },
    { title: 'Council', dataIndex: 'registration_council' },
    { title: 'Reg No.', dataIndex: 'registration_number' },
    {
      title: 'Valid Till',
      dataIndex: 'valid_till',
      render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '-'
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
            title="Remove this qualification?"
            onConfirm={() => handleDelete(record.qualification_id)}
            okText="Remove"
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
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1e293b' }}>Doctor Qualifications</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
          Manage degrees, councils, registration numbers, and certificate validity
        </p>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 280 }}
            placeholder="Filter by doctor"
            allowClear
            showSearch
            optionFilterProp="label"
            value={filterDoctor}
            onChange={setFilterDoctor}
            options={doctors.map(d => ({ label: `${d.name} (${d.specialization})`, value: d.id }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Qualification
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={qualifications}
            rowKey="qualification_id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      <SliderModal
        title={editing ? 'Edit Qualification' : 'Add Qualification'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="doctor_id"
            label="Doctor"
            rules={[{ required: true, message: 'Please select a doctor' }]}
          >
            <Select
              showSearch
              placeholder="Select doctor"
              optionFilterProp="label"
              disabled={!!editing}
              options={doctors.map(d => ({ label: `${d.name} (${d.specialization})`, value: d.id }))}
            />
          </Form.Item>
          <Form.Item
            name="degree"
            label="Degree / Qualification"
            rules={[{ required: true, message: 'Please enter the degree' }]}
          >
            <Input placeholder="MBBS, MD, MS, DM, DNB etc." />
          </Form.Item>
          <Form.Item name="institution" label="Institution">
            <Input placeholder="University / College" />
          </Form.Item>
          <Form.Item name="year_obtained" label="Year Obtained">
            <InputNumber
              min={1950}
              max={dayjs().year()}
              style={{ width: '100%' }}
              placeholder="YYYY"
            />
          </Form.Item>
          <Form.Item name="registration_council" label="Registration Council">
            <Input placeholder="MCI / State Medical Council" />
          </Form.Item>
          <Form.Item name="registration_number" label="Registration Number">
            <Input placeholder="Registration / license number" />
          </Form.Item>
          <Form.Item name="valid_till" label="Valid Till">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default DoctorQualifications;
