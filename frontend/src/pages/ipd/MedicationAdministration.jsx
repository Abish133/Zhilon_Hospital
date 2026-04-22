import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, InputNumber, message, Tag, Row, Col
} from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import apiClient from '@/config/api';
import dayjs from 'dayjs';

const STATUS_COLORS = {
  Scheduled: 'blue',
  Administered: 'green',
  Missed: 'red',
  Refused: 'orange',
  Held: 'default'
};

const MedicationAdministration = ({ admissionId }) => {
  const [form] = Form.useForm();
  const [medications, setMedications] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (admissionId) fetchData();
  }, [admissionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medsRes, adminRes] = await Promise.all([
        apiClient.get(`/ipd/medications/admission/${admissionId}`),
        apiClient.get(`/ipd/medications/administration/${admissionId}`)
      ]);
      const meds = (medsRes.data?.data || medsRes.data || []).filter(m => m.status === 'Active');
      const admin = adminRes.data?.data || adminRes.data || [];
      setMedications(meds);
      setRecords(admin);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load medication data');
    } finally {
      setLoading(false);
    }
  };

  const openAdminister = (medication) => {
    setActive(medication);
    form.resetFields();
    form.setFieldsValue({
      dosage_given: medication.dosage,
      quantity: 1
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await apiClient.post('/ipd/medications/administer', {
        medication_id: active.medication_id,
        admission_id: admissionId,
        scheduled_time: new Date(),
        dosage_given: values.dosage_given,
        quantity: values.quantity,
        notes: values.notes
      });
      message.success('Medication administered and charge posted');
      setModalOpen(false);
      fetchData();
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to administer medication');
    } finally {
      setSubmitting(false);
    }
  };

  const activeColumns = [
    { title: 'Medicine', dataIndex: 'medicine_name' },
    { title: 'Dosage', dataIndex: 'dosage' },
    { title: 'Frequency', dataIndex: 'frequency' },
    { title: 'Route', dataIndex: 'route', render: (v) => <Tag>{v}</Tag> },
    {
      title: 'Start',
      dataIndex: 'start_date',
      render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '-'
    },
    { title: 'Instructions', dataIndex: 'instructions', ellipsis: true },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          icon={<MedicineBoxOutlined />}
          type="primary"
          size="small"
          onClick={() => openAdminister(record)}
        >
          Administer
        </Button>
      )
    }
  ];

  const recordColumns = [
    {
      title: 'Time',
      dataIndex: 'administered_time',
      render: (v) => v ? dayjs(v).format('DD MMM, HH:mm') : '-'
    },
    {
      title: 'Medicine',
      render: (_, r) => r.medication?.medicine_name || '-'
    },
    { title: 'Dosage Given', dataIndex: 'dosage_given' },
    {
      title: 'By',
      render: (_, r) => r.administeredBy?.name || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>
    },
    { title: 'Notes', dataIndex: 'notes', ellipsis: true }
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card
          title={<span><MedicineBoxOutlined /> Active Medications</span>}
          size="small"
        >
          <Table
            columns={activeColumns}
            dataSource={medications}
            rowKey="medication_id"
            loading={loading}
            pagination={false}
            size="small"
            locale={{ emptyText: 'No active medication orders' }}
          />
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Administration History" size="small">
          <Table
            columns={recordColumns}
            dataSource={records}
            rowKey="administration_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      </Col>

      <Modal
        title={active ? `Administer: ${active.medicine_name}` : 'Administer Medication'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="dosage_given"
            label="Dosage Given"
            rules={[{ required: true, message: 'Please enter dosage' }]}
          >
            <Input placeholder="e.g. 500mg" />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity (units)"
            rules={[{ required: true, message: 'Please enter quantity' }]}
            extra="Quantity will be deducted from stock (FEFO) and posted as bill charge"
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Observations, patient response, refusal etc." />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default MedicationAdministration;
