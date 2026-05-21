import { Card, Tabs, Form, Input, Button, Space, message, Table, Select, Descriptions, Spin, Row, Col, Tag } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, PrinterOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ipdAdmissionService, ipdProgressNoteService } from '@services';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';
import IpdMedications from './IpdMedications';
import apiClient from '@services/apiClient';

const IPDDailyCare = () => {
  const { admissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [progressForm] = Form.useForm();
  const [orderForm] = Form.useForm();
  const [orderModal, setOrderModal] = useState(false);

  const { data: admissionData, isLoading } = useApiQuery(
    ['ipd-admission', admissionId],
    () => ipdAdmissionService.getById(admissionId)
  );

  const { data: progressNotesData, refetch: refetchNotes, isLoading: notesLoading } = useApiQuery(
    ['progress-notes', admissionId],
    () => ipdProgressNoteService.getAll({ admission_id: admissionId }),
    { enabled: !!admissionId }
  );

  // Fetch persisted orders (IPD progress notes with type Order)
  const { data: ordersData, refetch: refetchOrders, isLoading: ordersLoading } = useApiQuery(
    ['ipd-orders', admissionId],
    async () => {
      const res = await apiClient.get(`/ipd-progress-notes?admission_id=${admissionId}&note_type=Order`);
      return res;
    },
    { enabled: !!admissionId }
  );

  const createNoteMutation = useApiMutation(
    (data) => ipdProgressNoteService.create(data),
    {
      onSuccess: () => {
        message.success('Progress note added');
        progressForm.resetFields();
        refetchNotes();
      }
    }
  );

  const createOrderMutation = useApiMutation(
    (data) => ipdProgressNoteService.create(data),
    {
      onSuccess: () => {
        message.success('Order placed successfully');
        orderForm.resetFields();
        setOrderModal(false);
        refetchOrders();
      },
      onError: () => message.error('Failed to place order')
    }
  );

  const admission = admissionData?.data;
  // Exclude "Order" notes here — those belong to the Orders tab, which fetches
  // them separately with note_type=Order.
  const progressNotes = (progressNotesData?.data || []).filter(n => n.note_type !== 'Order');
  const orders = ordersData?.data || [];

  const handleProgressNote = (values) => {
    const currentDate = dayjs();
    const noteData = {
      admission_id: parseInt(admissionId),
      patient_id: admission?.patient_id,
      progress_date: currentDate.format('YYYY-MM-DD'),
      progress_time: currentDate.format('HH:mm:ss'),
      note_type: values.note_type || 'Doctor',
      recorded_by: user?.id,
      hospital_id: user?.hospital_id,
      ...values
    };
    if (!noteData.hospital_id) {
      message.error('Hospital context missing. Please sign in again.');
      return;
    }
    createNoteMutation.mutate(noteData);
  };

  const handleAddOrder = (values) => {
    if (!user?.hospital_id) {
      message.error('Hospital context missing. Please sign in again.');
      return;
    }
    const orderData = {
      admission_id: parseInt(admissionId),
      patient_id: admission?.patient_id,
      progress_date: dayjs().format('YYYY-MM-DD'),
      progress_time: dayjs().format('HH:mm:ss'),
      note_type: 'Order',
      doctor_notes: `[${values.order_type}] ${values.order_details}`,
      recorded_by: user?.id,
      hospital_id: user?.hospital_id,
    };
    createOrderMutation.mutate(orderData);
  };

  const handlePrintDischargeSummary = () => {
    window.open(`/ipd/discharge/${admissionId}`, '_blank');
  };

  const progressColumns = [
    {
      title: 'Date',
      dataIndex: 'recorded_at',
      key: 'date',
      width: 150,
      render: (date) => date ? dayjs(date).format('DD-MM-YYYY HH:mm') : '-'
    },
    { title: 'Type', dataIndex: 'note_type', key: 'note_type', width: 100, render: t => <Tag color="blue">{t || 'Doctor'}</Tag> },
    { title: 'Clinical Notes', dataIndex: 'doctor_notes', key: 'doctor_notes', render: (text) => text || '-' },
    { title: 'Nursing Notes', dataIndex: 'nursing_notes', key: 'nursing_notes', render: (text) => text || '-' },
    { title: 'Vitals', dataIndex: 'vitals', key: 'vitals', width: 150, render: (text) => text || '-' },
    { title: 'I/O', dataIndex: 'intake_output', key: 'intake_output', width: 120, render: (text) => text || '-' },
    {
      title: 'Recorded By',
      key: 'recorded_by',
      width: 150,
      render: (_, record) => record.recordedBy?.name || record.User?.name || `User #${record.recorded_by}`
    }
  ];

  const orderColumns = [
    {
      title: 'Date',
      dataIndex: 'progress_date',
      key: 'date',
      width: 120,
      render: (date, record) => record.recorded_at ? dayjs(record.recorded_at).format('DD-MM-YYYY HH:mm') : (date || '-')
    },
    {
      title: 'Order',
      dataIndex: 'doctor_notes',
      key: 'details'
    },
    {
      title: 'Placed By',
      key: 'placed_by',
      width: 150,
      render: (_, record) => record.recordedBy?.name || record.User?.name || `User #${record.recorded_by}`
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: () => <Tag color="orange">Pending</Tag>
    }
  ];

  if (isLoading) return <Card><Spin size="large" /></Card>;
  if (!admission) return <Card>Admission not found</Card>;

  return (
    <div>
      <Card
        title={`IPD Daily Care - Admission #${admissionId}`}
        extra={
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => navigate(`/ipd/discharge/${admissionId}`)}>
              Discharge
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Patient">
            {admission.patient ? `${admission.patient.first_name} ${admission.patient.last_name}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="UHID">{admission.uhid}</Descriptions.Item>
          <Descriptions.Item label="Doctor">{admission.admittingDoctor?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Ward">
            {admission.ward?.ward_name} - Room {admission.room_number}/{admission.bed?.bed_number}
          </Descriptions.Item>
          <Descriptions.Item label="Admission Date">
            {dayjs(admission.admission_date).format('DD-MM-YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Days Admitted">
            {dayjs().diff(dayjs(admission.admission_date), 'day')} day(s)
          </Descriptions.Item>
        </Descriptions>

        <Tabs
          items={[
            {
              key: '1',
              label: 'Progress Notes',
              children: (
                <div>
                  <Card size="small" style={{ marginBottom: 16 }} title="Add Note">
                    <Form form={progressForm} layout="vertical" onFinish={handleProgressNote}>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item name="note_type" label="Note Type" initialValue="Doctor" rules={[{ required: true }]}>
                            <Select>
                              <Select.Option value="Doctor">Doctor</Select.Option>
                              <Select.Option value="Nurse">Nurse</Select.Option>
                              <Select.Option value="Physiotherapist">Physiotherapist</Select.Option>
                              <Select.Option value="Dietitian">Dietitian</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item name="doctor_notes" label="Clinical Notes" rules={[{ required: true, message: 'Please enter notes' }]}>
                        <Input.TextArea rows={3} placeholder="Clinical observations, treatment response..." />
                      </Form.Item>
                      <Form.Item name="nursing_notes" label="Nursing Notes">
                        <Input.TextArea rows={2} placeholder="Vitals, medications given, patient condition..." />
                      </Form.Item>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="vitals" label="Vitals">
                            <Input.TextArea rows={2} placeholder="BP: 120/80, Pulse: 72, Temp: 98.6Â°F, RR: 18" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="intake_output" label="Intake/Output">
                            <Input.TextArea rows={2} placeholder="Intake: 1500ml, Output: 1200ml" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button type="primary" htmlType="submit" loading={createNoteMutation.isPending}>Add Progress Note</Button>
                    </Form>
                  </Card>
                  <Table
                    columns={progressColumns}
                    dataSource={progressNotes}
                    rowKey="progress_id"
                    pagination={false}
                    size="small"
                    loading={notesLoading}
                    locale={{ emptyText: 'No progress notes yet. Add the first note above.' }}
                  />
                </div>
              )
            },
            {
              key: '2',
              label: 'Medications',
              children: <IpdMedications admissionId={admissionId} />
            },
            {
              key: '3',
              label: 'Orders',
              children: (
                <div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setOrderModal(true)}
                    style={{ marginBottom: 16 }}
                  >
                    Place Order
                  </Button>
                  <Table
                    columns={orderColumns}
                    dataSource={orders}
                    rowKey="progress_id"
                    pagination={false}
                    loading={ordersLoading}
                    locale={{ emptyText: 'No orders placed yet.' }}
                  />
                </div>
              )
            },
            {
              key: '4',
              label: 'Discharge',
              children: (
                <Card>
                  <Space direction="vertical">
                    <p>Initiate the discharge process for this patient. This will open the discharge summary form.</p>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate(`/ipd/discharge/${admissionId}`)}
                    >
                      Initiate Discharge
                    </Button>
                  </Space>
                </Card>
              )
            }
          ]}
        />
      </Card>

      <SliderModal
        title="Place Order"
        open={orderModal}
        onCancel={() => { setOrderModal(false); orderForm.resetFields(); }}
        footer={null}
      >
        <Form form={orderForm} layout="vertical" onFinish={handleAddOrder}>
          <Form.Item name="order_type" label="Order Type" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Laboratory', value: 'Lab' },
                { label: 'Radiology', value: 'Radiology' },
                { label: 'Pharmacy', value: 'Pharmacy' },
                { label: 'Procedure', value: 'Procedure' }
              ]}
            />
          </Form.Item>
          <Form.Item name="order_details" label="Order Details" rules={[{ required: true, message: 'Please describe the order' }]}>
            <Input.TextArea rows={3} placeholder="Specify tests, medicines, or procedures..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createOrderMutation.isPending}>Place Order</Button>
              <Button onClick={() => { setOrderModal(false); orderForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default IPDDailyCare;
