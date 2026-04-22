import { Form, Input, Button, Card, message, Space, Select, Row, Col, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { patientService, doctorService, wardService, bedService, ipdAdmissionService, departmentService } from '@services';
import { useAuthStore } from '@store';
import { useApiMutation } from '@hooks/useApi';
import dayjs from 'dayjs';

const IPDAdmissionForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const createMutation = useApiMutation(
    (data) => ipdAdmissionService.create(data),
    {
      onSuccess: () => {
        message.success('Patient admitted successfully');
        navigate('/ipd');
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || 'Failed to admit patient');
      }
    }
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, doctorsRes, wardsRes, bedsRes, deptRes] = await Promise.all([
        patientService.getAll(),
        doctorService.getAll(),
        wardService.getAll(),
        bedService.getAll(),
        departmentService.getAll()
      ]);
      
      
      setPatients(patientsRes?.data || []);
      setDoctors(doctorsRes?.data || []);
      setWards(wardsRes?.data || []);
      setBeds(bedsRes?.data || []);
      setDepartments(deptRes?.data || []);
    } catch (error) {
      message.error('Failed to load form data');
    }
  };

  const handleWardChange = (wardId) => {
    setSelectedWard(wardId);
    form.setFieldsValue({ bed_id: null });
  };

  const handlePatientChange = (patientId) => {
    const patient = patients.find(p => p.patient_id === patientId);
    setSelectedPatient(patient);
    if (patient) {
      form.setFieldsValue({ uhid: patient.uhid });
    }
  };

  const availableBeds = selectedWard 
    ? beds.filter(b => (b.ward_id === selectedWard || b.ward?.ward_id === selectedWard) && b.status === 'Available')
    : [];

  const handleSubmit = async (values) => {
    const selectedBed = beds.find(b => b.bed_id === values.bed_id);
    
    const admissionData = {
      patient_id: values.patient_id,
      uhid: selectedPatient?.uhid,
      admitting_doctor_id: values.admitting_doctor_id,
      department_id: values.department_id,
      ward_id: values.ward_id,
      bed_id: values.bed_id,
      room_number: selectedBed?.room_number,
      bed_number: selectedBed?.bed_number,
      admission_date: values.admission_date ? values.admission_date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
      admission_reason: values.admission_reason,
      provisional_diagnosis: values.provisional_diagnosis,
      admission_type: values.admission_type || 'Planned',
      advance_paid: parseFloat(values.advance_paid) || 0,
      status: 'Admitted',
      admitted_by: user?.id,
      hospital_id: user?.hospital_id
    };
    
    createMutation.mutate(admissionData);
  };

  return (
    <Card title="IPD Admission">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="patient_id" label="Patient" rules={[{ required: true, message: 'Please select patient' }]}>
              <Select
                showSearch
                placeholder="Search by UHID or Name"
                onChange={handlePatientChange}
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                options={patients.map(p => ({
                  label: `${p.uhid} - ${p.first_name} ${p.last_name}`,
                  value: p.patient_id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="uhid" label="UHID">
              <Input disabled placeholder="Auto-filled" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="admitting_doctor_id" label="Admitting Doctor" rules={[{ required: true, message: 'Please select doctor' }]}>
              <Select
                showSearch
                placeholder="Select doctor"
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                options={doctors.map(d => ({
                  label: `${d.name} - ${d.specialization || ''}`,
                  value: d.id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="department_id" label="Department">
              <Select
                placeholder="Select department"
                options={departments.map(d => ({
                  label: d.department_name,
                  value: d.id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="ward_id" label="Ward" rules={[{ required: true, message: 'Please select ward' }]}>
              <Select
                placeholder="Select ward"
                onChange={handleWardChange}
                options={wards.map(w => ({
                  label: `${w.ward_name} (${w.ward_type})`,
                  value: w.ward_id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="bed_id" label={`Bed (${availableBeds.length} available)`} rules={[{ required: true, message: 'Please select bed' }]}>
              <Select
                disabled={!selectedWard}
                placeholder={selectedWard ? `${availableBeds.length} beds available` : "Select ward first"}
                options={availableBeds.map(b => ({
                  label: `Room ${b.room_number || '-'} - Bed ${b.bed_number} (${b.bed_type})`,
                  value: b.bed_id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="admission_date" label="Admission Date">
              <DatePicker showTime style={{ width: '100%' }} format="DD-MM-YYYY HH:mm" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="admission_type" label="Admission Type" initialValue="Planned">
              <Select
                options={[
                  { label: 'Planned', value: 'Planned' },
                  { label: 'Emergency', value: 'Emergency' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="admission_reason" label="Reason for Admission" rules={[{ required: true, message: 'Please enter reason' }]}>
              <Input.TextArea rows={3} placeholder="Chief complaints and reason..." />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="provisional_diagnosis" label="Provisional Diagnosis">
              <Input.TextArea rows={2} placeholder="Initial diagnosis..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="advance_paid" label="Advance Amount" rules={[{ required: true, message: 'Please enter advance amount' }]}>
              <Input type="number" prefix="₹" placeholder="0.00" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending} size="large">
              Admit Patient
            </Button>
            <Button onClick={() => navigate('/ipd')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default IPDAdmissionForm;
