import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Row, Col, Space, Divider, InputNumber, message, TimePicker, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/PageHeader';
import { useApiQuery } from '@hooks/useApi';
import OTService from '@services/OTService';
import DoctorService from '@services/DoctorService';

const { TextArea } = Input;

const AnesthesiaNotes = () => {
  const { booking_id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: booking } = useApiQuery(['ot-booking', booking_id], () => OTService.getBookingDetails(booking_id));
  const { data: doctorsData } = useApiQuery('doctors', () => DoctorService.getAll());

  const handleSubmit = async () => {
    const values = await form.validateFields();
    message.success('Anesthesia notes saved successfully');
    navigate('/ot');
  };

  return (
    <div>
      <PageHeader title="Anesthesia Notes" onBack={() => navigate('/ot')} />
      
      <Card style={{ marginTop: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}><strong>Patient:</strong> {booking?.data?.patient_name}</Col>
          <Col span={8}><strong>UHID:</strong> {booking?.data?.uhid}</Col>
          <Col span={8}><strong>Surgery:</strong> {booking?.data?.surgery_name}</Col>
        </Row>

        <Divider />

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="anesthesia_type" label="Anesthesia Type" rules={[{ required: true }]}>
                <Select options={[
                  { label: 'General Anesthesia', value: 'General' },
                  { label: 'Spinal Anesthesia', value: 'Spinal' },
                  { label: 'Epidural', value: 'Epidural' },
                  { label: 'Local Anesthesia', value: 'Local' },
                  { label: 'Sedation', value: 'Sedation' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="anesthetist_id" label="Anesthetist" rules={[{ required: true }]}>
                <Select options={(doctorsData?.data || []).map(d => ({ label: d.full_name || d.name, value: d.doctor_id || d.id }))} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="induction_time" label="Induction Time">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maintenance_time" label="Maintenance Time">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reversal_time" label="Reversal Time">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="drugs_administered" label="Drugs Administered">
                <TextArea rows={3} placeholder="List all drugs with dosages" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="pre_op_bp" label="Pre-Op BP">
                <Input placeholder="120/80" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pre_op_pulse" label="Pre-Op Pulse">
                <InputNumber style={{ width: '100%' }} placeholder="72" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pre_op_spo2" label="Pre-Op SpO2">
                <InputNumber style={{ width: '100%' }} placeholder="98" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="intra_op_bp" label="Intra-Op BP">
                <Input placeholder="115/75" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="intra_op_pulse" label="Intra-Op Pulse">
                <InputNumber style={{ width: '100%' }} placeholder="68" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="intra_op_spo2" label="Intra-Op SpO2">
                <InputNumber style={{ width: '100%' }} placeholder="99" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="blood_loss" label="Blood Loss (ml)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fluid_given" label="Fluid Given (ml)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="complications" label="Complications">
                <TextArea rows={2} placeholder="Any complications during anesthesia" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="post_op_instructions" label="Post-Op Instructions">
                <TextArea rows={3} placeholder="Recovery instructions" />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit}>Save Notes</Button>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ot')}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default AnesthesiaNotes;
