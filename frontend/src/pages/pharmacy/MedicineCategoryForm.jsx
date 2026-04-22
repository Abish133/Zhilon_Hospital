import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import FormModal from '@components/common/FormModal';
import MedicineCategoryService from '@/services/MedicineCategoryService';
import { useApiMutation } from '@hooks/useApi';
// import { MEDICINE_CATEGORIES, DOSAGE_FORMS, DRUG_SCHEDULES } from '@utils/constants';
 
const MedicineCategoryForm = ({ open, onCancel, onSuccess, initialData }) => {
  const mutation = useApiMutation(
    (data) => initialData ? MedicineCategoryService.update(initialData.category_id, data) : MedicineCategoryService.register(data),
    {
      successMessage: initialData ? 'Category updated successfully' : 'Category registered successfully',
      invalidateKeys: ['medicine-category'],
      onSuccess
    }
  );
 
  const handleSubmit = (values) => {
    mutation.mutate(values);
  };
 
  const formInitialValues = initialData || {};
 
  return (
    <FormModal
      open={open}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      title={initialData ? 'Edit Category' : 'Add New Category'}
      width={800}
      loading={mutation.isPending}
      initialValues={formInitialValues}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="category_name" label="Category Name" rules={[{ required: true }]}>
            <Input placeholder="cateory" />
          </Form.Item>
        </Col>
        </Row>
        <Row>
        <Col span={12}>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input placeholder="description" />
          </Form.Item>
        </Col>
      </Row>
     
    </FormModal>
  );
};
 
export default MedicineCategoryForm;
 
 