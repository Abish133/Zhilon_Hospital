import { Form, Input, Modal, Select, DatePicker } from 'antd';
import PatientMedicationHistoryService from '@services/PatientMedicationHistoryService';
import PatientService from '@services/PatientService';
import DoctorService from '@services/DoctorService';
import MedicineService from '@services/MedicineService';
import { useApiMutation, useApiQuery } from '@hooks/useApi';
import { useState } from 'react';

const PatientMedicationHistoryForm = ({ open, onCancel, onSuccess, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { data: patientsData } = useApiQuery(['patients'], () => PatientService.getAll());
  const { data: doctorsData } = useApiQuery(['doctors'], () => DoctorService.getAll());
  const { data: medicinesData } = useApiQuery(['medicines'], () => MedicineService.getAll());

  const mutation = useApiMutation(
    (data) => initialData
      ? PatientMedicationHistoryService.update(initialData.med_history_id, data)
      : PatientMedicationHistoryService.create(data),
    {
      successMessage: initialData ? 'Medication history updated' : 'Medication history added',
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
      title={initialData ? 'Edit Medication History' : 'Add Medication History'}
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
              { label: 'IPD', value: 'IPD' },
              { label: 'OT', value: 'OT' }
            ]}
          />
        </Form.Item>

        <Form.Item name="visit_id" label="Visit ID" rules={[{ required: true }]}>
          <Input placeholder="Enter visit ID" />
        </Form.Item>

        <Form.Item name="medicine_id" label="Medicine" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Select medicine"
            optionFilterProp="children"
            options={medicinesData?.data?.map(m => ({
              label: `${m.medicine_name} - ${m.strength}`,
              value: m.medicine_id
            })) || []}
          />
        </Form.Item>

        <Form.Item name="medicine_name" label="Medicine Name" rules={[{ required: true }]}>
          <Input placeholder="Enter medicine name" />
        </Form.Item>

        <Form.Item name="dosage" label="Dosage">
          <Input placeholder="e.g., 500mg, 1 tablet" />
        </Form.Item>

        <Form.Item name="frequency" label="Frequency">
          <Select
            placeholder="Select frequency"
            options={[
              { label: 'Once daily', value: 'Once daily' },
              { label: 'Twice daily', value: 'Twice daily' },
              { label: 'Three times daily', value: 'Three times daily' },
              { label: 'Four times daily', value: 'Four times daily' },
              { label: 'As needed', value: 'As needed' }
            ]}
          />
        </Form.Item>

        <Form.Item name="route" label="Route">
          <Select
            placeholder="Select route"
            options={[
              { label: 'Oral', value: 'Oral' },
              { label: 'IV', value: 'IV' },
              { label: 'IM', value: 'IM' },
              { label: 'Topical', value: 'Topical' },
              { label: 'Sublingual', value: 'Sublingual' }
            ]}
          />
        </Form.Item>

        <Form.Item name="duration" label="Duration">
          <Input placeholder="e.g., 7 days, 2 weeks" />
        </Form.Item>

        <Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="end_date" label="End Date">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select
            placeholder="Select status"
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Stopped', value: 'Stopped' }
            ]}
          />
        </Form.Item>

        <Form.Item name="prescribed_by" label="Prescribed By" rules={[{ required: true }]}>
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
      </Form>
    </Modal>
  );
};

export default PatientMedicationHistoryForm;