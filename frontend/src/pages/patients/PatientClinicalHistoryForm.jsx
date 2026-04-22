import { Form, Input, Modal, Select, DatePicker } from 'antd';
import PatientClinicalHistoryService from '@services/PatientClinicalHistoryService';
import PatientService from '@services/PatientService';
import DoctorService from '@services/DoctorService';
import DepartmentService from '@services/DepartmentService';
import { useApiMutation, useApiQuery } from '@hooks/useApi';
import { useState } from 'react';

const PatientClinicalHistoryForm = ({ open, onCancel, onSuccess, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { data: patientsData } = useApiQuery(['patients'], () => PatientService.getAll());
  const { data: doctorsData } = useApiQuery(['doctors'], () => DoctorService.getAll());
  const { data: departmentsData } = useApiQuery(['departments'], () => DepartmentService.getAll());

  const mutation = useApiMutation(
    (data) => initialData
      ? PatientClinicalHistoryService.update(initialData.clinical_history_id, data)
      : PatientClinicalHistoryService.create(data),
    {
      successMessage: initialData ? 'Clinical history updated' : 'Clinical history added',
      onSuccess: () => {
        form.resetFields();
        onSuccess?.();
      }
    }
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      mutation.mutate(values);
    } catch (error) {
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      title={initialData ? 'Edit Clinical History' : 'Add Clinical History'}
      width={800}
      confirmLoading={mutation.isPending || loading}
    >
      <Form form={form} layout="vertical" initialValues={initialData || {}}>
        <Form.Item name="patient_id" label="Patient" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Select patient"
            optionFilterProp="children"
            options={patientsData?.data?.map(p => ({
              label: `${p.first_name} ${p.last_name} (${p.uhid})`,
              value: p.patient_id
            })) || []}
          />
        </Form.Item>
        
        <Form.Item name="visit_type" label="Visit Type" rules={[{ required: true }]}>
          <Select
            placeholder="Select visit type"
            options={[
              { label: 'OPD', value: 'OPD' },
              { label: 'IPD', value: 'IPD' }
            ]}
          />
        </Form.Item>

        <Form.Item name="visit_id" label="Visit ID" rules={[{ required: true }]}>
          <Input placeholder="Enter visit ID" />
        </Form.Item>

        <Form.Item name="visit_date" label="Visit Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="doctor_id" label="Doctor" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Select doctor"
            optionFilterProp="children"
            options={doctorsData?.data?.map(d => ({
              label: `${d.name} - ${d.specialization}`,
              value: d.id
            })) || []}
          />
        </Form.Item>

        <Form.Item name="department_id" label="Department" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Select department"
            optionFilterProp="children"
            options={departmentsData?.data?.map(d => ({
              label: d.department_name,
              value: d.id
            })) || []}
          />
        </Form.Item>

        <Form.Item name="chief_complaints" label="Chief Complaints">
          <Input.TextArea rows={3} placeholder="Patient's main complaints..." />
        </Form.Item>

        <Form.Item name="diagnosis" label="Diagnosis">
          <Input.TextArea rows={3} placeholder="Clinical diagnosis..." />
        </Form.Item>

        <Form.Item name="clinical_notes" label="Clinical Notes">
          <Input.TextArea rows={4} placeholder="Additional clinical observations and notes..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PatientClinicalHistoryForm;