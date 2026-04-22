import { useState, useEffect } from 'react';
import { Card, Form, Button, Space, message, Input, Select, Row, Col, Divider, DatePicker } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import OTService from '../../services/OTService';
import PatientService from '../../services/PatientService';
import { useAuthStore } from '../../store';

const OTPostOpNotes = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPatients();
    fetchBookings();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await PatientService.getAll();
      setPatients(response.data || []);
    } catch (error) {
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await OTService.getBookings();
      setBookings(response.data || []);
    } catch (error) {
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      
      let postOpVitals = null;
      if (values.post_op_vitals) {
        try {
          postOpVitals = JSON.parse(values.post_op_vitals);
        } catch (e) {
          message.error('Invalid JSON format for vitals');
          setLoading(false);
          return;
        }
      }
      
      const postOpData = {
        booking_id: values.booking_id,
        patient_id: values.patient_id,
        recovery_notes: values.recovery_notes || null,
        post_op_vitals: postOpVitals,
        post_op_orders: values.post_op_orders || null,
        pain_management: values.pain_management || null,
        wound_status: values.wound_status || null,
        drains_inserted: values.drains_inserted || null,
        transferred_to_ward: values.transferred_to_ward ? values.transferred_to_ward.toISOString() : null,
        post_op_complications: values.post_op_complications || null,
        recorded_by: user?.id || 1,
        hospital_id: user?.hospital_id
      };
      
      const response = await OTService.createPostOp(postOpData);
      
      message.success('Post-operative notes saved successfully');
      form.resetFields();
    } catch (error) {
      message.error(`Failed to save: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Post-Operative Notes">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="patient_id" 
              label="Patient" 
              rules={[{ required: true, message: 'Please select a patient' }]}
            >
              <Select 
                showSearch 
                placeholder="Search and select patient"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {patients.map(patient => (
                  <Select.Option key={patient.patient_id} value={patient.patient_id}>
                    {patient.first_name} {patient.last_name} - {patient.uhid}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="booking_id" 
              label="OT Booking" 
              rules={[{ required: true, message: 'Please select an OT booking' }]}
            >
              <Select 
                showSearch 
                placeholder="Select OT booking"
                optionFilterProp="children"
              >
                {bookings.map(booking => (
                  <Select.Option key={booking.booking_id} value={booking.booking_id}>
                    {booking.surgery_name} - {new Date(booking.surgery_date).toLocaleDateString()}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider>Post-Operative Assessment</Divider>
        <Form.Item name="recovery_notes" label="Recovery Notes">
          <Input.TextArea rows={3} placeholder="Patient recovery status and notes" />
        </Form.Item>

        <Form.Item name="post_op_vitals" label="Post-Operative Vitals (JSON format)">
          <Input.TextArea 
            rows={2} 
            placeholder='{"bp": "120/80", "pulse": "72", "temp": "98.6"}'
            onBlur={(e) => {
              if (e.target.value) {
                try {
                  JSON.parse(e.target.value);
                } catch (err) {
                  message.warning('Invalid JSON format');
                }
              }
            }}
          />
        </Form.Item>

        <Form.Item name="post_op_complications" label="Post-Operative Complications">
          <Input.TextArea rows={2} placeholder="Any post-operative complications" />
        </Form.Item>

        <Divider>Clinical Details</Divider>
        <Form.Item name="wound_status" label="Wound Status">
          <Select placeholder="Select wound status">
            <Select.Option value="Clean">Clean</Select.Option>
            <Select.Option value="Healing">Healing</Select.Option>
            <Select.Option value="Infected">Infected</Select.Option>
            <Select.Option value="Dehiscence">Dehiscence</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="pain_management" label="Pain Management">
          <Input.TextArea rows={2} placeholder="Pain management plan and medications" />
        </Form.Item>

        <Form.Item name="drains_inserted" label="Drains Inserted">
          <Input.TextArea rows={2} placeholder="Details of any drains inserted" />
        </Form.Item>

        <Divider>Orders & Transfer</Divider>
        <Form.Item name="post_op_orders" label="Post-Operative Orders">
          <Input.TextArea rows={4} placeholder="Detailed post-operative orders and instructions" />
        </Form.Item>

        <Form.Item name="transferred_to_ward" label="Transfer to Ward Date/Time">
          <DatePicker showTime placeholder="Select transfer date and time" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={loading} 
              size="large"
            >
              Save Post-Op Notes
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OTPostOpNotes;