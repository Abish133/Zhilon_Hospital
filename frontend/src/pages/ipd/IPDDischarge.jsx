import { Card, Form, Input, InputNumber, Button, Space, message, Descriptions, Divider, Select, DatePicker, Row, Col, Alert, Modal } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ipdAdmissionService, ipdDischargeSummaryService, ipdDischargeNursingSummaryService, doctorService, employeeService } from '@services';
import { useAuthStore } from '@store';
import { useApiMutation } from '@hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@services/apiClient';
import dayjs from 'dayjs';

const IPDDischarge = () => {
  const { admissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [admission, setAdmission] = useState(null);
  const [dischargeData, setDischargeData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [outstandingBill, setOutstandingBill] = useState(null);

  const dischargeMutation = useApiMutation(
    (data) => ipdDischargeSummaryService.create(data),
    {
      onSuccess: (response) => {
        message.success('Patient discharged successfully');
        queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
        queryClient.invalidateQueries({ queryKey: ['ipd-admission', admissionId] });
        queryClient.invalidateQueries({ queryKey: ['beds'] });
        setDischargeData(response?.data || null);
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || 'Failed to discharge patient');
      }
    }
  );

  useEffect(() => {
    fetchData();
  }, [admissionId]);

  const fetchData = async () => {
    try {
      const [admissionRes, doctorsRes, nursesRes] = await Promise.all([
        ipdAdmissionService.getById(admissionId),
        doctorService.getAll(),
        employeeService.getAll({ role: 'Nurse' })
      ]);
      setAdmission(admissionRes?.data);
      setDoctors(doctorsRes?.data || []);
      setNurses(nursesRes?.data?.filter(emp => emp.role === 'Nurse') || []);

      // Check outstanding bill
      try {
        const billRes = await apiClient.get(`/bills/admission/${admissionId}`);
        const bill = billRes?.data;
        if (bill && bill.balance_amount > 0) {
          setOutstandingBill(bill);
        }
      } catch {
        // no bill yet is ok
      }
    } catch (error) {
      message.error('Failed to load admission details');
    } finally {
      setLoading(false);
    }
  };

  const handleDischarge = async (values) => {
    if (!user?.hospital_id) {
      message.error('Hospital context missing. Please sign in again.');
      return;
    }
    try {
      // Create discharge summary
      const dischargeSummaryData = {
        admission_id: parseInt(admissionId),
        patient_id: admission?.patient_id,
        discharge_date: values.discharge_date ? values.discharge_date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        discharge_type: values.discharge_type,
        final_diagnosis: values.final_diagnosis,
        procedures_performed: values.procedures_performed,
        clinical_summary: values.clinical_summary,
        nursing_summary: values.nursing_summary,
        discharge_medications: values.discharge_medications,
        follow_up_instructions: values.follow_up_instructions,
        follow_up_date: values.follow_up_date ? values.follow_up_date.format('YYYY-MM-DD') : null,
        diet_advice: values.diet_advice,
        activity_restrictions: values.activity_restrictions,
        discharged_by: values.discharged_by,
        discharge_summary_by: user?.id,
        hospital_id: user?.hospital_id
      };

      // Optional nursing discharge summary. The backend requires BOTH nurses,
      // so only attempt it when both are selected — and never let a failure here
      // block the actual discharge below.
      if (values.primary_nurse_id && values.last_shift_nurse_id) {
        try {
          await ipdDischargeNursingSummaryService.create({
            admission_id: parseInt(admissionId),
            primary_nurse_id: values.primary_nurse_id,
            last_shift_nurse_id: values.last_shift_nurse_id,
            patient_condition_at_discharge: values.patient_condition_at_discharge,
            vitals_at_discharge: values.discharge_vitals || null,
            wound_status: values.wound_status,
            catheter_status: values.catheter_status,
            iv_line_status: values.iv_line_status,
            discharge_education_given: values.discharge_education_given || false,
            nurse_remarks: values.nurse_remarks,
            hospital_id: user?.hospital_id
          });
        } catch (e) {
          message.warning('Nursing discharge summary was not saved; proceeding with discharge.');
        }
      }

      dischargeMutation.mutate(dischargeSummaryData);
    } catch (error) {
      message.error('Failed to discharge patient');
    }
  };

  if (loading) return <Card loading />;

  // Show success screen after discharge
  if (dischargeData) {
    const printSummary = () => {
      const win = window.open('', '_blank');
      win.document.write(`
        <html><head><title>Discharge Summary</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; max-width: 800px; margin: auto; }
          h2 { color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 8px; }
          .section { margin: 16px 0; }
          .label { font-weight: bold; color: #555; }
          .value { margin-left: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          td, th { border: 1px solid #ddd; padding: 8px; }
          th { background: #f0f0f0; }
          @media print { .no-print { display: none; } }
        </style></head><body>
        <h2>Discharge Summary</h2>
        <table>
          <tr><th>Patient</th><td>${admission?.patient ? `${admission.patient.first_name} ${admission.patient.last_name}` : '-'}</td>
              <th>UHID</th><td>${admission?.uhid || '-'}</td></tr>
          <tr><th>Admission</th><td>${admission?.admission_date ? dayjs(admission.admission_date).format('DD-MM-YYYY') : '-'}</td>
              <th>Discharge</th><td>${dayjs().format('DD-MM-YYYY')}</td></tr>
          <tr><th>Doctor</th><td>${admission?.admittingDoctor?.name || '-'}</td>
              <th>Ward</th><td>${admission?.ward?.ward_name || '-'}</td></tr>
        </table>
        <div class="section"><div class="label">Final Diagnosis:</div>
          <div class="value">${form.getFieldValue('final_diagnosis') || dischargeData.final_diagnosis || '-'}</div></div>
        <div class="section"><div class="label">Procedures Performed:</div>
          <div class="value">${form.getFieldValue('procedures_performed') || dischargeData.procedures_performed || '-'}</div></div>
        <div class="section"><div class="label">Clinical Course:</div>
          <div class="value">${form.getFieldValue('clinical_summary') || dischargeData.clinical_summary || '-'}</div></div>
        <div class="section"><div class="label">Discharge Medications:</div>
          <div class="value">${form.getFieldValue('discharge_medications') || dischargeData.discharge_medications || '-'}</div></div>
        <div class="section"><div class="label">Follow-up Instructions:</div>
          <div class="value">${form.getFieldValue('follow_up_instructions') || dischargeData.follow_up_instructions || '-'}</div></div>
        <div class="section"><div class="label">Diet Advice:</div>
          <div class="value">${form.getFieldValue('diet_advice') || dischargeData.diet_advice || '-'}</div></div>
        <div class="section"><div class="label">Activity Restrictions:</div>
          <div class="value">${form.getFieldValue('activity_restrictions') || dischargeData.activity_restrictions || '-'}</div></div>
        <button class="no-print" onclick="window.print()" style="margin-top:24px;padding:8px 24px;font-size:16px;cursor:pointer;">Print</button>
        </body></html>`);
      win.document.close();
      win.focus();
      win.print();
    };

    return (
      <Card>
        <Alert
          type="success"
          showIcon
          message="Patient Discharged Successfully"
          description={`${admission?.patient ? `${admission.patient.first_name} ${admission.patient.last_name}` : 'Patient'} has been discharged. Bed has been freed.`}
          style={{ marginBottom: 24 }}
        />
        <Space wrap>
          <Button type="primary" icon={<PrinterOutlined />} onClick={printSummary}>
            Print Discharge Summary
          </Button>
          {outstandingBill && (
            <Button onClick={() => navigate(`/billing/generate/${outstandingBill.episode_id}`)}>
              Clear Outstanding Bill
            </Button>
          )}
          <Button onClick={() => navigate('/ipd')}>Back to Admissions</Button>
        </Space>
      </Card>
    );
  }

  const admissionDate = admission?.admission_date ? dayjs(admission.admission_date) : null;
  const daysAdmitted = admissionDate ? dayjs().diff(admissionDate, 'day') : 0;

  return (
    <Card title={`Discharge Summary - Admission #${admissionId}`}>
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Patient">
          {admission?.patient ? `${admission.patient.first_name} ${admission.patient.last_name}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="UHID">{admission?.uhid || '-'}</Descriptions.Item>
        <Descriptions.Item label="Admission Date">
          {admissionDate ? admissionDate.format('DD-MM-YYYY') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Total Days">{daysAdmitted}</Descriptions.Item>
        <Descriptions.Item label="Ward">{admission?.ward?.ward_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="Bed">
          {admission?.bed ? `Room ${admission.room_number || '-'} / Bed ${admission.bed.bed_number}` : '-'}
        </Descriptions.Item>
      </Descriptions>

      <Divider>Discharge Summary</Divider>

      {outstandingBill && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Outstanding Balance: ₹${parseFloat(outstandingBill.balance_amount).toLocaleString('en-IN')}`}
          description={`Bill #${outstandingBill.bill_number} has an unpaid balance. Please collect payment before discharge or proceed anyway.`}
          action={
            <Button size="small" onClick={() => navigate(`/billing/generate/${outstandingBill.episode_id}`)}>
              Go to Bill
            </Button>
          }
        />
      )}
      <Form form={form} layout="vertical" onFinish={handleDischarge}>
        <Form.Item name="discharge_date" label="Discharge Date & Time">
          <DatePicker showTime style={{ width: '100%' }} format="DD-MM-YYYY HH:mm" />
        </Form.Item>

        <Form.Item name="discharge_type" label="Discharge Type" rules={[{ required: true, message: 'Please select discharge type' }]}>
          <Select
            options={[
              { label: 'Normal', value: 'Normal' },
              { label: 'Against Medical Advice (AMA)', value: 'AMA' },
              { label: 'Referred', value: 'Referred' },
              { label: 'Absconded', value: 'Absconded' },
              { label: 'Death', value: 'Death' }
            ]}
          />
        </Form.Item>

        <Form.Item name="discharged_by" label="Discharged By (Doctor)" rules={[{ required: true, message: 'Please select doctor' }]}>
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

        <Form.Item name="final_diagnosis" label="Final Diagnosis" rules={[{ required: true, message: 'Please enter final diagnosis' }]}>
          <Input.TextArea rows={3} placeholder="Complete diagnosis with ICD codes..." />
        </Form.Item>

        <Form.Item name="procedures_performed" label="Procedures/Surgeries Done">
          <Input.TextArea rows={3} placeholder="List all procedures performed during admission..." />
        </Form.Item>

        <Form.Item name="clinical_summary" label="Clinical Course">
          <Input.TextArea rows={4} placeholder="Summary of patient's hospital stay, treatment given, response..." />
        </Form.Item>

        <Form.Item name="nursing_summary" label="Nursing Summary">
          <Input.TextArea rows={3} placeholder="Nursing care provided, patient response, vital signs trends, complications..." />
        </Form.Item>

        <Form.Item name="discharge_medications" label="Discharge Medications" rules={[{ required: true, message: 'Please enter discharge medications' }]}>
          <Input.TextArea rows={4} placeholder="Medicine name, dosage, duration, instructions..." />
        </Form.Item>

        <Form.Item name="follow_up_instructions" label="Follow-up Instructions" rules={[{ required: true, message: 'Please enter follow-up instructions' }]}>
          <Input.TextArea rows={3} placeholder="Precautions, diet, activity restrictions..." />
        </Form.Item>

        <Form.Item name="follow_up_date" label="Follow-up Date">
          <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
        </Form.Item>

        <Form.Item name="diet_advice" label="Diet Advice">
          <Input.TextArea rows={2} placeholder="Dietary recommendations..." />
        </Form.Item>

        <Form.Item name="activity_restrictions" label="Activity Restrictions">
          <Input.TextArea rows={2} placeholder="Physical activity limitations..." />
        </Form.Item>

        <Divider>Nursing Discharge Summary</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="primary_nurse_id" label="Primary Nurse">
              <Select
                placeholder="Select primary nurse"
                options={nurses.map(n => ({
                  label: n.full_name,
                  value: n.employee_id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="last_shift_nurse_id" label="Last Shift Nurse">
              <Select
                placeholder="Select last shift nurse"
                options={nurses.map(n => ({
                  label: n.full_name,
                  value: n.employee_id
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="patient_condition_at_discharge" label="Patient Condition">
              <Select
                placeholder="Select condition"
                options={[
                  { label: 'Stable', value: 'Stable' },
                  { label: 'Improved', value: 'Improved' },
                  { label: 'Critical', value: 'Critical' },
                  { label: 'Satisfactory', value: 'Satisfactory' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Vitals at Discharge (BP)">
              <Input.Group compact>
                <Form.Item name={["discharge_vitals","bp_systolic"]} noStyle>
                  <InputNumber style={{width:90}} placeholder="Sys" min={40} max={300} />
                </Form.Item>
                <span style={{padding:'0 4px',lineHeight:'32px'}}>/</span>
                <Form.Item name={["discharge_vitals","bp_diastolic"]} noStyle>
                  <InputNumber style={{width:90}} placeholder="Dia" min={20} max={200} />
                </Form.Item>
                <Form.Item name={["discharge_vitals","pulse"]} noStyle>
                  <InputNumber style={{width:90,marginLeft:8}} placeholder="Pulse" min={0} max={300} />
                </Form.Item>
                <Form.Item name={["discharge_vitals","temperature"]} noStyle>
                  <InputNumber style={{width:90,marginLeft:8}} placeholder="Temp°F" step={0.1} min={90} max={115} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="wound_status" label="Wound Status">
              <Input placeholder="Wound condition..." />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="catheter_status" label="Catheter Status">
              <Select
                placeholder="Select status"
                options={[
                  { label: 'Removed', value: 'Removed' },
                  { label: 'In Place', value: 'In Place' },
                  { label: 'Not Applicable', value: 'Not Applicable' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="iv_line_status" label="IV Line Status">
              <Select
                placeholder="Select status"
                options={[
                  { label: 'Removed', value: 'Removed' },
                  { label: 'In Place', value: 'In Place' },
                  { label: 'Not Applicable', value: 'Not Applicable' }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="nurse_remarks" label="Nursing Remarks">
          <Input.TextArea rows={3} placeholder="Additional nursing observations and remarks..." />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={dischargeMutation.isPending} size="large">
              Complete Discharge
            </Button>
            <Button onClick={() => navigate('/ipd')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default IPDDischarge;
