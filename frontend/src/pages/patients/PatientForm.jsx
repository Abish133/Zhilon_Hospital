import { Form, Input, Select, DatePicker, Row, Col, Tag } from 'antd';
import FormModal from '@components/common/FormModal';
import PatientService from '@services/PatientService';
import { useApiMutation } from '@hooks/useApi';
import { GENDER_OPTIONS, BLOOD_GROUPS, MARITAL_STATUS_OPTIONS } from '@utils/constants';
import dayjs from 'dayjs';

const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = dayjs(dob);
  if (!birth.isValid()) return null;
  return dayjs().diff(birth, 'year');
};

const PatientForm = ({ open, onCancel, onSuccess, initialData }) => {
  const [form] = Form.useForm();

  const mutation = useApiMutation(
    (data) => initialData ? PatientService.update(initialData.uhid, data) : PatientService.register(data),
    {
      successMessage: initialData ? 'Patient updated successfully' : 'Patient registered successfully',
      invalidateKeys: ['patients'],
      onSuccess
    }
  );

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      date_of_birth: values.date_of_birth?.format('YYYY-MM-DD'),
      age: calculateAge(values.date_of_birth)
    };
    // Remove empty UHID so backend auto-generates
    if (!payload.uhid) delete payload.uhid;
    mutation.mutate(payload);
  };

  const handleDobChange = (dob) => {
    const age = calculateAge(dob);
    form.setFieldValue('age', age);
  };

  const formInitialValues = initialData ? {
    ...initialData,
    date_of_birth: initialData.date_of_birth ? dayjs(initialData.date_of_birth) : null,
    age: initialData.date_of_birth ? calculateAge(initialData.date_of_birth) : initialData.age
  } : {};

  return (
    <FormModal
      open={open}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      title={initialData ? 'Edit Patient' : 'Register New Patient'}
      width={800}
      loading={mutation.isPending}
      initialValues={formInitialValues}
      form={form}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        {initialData && (
          <Col span={8}>
            <Form.Item
              name="uhid"
              label="UHID"
            >
              <Input disabled />
            </Form.Item>
          </Col>
        )}
        <Col span={initialData ? 8 : 12}>
          <Form.Item name="age" label="Age">
            <Input disabled placeholder="Auto from DOB" />
          </Form.Item>
        </Col>
        <Col span={initialData ? 8 : 12}>
          <Form.Item name="marital_status" label="Marital Status">
            <Select options={MARITAL_STATUS_OPTIONS} allowClear placeholder="Select status" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select options={GENDER_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="date_of_birth" label="Date of Birth" rules={[{ required: true }]}>
            <DatePicker
              style={{ width: '100%' }}
              onChange={handleDobChange}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="blood_group" label="Blood Group">
            <Select options={BLOOD_GROUPS.map(bg => ({ label: bg, value: bg }))} allowClear />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="mobile_number" label="Mobile" rules={[{ required: true, pattern: /^[6-9]\d{9}$/, message: 'Invalid mobile number' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="alternate_mobile"
            label="Alternate Mobile"
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  return /^[6-9]\d{9}$/.test(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('Invalid mobile number'));
                }
              })
            ]}
          >
            <Input placeholder="Optional" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="city" label="City" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="state" label="State" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="pincode" label="PinCode" rules={[{ pattern: /^[0-9]{6}$/, message: 'Invalid pincode' }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="insurance_status" label="Insurance Status">
            <Select options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="insurance_provider" label="Insurance Provider">
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="policy_number" label="Policy Number">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="aadhaar_number"
            label="Aadhaar Number"
            rules={[{ pattern: /^[0-9]{12}$/, message: 'Aadhaar must be 12 digits' }]}
          >
            <Input maxLength={12} placeholder="12-digit Aadhaar" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="abha_id"
            label="ABHA ID"
            rules={[{ pattern: /^[0-9\-]{14,17}$/, message: 'Invalid ABHA ID' }]}
          >
            <Input placeholder="xx-xxxx-xxxx-xxxx" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="abha_address" label="ABHA Address">
            <Input placeholder="username@abdm" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="address_line1" label="Address Line 1">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item name="address_line2" label="Address Line 2">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="emergency_contact_name" label="Emergency Contact Name">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="emergency_contact_number"
            label="Emergency Contact Number"
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  return /^[6-9]\d{9}$/.test(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('Invalid mobile number'));
                }
              })
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </FormModal>
  );
};

export default PatientForm;
