import { Form, Input, Modal, Select } from 'antd';
import FormModal from '@components/common/FormModal';
import PatientMedicalHistoryService from '@services/PatientMedicalHistoryService';
import PatientService from '@services/PatientService';
import { useApiMutation, useApiQuery } from '@hooks/useApi';
import AuthService from '@/services/AuthService';
import { useState } from 'react';

const PatientMedicalHistoryForm = ({ open, onCancel, onSuccess, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Get hospital_id from logged in user
  const currentUser = AuthService.getCurrentUser();
  const hospitalId = currentUser?.hospital_id;

  const { data: patientsData } = useApiQuery(['patients'], () => PatientService.getAll());

  const mutation = useApiMutation(
    (data) => initialData
      ? PatientMedicalHistoryService.update(initialData.history_id, data)
      : PatientMedicalHistoryService.create(data),
    {
      successMessage: initialData ? 'Medical history updated' : 'Medical history added',
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
      title={initialData ? 'Edit Medical History' : 'Add Medical History'}
      width={700}
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
        <Form.Item name="allergies" label="Allergies">
          <Input.TextArea rows={2} placeholder="Drug/food allergies" />
        </Form.Item>
        <Form.Item name="chronic_diseases" label="Chronic Diseases">
          <Input.TextArea rows={2} placeholder="Diabetes, Hypertension, etc." />
        </Form.Item>
        <Form.Item name="past_surgeries" label="Past Surgeries">
          <Input.TextArea rows={2} placeholder="Previous surgical history" />
        </Form.Item>
        <Form.Item name="family_history" label="Family History">
          <Input.TextArea rows={2} placeholder="Family medical conditions" />
        </Form.Item>
        <Form.Item name="social_history" label="Social History">
          <Input.TextArea rows={2} placeholder="Smoking, alcohol, lifestyle" />
        </Form.Item>
        <Form.Item name="immunization_history" label="Immunization History">
          <Input.TextArea rows={2} placeholder="Smoking, alcohol, lifestyle" />
        </Form.Item>
        <Form.Item name="blood_transfusion_history" label="Blood Transfusin History">
          <Input.TextArea rows={2} placeholder="Smoking, alcohol, lifestyle" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PatientMedicalHistoryForm;
