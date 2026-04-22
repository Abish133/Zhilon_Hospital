import { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Button, message, Row, Col, Divider, Space, Statistic, Tag } from 'antd';
import { HeartOutlined, DashboardOutlined, FireOutlined, RiseOutlined } from '@ant-design/icons';
import { opdVitalService, opdVisitService } from '@/services';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store';

const OPDVitals = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState(null);
  const [bmi, setBmi] = useState(null);
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (visitId) fetchVisit();
  }, [visitId]);

  const fetchVisit = async () => {
    try {
      const response = await opdVisitService.getById(visitId);
      if (response.success) {
        setVisit(response.data);
      } else {
        message.error('Visit not found');
        navigate('/opd/visits');
      }
    } catch (error) {
      message.error('Failed to fetch visit details');
      navigate('/opd/visits');
    }
  };

  const calculateBMI = (changedValues, allValues) => {
    const { weight, height } = allValues;
    if (weight && height && height > 0) {
      const heightM = height / 100;
      setBmi((weight / (heightM * heightM)).toFixed(1));
    } else {
      setBmi(null);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const bmiValue = values.weight && values.height
        ? parseFloat((values.weight / Math.pow(values.height / 100, 2)).toFixed(1))
        : null;

      const vitalData = {
        visit_id: parseInt(visitId),
        bp_systolic: values.bp_systolic,
        bp_diastolic: values.bp_diastolic,
        pulse_rate: values.pulse_rate,
        temperature: values.temperature,
        respiratory_rate: values.respiratory_rate,
        spo2: values.spo2,
        weight: values.weight,
        height: values.height,
        bmi: bmiValue,
        hospital_id: user?.hospital_id,
        recorded_at: new Date()
      };

      const response = await opdVitalService.create(vitalData);
      if (response.success) {
        message.success('Vitals recorded successfully!');
        await opdVisitService.update(visitId, { status: 'In-consultation' });
        navigate(`/opd/consultation/${visitId}`);
      }
    } catch (error) {
      message.error('Failed to record vitals: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getBMICategory = (bmiValue) => {
    if (!bmiValue) return null;
    const b = parseFloat(bmiValue);
    if (b < 18.5) return { text: 'Underweight', color: 'blue' };
    if (b < 25) return { text: 'Normal', color: 'green' };
    if (b < 30) return { text: 'Overweight', color: 'orange' };
    return { text: 'Obese', color: 'red' };
  };

  const bmiCat = getBMICategory(bmi);

  return (
    <Card title={<Space><HeartOutlined style={{ fontSize: 22, color: '#ff4d4f' }} /><span>Record Patient Vitals</span></Space>}>
      {visit && (
        <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
          <Row gutter={16}>
            <Col span={8}><strong>Patient:</strong> {visit.patient?.first_name} {visit.patient?.last_name}</Col>
            <Col span={8}><strong>UHID:</strong> {visit.uhid}</Col>
            <Col span={8}><strong>Token:</strong> #{visit.token_number}</Col>
          </Row>
        </Card>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={calculateBMI}>
        <Divider orientation="left">Vital Signs</Divider>
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item name="bp_systolic" label="Systolic BP (mmHg)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={40} max={300} style={{ width: '100%' }} placeholder="120" size="large" prefix={<DashboardOutlined />} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="bp_diastolic" label="Diastolic BP (mmHg)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={20} max={200} style={{ width: '100%' }} placeholder="80" size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="pulse_rate" label="Pulse Rate (bpm)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} max={300} style={{ width: '100%' }} placeholder="72" size="large" prefix={<HeartOutlined />} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="temperature" label="Temperature (°F)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={90} max={115} step={0.1} style={{ width: '100%' }} placeholder="98.6" size="large" prefix={<FireOutlined />} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="respiratory_rate" label="Respiratory Rate (breaths/min)">
              <InputNumber min={0} max={60} style={{ width: '100%' }} placeholder="16" size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="spo2" label="SpO2 (%)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="98" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Physical Measurements</Divider>
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item name="weight" label="Weight (kg)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} max={500} step={0.1} style={{ width: '100%' }} placeholder="70" size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="height" label="Height (cm)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} max={300} step={0.1} style={{ width: '100%' }} placeholder="170" size="large" />
            </Form.Item>
          </Col>
          {bmi && bmiCat && (
            <Col xs={24} md={12}>
              <Card size="small" style={{ marginTop: 30 }}>
                <Statistic
                  title="BMI"
                  value={bmi}
                  prefix={<RiseOutlined />}
                  suffix={<Tag color={bmiCat.color} style={{ marginLeft: 8 }}>{bmiCat.text}</Tag>}
                />
              </Card>
            </Col>
          )}
        </Row>

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" htmlType="submit" size="large" loading={loading} icon={<HeartOutlined />}>
              Save Vitals & Proceed to Consultation
            </Button>
            <Button size="large" onClick={() => navigate('/opd/visits')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OPDVitals;
