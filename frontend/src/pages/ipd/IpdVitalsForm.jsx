import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, Table, message } from 'antd';
import { ipdVitalService } from '@services';

const IpdVitalsForm = () => {
  const { admissionId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVitalsHistory();
  }, [admissionId]);

  const fetchVitalsHistory = async () => {
    try {
      const res = await ipdVitalService.getVitalsByAdmission(admissionId);
      const data = res?.data?.data ?? res?.data ?? res;
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setHistory([]);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await ipdVitalService.recordVitals({ admission_id: admissionId, ...values });
      message.success('Vitals recorded successfully');
      form.resetFields();
      fetchVitalsHistory();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to record vitals');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Date/Time', key: 'datetime', render: (_, r) => `${r.recorded_date} ${r.recorded_time}` },
    { title: 'BP', key: 'bp', render: (_, r) => `${r.systolic_bp}/${r.diastolic_bp}` },
    { title: 'Pulse', dataIndex: 'pulse_rate' },
    { title: 'Temp', dataIndex: 'temperature' },
    { title: 'RR', dataIndex: 'respiratory_rate' },
    { title: 'SpO2', dataIndex: 'spo2', render: (v) => v ? `${v}%` : '-' },
    { title: 'Sugar', dataIndex: 'blood_sugar' },
    { title: 'Notes', dataIndex: 'notes' }
  ];

  return (
    <div>
      <Card title="Record IPD Vitals" extra={<Button onClick={() => navigate('/ipd')}>Back</Button>}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Form.Item label="Systolic BP" name="systolic_bp">
              <InputNumber style={{ width: '100%' }} placeholder="120" />
            </Form.Item>
            <Form.Item label="Diastolic BP" name="diastolic_bp">
              <InputNumber style={{ width: '100%' }} placeholder="80" />
            </Form.Item>
            <Form.Item label="Pulse Rate" name="pulse_rate">
              <InputNumber style={{ width: '100%' }} placeholder="72" />
            </Form.Item>
            <Form.Item label="Temperature (°F)" name="temperature">
              <InputNumber style={{ width: '100%' }} step={0.1} placeholder="98.6" />
            </Form.Item>
            <Form.Item label="Respiratory Rate" name="respiratory_rate">
              <InputNumber style={{ width: '100%' }} placeholder="16" />
            </Form.Item>
            <Form.Item label="SpO2 (%)" name="spo2">
              <InputNumber style={{ width: '100%' }} placeholder="98" />
            </Form.Item>
            <Form.Item label="Blood Sugar" name="blood_sugar">
              <InputNumber style={{ width: '100%' }} step={0.1} placeholder="100" />
            </Form.Item>
            <Form.Item label="Consciousness" name="consciousness_level">
              <Select placeholder="Select">
                <Select.Option value="Alert">Alert</Select.Option>
                <Select.Option value="Drowsy">Drowsy</Select.Option>
                <Select.Option value="Unconscious">Unconscious</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Pain Scale (0-10)" name="pain_scale">
              <InputNumber style={{ width: '100%' }} min={0} max={10} />
            </Form.Item>
            <Form.Item label="Intake (ml)" name="intake_ml">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Output (ml)" name="output_ml">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Record Vitals</Button>
        </Form>
      </Card>

      <Card title="Vitals History" style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={history} rowKey="vital_id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
};

export default IpdVitalsForm;
