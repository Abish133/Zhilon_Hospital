import { useState, useEffect } from 'react';
import { Card, Form, Checkbox, Button, Space, message, Divider, Input, Select } from 'antd';
import { CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import OTService from '../../services/OTService';
import PatientService from '../../services/PatientService';
import { useAuthStore } from '@store';

const OTPreOpChecklist = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [bookings, setBookings] = useState([]);

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
      const preOpData = {
        booking_id: values.booking_id,
        patient_id: values.patient_id,
        consent_taken: values.consent_taken || false,
        consent_signed_by: values.consent_signed_by,
        npo_status: values.npo_status,
        pre_anesthetic_checkup: values.pre_anesthetic_checkup || false,
        pre_op_vitals: values.pre_op_vitals ? JSON.stringify(values.pre_op_vitals) : null,
        allergies_checked: values.allergies_checked || false,
        site_marking_done: values.site_marking_done || false,
        pre_op_medications: values.pre_op_medications,
        lab_reports_available: values.lab_reports_available || false,
        blood_arranged: values.blood_arranged,
        pre_op_checklist_by: user?.id || 1,
        completed_at: new Date(),
        hospital_id: user?.hospital_id
      };

      await OTService.createPreOp(preOpData);
      message.success('Pre-operative checklist completed successfully');
      
      // Navigate to Intra-Op with booking and patient data
      setTimeout(() => {
        navigate('/ot/intraop', {
          state: {
            booking_id: values.booking_id,
            patient_id: values.patient_id,
            fromPreOp: true
          }
        });
      }, 1500);
      
    } catch (error) {
      message.error('Failed to save pre-operative checklist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Pre-Operative Checklist">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                {booking.surgery_name} - {booking.surgery_date ? new Date(booking.surgery_date).toLocaleDateString() : 'No Date'}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        <Divider>Patient Identification</Divider>
        <Form.Item name="consent_taken" valuePropName="checked">
          <Checkbox>Patient identity verified with ID band</Checkbox>
        </Form.Item>
        <Form.Item name="consent_signed_by" label="Consent Signed By">
          <Input placeholder="Patient/Guardian name" />
        </Form.Item>
        <Form.Item name="site_marking_done" valuePropName="checked">
          <Checkbox>Surgical site marked</Checkbox>
        </Form.Item>

        <Divider>Pre-Operative Assessment</Divider>
        <Form.Item name="npo_status" label="NPO Status">
          <Select placeholder="Select NPO status">
            <Select.Option value="NPO 6+ hours">NPO 6+ hours</Select.Option>
            <Select.Option value="NPO 4-6 hours">NPO 4-6 hours</Select.Option>
            <Select.Option value="Not NPO">Not NPO</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="allergies_checked" valuePropName="checked">
          <Checkbox>Allergies documented</Checkbox>
        </Form.Item>
        <Form.Item name="pre_anesthetic_checkup" valuePropName="checked">
          <Checkbox>Pre-anesthetic checkup completed</Checkbox>
        </Form.Item>
        <Form.Item name="lab_reports_available" valuePropName="checked">
          <Checkbox>Lab reports available</Checkbox>
        </Form.Item>
        <Form.Item name="blood_arranged" label="Blood Arrangement">
          <Select placeholder="Blood arrangement status">
            <Select.Option value="Arranged">Arranged</Select.Option>
            <Select.Option value="Not Required">Not Required</Select.Option>
            <Select.Option value="Pending">Pending</Select.Option>
          </Select>
        </Form.Item>

        <Divider>Pre-Operative Medications & Vitals</Divider>
        <Form.Item name="pre_op_medications" label="Pre-Operative Medications">
          <Input.TextArea rows={2} placeholder="List medications administered" />
        </Form.Item>
        <Form.Item name="pre_op_vitals" label="Pre-Operative Vitals">
          <Input.TextArea rows={2} placeholder="Record vital signs (BP, HR, Temp, etc.)" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<CheckCircleOutlined />} 
              loading={loading} 
              size="large"
            >
              Complete Checklist
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
        
        <Divider>Next Steps</Divider>
        <Space wrap>
          <Button 
            icon={<ArrowRightOutlined />} 
            onClick={() => navigate('/ot/intraop')}
          >
            Go to Intra-Op Notes
          </Button>
          <Button 
            onClick={() => navigate('/ot')}
          >
            Back to OT Management
          </Button>
          <Button 
            onClick={() => navigate('/ot/consumables')}
          >
            Record Consumables
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default OTPreOpChecklist;
