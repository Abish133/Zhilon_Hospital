import { useAuthStore } from '@store';
import { useState, useEffect } from 'react';
import { Card, Form, Button, Space, message, Input, Select, TimePicker, Row, Col, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import OTService from '../../services/OTService';
import PatientService from '../../services/PatientService';
import DoctorService from '../../services/DoctorService';

const OTIntraOpNotes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchPatients();
    fetchBookings();
    fetchDoctors();
    
    // Pre-populate form if coming from Pre-Op
    if (location.state?.fromPreOp) {
      form.setFieldsValue({
        booking_id: location.state.booking_id,
        patient_id: location.state.patient_id
      });
    }
  }, [location.state]);

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

  const fetchDoctors = async () => {
    try {
      const response = await DoctorService.getAll();
      setDoctors(response.data || []);
    } catch (error) {
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const intraOpData = {
        booking_id: values.booking_id,
        patient_id: values.patient_id,
        surgeon_id: values.surgeon_id,
        anesthesia_start_time: values.anesthesia_start_time?.format('HH:mm:ss'),
        surgery_start_time: values.surgery_start_time?.format('HH:mm:ss'),
        surgery_end_time: values.surgery_end_time?.format('HH:mm:ss'),
        anesthesia_end_time: values.anesthesia_end_time?.format('HH:mm:ss'),
        procedure_performed: values.procedure_performed,
        anesthesia_type: values.anesthesia_type,
        anesthesia_notes: values.anesthesia_notes,
        intra_op_findings: values.findings,
        procedure_notes: values.procedure_notes,
        complications: values.complications,
        blood_loss_ml: values.blood_loss,
        fluids_given: values.fluids_given,
        urine_output_ml: values.urine_output,
        vital_signs: values.vital_signs,
        position: values.position,
        drains_tubes: values.drains_tubes,
        closure_method: values.closure_method,
        dressing_applied: values.dressing_applied,
        instruments_used: values.instruments_used,
        specimens_sent: values.specimens_sent,
        implants_used: values.implants_used,
        recorded_by: 1, // Current user ID
        hospital_id: user?.hospital_id
      };

      const response = await OTService.createIntraOp(intraOpData);
      message.success('Intra-operative notes saved successfully');
      
      // Navigate to consumables page with data
      setTimeout(() => {
        navigate('/ot/consumables', {
          state: {
            booking_id: values.booking_id,
            patient_id: values.patient_id,
            intra_op_id: response?.data?.intra_op_id,
            fromIntraOp: true
          }
        });
      }, 1500);
    } catch (error) {
      message.error('Failed to save intra-operative notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Intra-Operative Notes">
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="surgeon_id" 
              label="Surgeon" 
              rules={[{ required: true, message: 'Please select a surgeon' }]}
            >
              <Select placeholder="Select surgeon">
                {doctors.map(doctor => (
                  <Select.Option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider>Timing</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="anesthesia_start_time" label="Anesthesia Start Time">
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="surgery_start_time" label="Surgery Start Time">
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="surgery_end_time" label="Surgery End Time">
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="anesthesia_end_time" label="Anesthesia End Time">
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Procedure Details</Divider>
        <Form.Item name="anesthesia_type" label="Anesthesia Type">
          <Select placeholder="Select anesthesia type">
            <Select.Option value="General">General</Select.Option>
            <Select.Option value="Spinal">Spinal</Select.Option>
            <Select.Option value="Epidural">Epidural</Select.Option>
            <Select.Option value="Local">Local</Select.Option>
            <Select.Option value="Regional">Regional</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="anesthesia_notes" label="Anesthesia Notes">
          <Input.TextArea rows={2} placeholder="Anesthesia related notes" />
        </Form.Item>

        <Form.Item name="procedure_performed" label="Procedure Performed">
          <Input.TextArea rows={3} placeholder="Describe the procedure performed" />
        </Form.Item>

        <Form.Item name="procedure_notes" label="Procedure Notes">
          <Input.TextArea rows={3} placeholder="Detailed procedure notes" />
        </Form.Item>

        <Form.Item name="findings" label="Intra-Operative Findings">
          <Input.TextArea rows={3} placeholder="Describe intra-operative findings" />
        </Form.Item>

        <Form.Item name="complications" label="Complications">
          <Input.TextArea rows={2} placeholder="Any complications encountered" />
        </Form.Item>

        <Divider>Additional Information</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="blood_loss" label="Estimated Blood Loss (ml)">
              <Input placeholder="e.g., 200" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="fluids_given" label="Fluids Given">
              <Input placeholder="e.g., Normal Saline 1000ml" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="urine_output" label="Urine Output (ml)">
              <Input placeholder="e.g., 150" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="position" label="Patient Position">
              <Select placeholder="Select patient position">
                <Select.Option value="Supine">Supine</Select.Option>
                <Select.Option value="Prone">Prone</Select.Option>
                <Select.Option value="Lateral">Lateral</Select.Option>
                <Select.Option value="Lithotomy">Lithotomy</Select.Option>
                <Select.Option value="Trendelenburg">Trendelenburg</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="vital_signs" label="Vital Signs">
              <Input.TextArea rows={2} placeholder="BP: 120/80, HR: 72, Temp: 98.6°F, SpO2: 98%" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="instruments_used" label="Instruments Used">
              <Input.TextArea rows={3} placeholder="List surgical instruments used (e.g., Scalpel No.15, Forceps x2, Retractor)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="specimens_sent" label="Specimens Sent">
              <Input.TextArea rows={2} placeholder="List specimens sent for examination" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="implants_used" label="Implants Used">
              <Input.TextArea rows={2} placeholder="List any implants used" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="drains_tubes" label="Drains/Tubes">
              <Input.TextArea rows={2} placeholder="Describe drains or tubes placed" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="closure_method" label="Closure Method">
              <Select placeholder="Select closure method">
                <Select.Option value="Sutures">Sutures</Select.Option>
                <Select.Option value="Staples">Staples</Select.Option>
                <Select.Option value="Clips">Clips</Select.Option>
                <Select.Option value="Adhesive">Adhesive</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="dressing_applied" label="Dressing Applied">
              <Select placeholder="Select dressing type">
                <Select.Option value="Sterile Gauze">Sterile Gauze</Select.Option>
                <Select.Option value="Transparent Film">Transparent Film</Select.Option>
                <Select.Option value="Hydrocolloid">Hydrocolloid</Select.Option>
                <Select.Option value="Foam">Foam</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={loading} 
              size="large"
            >
              Save Intra-Op Notes
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OTIntraOpNotes;