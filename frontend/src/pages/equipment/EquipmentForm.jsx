import { Form, Input, Select, DatePicker, Row, Col, InputNumber } from 'antd';
import FormModal from '@components/common/FormModal';
import EquipmentService from '@services/EquipmentService';
import DepartmentService from '@services/DepartmentService';
import { useApiMutation, useApiQuery } from '@hooks/useApi';
import dayjs from 'dayjs';

const EquipmentForm = ({ open, onCancel, onSuccess, initialData }) => {
  const { data: departments } = useApiQuery(['departments'], () => DepartmentService.getAll());

  const mutation = useApiMutation(
    (data) => initialData ? EquipmentService.update(initialData.equipment_id, data) : EquipmentService.create(data),
    {
      successMessage: initialData ? 'Equipment updated successfully' : 'Equipment created successfully',
      invalidateKeys: ['equipment'],
      onSuccess
    }
  );

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      purchase_date: values.purchase_date?.format('YYYY-MM-DD'),
      warranty_start: values.warranty_start?.format('YYYY-MM-DD'),
      warranty_end: values.warranty_end?.format('YYYY-MM-DD'),
      amc_start: values.amc_start?.format('YYYY-MM-DD'),
      amc_end: values.amc_end?.format('YYYY-MM-DD')
    };
    mutation.mutate(payload);
  };

  const formInitialValues = initialData ? {
    ...initialData,
    purchase_date: initialData.purchase_date ? dayjs(initialData.purchase_date) : null,
    warranty_start: initialData.warranty_start ? dayjs(initialData.warranty_start) : null,
    warranty_end: initialData.warranty_end ? dayjs(initialData.warranty_end) : null,
    amc_start: initialData.amc_start ? dayjs(initialData.amc_start) : null,
    amc_end: initialData.amc_end ? dayjs(initialData.amc_end) : null
  } : {};

  return (
    <FormModal
      open={open}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      title={initialData ? 'Edit Equipment' : 'Add New Equipment'}
      width={800}
      loading={mutation.isPending}
      initialValues={formInitialValues}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="equipment_name" label="Equipment Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="equipment_code" label="Equipment Code">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="serial_number" label="Serial Number">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="equipment_type" label="Equipment Type">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="manufacturer" label="Manufacturer">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="model_number" label="Model Number">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="department_id" label="Department">
            <Select
              options={departments?.data?.map(dept => ({ 
                label: dept.department_name, 
                value: dept.id 
              }))}
              placeholder="Select Department"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Under Maintenance', value: 'Under Maintenance' },
                { label: 'Condemned', value: 'Condemned' },
                { label: 'Disposed', value: 'Disposed' }
              ]}
              defaultValue="Active"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="purchase_date" label="Purchase Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="purchase_cost" label="Purchase Cost">
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="warranty_start" label="Warranty Start">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="warranty_end" label="Warranty End">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="amc_start" label="AMC Start">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="amc_end" label="AMC End">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="amc_vendor" label="AMC Vendor">
        <Input />
      </Form.Item>
    </FormModal>
  );
};

export default EquipmentForm;