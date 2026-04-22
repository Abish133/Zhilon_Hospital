import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Row, Col, Divider, Space, Select, InputNumber, DatePicker, Alert, Modal } from 'antd';
import { FileTextOutlined, MedicineBoxOutlined, ExperimentOutlined, CameraOutlined, PlusOutlined, MinusCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import {
  opdConsultationService,
  opdPrescriptionService,
  opdVisitService,
  opdVitalService,
  labOrderService,
  labOrderDetailService,
  radiologyOrderService,
  medicineService,
  labTestService,
  radiologyTestService
} from '@/services';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const { TextArea } = Input;

const OPDConsultation = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [radiologyTests, setRadiologyTests] = useState([]);
  const [existingConsultation, setExistingConsultation] = useState(null);
  const [savedConsultation, setSavedConsultation] = useState(null);
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (visitId) {
      fetchVisit();
      fetchVitals();
      fetchMedicines();
      fetchLabTests();
      fetchRadiologyTests();
      fetchExistingConsultation();
    }
  }, [visitId]);

  const fetchVisit = async () => {
    try {
      const response = await opdVisitService.getById(visitId);
      if (response.success) setVisit(response.data);
    } catch (error) {
      message.error('Failed to fetch visit details');
    }
  };

  const fetchVitals = async () => {
    try {
      const response = await opdVitalService.getAll({ visit_id: visitId });
      if (response.success && response.data?.length > 0) {
        setVitals(response.data[0]);
      }
    } catch {
      // vitals not found is fine
    }
  };

  const fetchExistingConsultation = async () => {
    try {
      const response = await opdConsultationService.getAll({ visit_id: visitId });
      if (response.success && response.data?.length > 0) {
        const existing = response.data[0];
        setExistingConsultation(existing);
        form.setFieldsValue({
          chief_complaints: existing.chief_complaints,
          clinical_notes: existing.clinical_notes,
          examination_findings: existing.examination_findings,
          diagnosis_code: existing.diagnosis_code,
          diagnosis_description: existing.diagnosis_description,
          treatment_plan: existing.treatment_plan,
          follow_up_instructions: existing.follow_up_instructions,
          follow_up_date: existing.follow_up_date ? dayjs(existing.follow_up_date) : null,
        });
      }
    } catch {
      // no existing consultation is normal
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await medicineService.getAll();
      if (response.success) setMedicines(response.data || []);
    } catch { /* silent */ }
  };

  const fetchLabTests = async () => {
    try {
      const response = await labTestService.getAll();
      if (response.success) setLabTests(response.data || []);
    } catch { /* silent */ }
  };

  const fetchRadiologyTests = async () => {
    try {
      const response = await radiologyTestService.getAll();
      if (response.success) setRadiologyTests(response.data || []);
    } catch { /* silent */ }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const doctorId = user?.doctor_id || visit?.doctor_id;

      // 1. Save / Update Consultation
      let consultationId;
      if (existingConsultation) {
        const consultRes = await opdConsultationService.update(existingConsultation.consultation_id, {
          chief_complaints: values.chief_complaints,
          clinical_notes: values.clinical_notes,
          examination_findings: values.examination_findings,
          diagnosis_code: values.diagnosis_code,
          diagnosis_description: values.diagnosis_description,
          treatment_plan: values.treatment_plan,
          follow_up_date: values.follow_up_date?.format('YYYY-MM-DD'),
          follow_up_instructions: values.follow_up_instructions,
        });
        consultationId = existingConsultation.consultation_id;
        if (!consultRes.success) throw new Error('Failed to update consultation');
      } else {
        const consultRes = await opdConsultationService.create({
          visit_id: parseInt(visitId),
          patient_id: visit.patient_id,
          doctor_id: doctorId,
          chief_complaints: values.chief_complaints,
          clinical_notes: values.clinical_notes,
          examination_findings: values.examination_findings,
          diagnosis_code: values.diagnosis_code,
          diagnosis_description: values.diagnosis_description,
          treatment_plan: values.treatment_plan,
          follow_up_date: values.follow_up_date?.format('YYYY-MM-DD'),
          follow_up_instructions: values.follow_up_instructions,
          consultation_date: new Date()
        });
        if (!consultRes.success) throw new Error('Failed to save consultation');
        consultationId = consultRes.data.consultation_id;
      }

      // 2. Save Prescriptions
      if (values.prescriptions?.length > 0) {
        for (const prescription of values.prescriptions) {
          const medicine = medicines.find(m => m.medicine_id === prescription.medicine_id);
          await opdPrescriptionService.create({
            consultation_id: consultationId,
            visit_id: parseInt(visitId),
            patient_id: visit.patient_id,
            medicine_id: prescription.medicine_id,
            medicine_name: medicine?.medicine_name,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            route: prescription.route || 'Oral',
            duration: prescription.duration,
            quantity: prescription.quantity,
            instructions: prescription.instructions,
            prescribed_by: doctorId,
            prescribed_at: new Date()
          });
        }
      }

      // 3. Save Lab Orders
      if (values.lab_tests?.length > 0) {
        const labOrderRes = await labOrderService.create({
          patient_id: visit.patient_id,
          uhid: visit.uhid,
          visit_type: 'OPD',
          visit_id: parseInt(visitId),
          ordered_by: doctorId,
          order_date: new Date(),
          status: 'Ordered',
          hospital_id: user?.hospital_id
        });
        if (labOrderRes.success) {
          const orderId = labOrderRes.data.order_id;
          for (const testId of values.lab_tests) {
            const test = labTests.find(t => t.test_id === testId);
            await labOrderDetailService.create({
              order_id: orderId,
              test_id: testId,
              test_code: test?.test_code,
              test_name: test?.test_name,
              sample_type: test?.sample_type,
              charge: test?.price,
              status: 'Pending',
              hospital_id: user?.hospital_id
            });
          }
        }
      }

      // 4. Save Radiology Orders
      if (values.radiology_tests?.length > 0) {
        for (const radTestId of values.radiology_tests) {
          const test = radiologyTests.find(t => t.rad_test_id === radTestId);
          await radiologyOrderService.create({
            patient_id: visit.patient_id,
            uhid: visit.uhid,
            visit_type: 'OPD',
            visit_id: parseInt(visitId),
            rad_test_id: radTestId,
            test_name: test?.test_name,
            modality: test?.modality,
            clinical_info: values.clinical_notes,
            ordered_by: doctorId,
            order_date: new Date(),
            status: 'Ordered',
            hospital_id: user?.hospital_id
          });
        }
      }

      // 5. Update Visit Status
      await opdVisitService.update(visitId, { status: 'Completed' });

      message.success('Consultation saved successfully!');
      setSavedConsultation({
        ...values,
        consultation_id: consultationId,
        patient_name: `${visit.patient?.first_name || ''} ${visit.patient?.last_name || ''}`,
        uhid: visit.uhid,
        visit_date: visit.visit_date,
        billing_episode_id: visit.billing_episode_id,
      });
    } catch (error) {
      message.error('Failed to save consultation: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPrescription = () => {
    if (!savedConsultation) return;
    const prescriptions = savedConsultation.prescriptions || [];
    const printContent = `
      <html><head><title>Prescription</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 13px; }
        h2 { text-align: center; margin-bottom: 4px; }
        .info { display: flex; gap: 40px; margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
        th { background: #f0f0f0; }
        .footer { margin-top: 40px; text-align: right; }
        .rx { font-size: 20px; font-weight: bold; margin: 12px 0 4px; }
      </style></head><body>
      <h2>Prescription</h2>
      <div class="info">
        <div><b>Patient:</b> ${savedConsultation.patient_name}</div>
        <div><b>UHID:</b> ${savedConsultation.uhid}</div>
        <div><b>Date:</b> ${dayjs().format('DD-MM-YYYY')}</div>
      </div>
      <div><b>Diagnosis:</b> ${savedConsultation.diagnosis_description || savedConsultation.diagnosis_code || '-'}</div>
      <div class="rx">℞</div>
      ${prescriptions.length > 0 ? `
      <table>
        <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
        <tbody>
          ${prescriptions.map((p, i) => {
            const med = medicines.find(m => m.medicine_id === p.medicine_id);
            return `<tr><td>${i + 1}</td><td>${med?.medicine_name || '-'}</td><td>${p.dosage || '-'}</td><td>${p.frequency || '-'}</td><td>${p.duration || '-'}</td><td>${p.instructions || '-'}</td></tr>`;
          }).join('')}
        </tbody>
      </table>` : '<p>No prescriptions</p>'}
      ${savedConsultation.follow_up_date ? `<div style="margin-top:12px"><b>Follow-up Date:</b> ${dayjs(savedConsultation.follow_up_date).format('DD-MM-YYYY')}</div>` : ''}
      ${savedConsultation.follow_up_instructions ? `<div><b>Instructions:</b> ${savedConsultation.follow_up_instructions}</div>` : ''}
      <div class="footer"><p>____________________________</p><p>Doctor Signature</p></div>
      </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.print();
  };

  // Show post-save state
  if (savedConsultation) {
    return (
      <Card>
        <Alert message="Consultation Saved Successfully!" type="success" showIcon style={{ marginBottom: 16 }} />
        <Space wrap>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrintPrescription}>
            Print Prescription
          </Button>
          {savedConsultation.billing_episode_id && (
            <Button
              type="default"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/billing/generate/${savedConsultation.billing_episode_id}`)}
              style={{ borderColor: '#52c41a', color: '#52c41a' }}
            >
              Proceed to Billing
            </Button>
          )}
          <Button onClick={() => navigate('/opd/queue')}>Back to Queue</Button>
          <Button onClick={() => navigate('/opd')}>OPD Dashboard</Button>
        </Space>
      </Card>
    );
  }

  return (
    <Card title={<Space><FileTextOutlined style={{ fontSize: 22, color: '#1890ff' }} /><span>OPD Consultation {existingConsultation ? '(Editing)' : ''}</span></Space>}>
      {existingConsultation && (
        <Alert message="An existing consultation was found for this visit. You are editing it." type="info" showIcon style={{ marginBottom: 12 }} />
      )}
      {visit && (
        <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
          <Row gutter={16}>
            <Col span={6}><strong>Patient:</strong> {visit.patient?.first_name} {visit.patient?.last_name}</Col>
            <Col span={6}><strong>UHID:</strong> {visit.uhid}</Col>
            <Col span={6}><strong>Token:</strong> #{visit.token_number}</Col>
            <Col span={6}><strong>Visit Type:</strong> {visit.visit_type}</Col>
          </Row>
        </Card>
      )}

      {vitals && (
        <Card size="small" title="Vitals" style={{ marginBottom: 16, background: '#fff7e6', borderColor: '#ffa940' }}>
          <Row gutter={[16, 8]}>
            <Col span={4}><strong>BP:</strong> {vitals.bp_systolic}/{vitals.bp_diastolic} mmHg</Col>
            <Col span={4}><strong>Pulse:</strong> {vitals.pulse_rate} bpm</Col>
            <Col span={4}><strong>Temp:</strong> {vitals.temperature}°F</Col>
            <Col span={4}><strong>SpO2:</strong> {vitals.spo2}%</Col>
            <Col span={4}><strong>Weight:</strong> {vitals.weight} kg</Col>
            <Col span={4}><strong>BMI:</strong> {vitals.bmi || '-'}</Col>
          </Row>
        </Card>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card title={<><FileTextOutlined /> Consultation Details</>} style={{ marginBottom: 16 }} size="small">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="chief_complaints" label="Chief Complaints" rules={[{ required: true, message: 'Please enter chief complaints' }]}>
                <TextArea rows={2} placeholder="Patient's main complaints" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clinical_notes" label="Clinical Notes" rules={[{ required: true, message: 'Please enter clinical notes' }]}>
                <TextArea rows={3} placeholder="Examination findings and observations" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="examination_findings" label="Examination Findings">
                <TextArea rows={3} placeholder="Physical examination findings" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="diagnosis_code" label="Diagnosis Code (ICD-10)">
                <Input placeholder="e.g., A90" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="diagnosis_description" label="Diagnosis Description">
                <Input placeholder="Diagnosis in plain text" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="treatment_plan" label="Treatment Plan" rules={[{ required: true, message: 'Please enter treatment plan' }]}>
                <TextArea rows={3} placeholder="Recommended treatment" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="follow_up_instructions" label="Follow-up Instructions">
                <TextArea rows={3} placeholder="Instructions for patient" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="follow_up_date" label="Follow-up Date">
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs(), 'day')} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title={<><MedicineBoxOutlined /> Prescriptions</>} style={{ marginBottom: 16 }} size="small">
          <Form.List name="prescriptions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ marginBottom: 8, background: '#fafafa' }}>
                    <Row gutter={8}>
                      <Col span={6}>
                        <Form.Item {...field} name={[field.name, 'medicine_id']} label="Medicine" rules={[{ required: true, message: 'Select medicine' }]}>
                          <Select showSearch placeholder="Select medicine" filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                            {medicines.map(med => <Select.Option key={med.medicine_id} value={med.medicine_id}>{med.medicine_name}</Select.Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...field} name={[field.name, 'dosage']} label="Dosage" rules={[{ required: true }]}>
                          <Input placeholder="500mg" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...field} name={[field.name, 'frequency']} label="Frequency" rules={[{ required: true }]}>
                          <Input placeholder="3 times/day" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item {...field} name={[field.name, 'duration']} label="Duration" rules={[{ required: true }]}>
                          <Input placeholder="5 days" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item {...field} name={[field.name, 'quantity']} label="Qty" rules={[{ required: true }]}>
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item {...field} name={[field.name, 'route']} label="Route" initialValue="Oral">
                          <Select>
                            <Select.Option value="Oral">Oral</Select.Option>
                            <Select.Option value="IV">IV</Select.Option>
                            <Select.Option value="IM">IM</Select.Option>
                            <Select.Option value="Topical">Topical</Select.Option>
                            <Select.Option value="Inhalation">Inhalation</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={1}>
                        <Form.Item label=" ">
                          <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Form.Item {...field} name={[field.name, 'instructions']} label="Instructions">
                          <Input placeholder="After meals" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Medicine</Button>
              </>
            )}
          </Form.List>
        </Card>

        <Card title={<><ExperimentOutlined /> Lab Orders</>} style={{ marginBottom: 16 }} size="small">
          <Form.Item name="lab_tests" label="Select Lab Tests">
            <Select mode="multiple" placeholder="Select lab tests" showSearch optionFilterProp="label"
              options={labTests.map(t => ({ label: `${t.test_name} - ₹${t.charge || 0}`, value: t.test_id, key: t.test_id }))} />
          </Form.Item>
        </Card>

        <Card title={<><CameraOutlined /> Radiology Orders</>} style={{ marginBottom: 16 }} size="small">
          <Form.Item name="radiology_tests" label="Select Radiology Tests">
            <Select mode="multiple" placeholder="Select radiology tests" showSearch optionFilterProp="label"
              options={radiologyTests.map(t => ({ label: `${t.test_name} - ${t.modality} - ₹${t.charge || 0}`, value: t.rad_test_id, key: t.rad_test_id }))} />
          </Form.Item>
        </Card>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" size="large" loading={loading} icon={<FileTextOutlined />}>
              {existingConsultation ? 'Update Consultation' : 'Save Consultation'}
            </Button>
            <Button size="large" onClick={() => navigate('/opd')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OPDConsultation;
