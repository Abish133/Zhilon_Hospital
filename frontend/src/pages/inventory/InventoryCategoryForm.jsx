import { Form, Input, Select, Row, Col } from 'antd';
import FormModal from '@components/common/FormModal';
import InventoryCategoryService from '@services/InventoryCategoryService';
import { useApiMutation } from '@hooks/useApi';

const InventoryCategoryForm = ({ open, onCancel, onSuccess, initialData }) => {
  const mutation = useApiMutation(
    (data) => initialData 
      ? InventoryCategoryService.update(initialData.category_id, data) 
      : InventoryCategoryService.create(data),
    {
      successMessage: initialData ? 'Category updated successfully' : 'Category added successfully',
      invalidateKeys: ['inventory-categories'],
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
      width={600}
      loading={mutation.isPending}
      initialValues={formInitialValues}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item 
            name="category_name" 
            label="Category Name" 
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item 
            name="category_type" 
            label="Category Type" 
            rules={[{ required: true, message: 'Please select category type' }]}
          >
            <Select 
              placeholder="Select category type"
              options={[
                { label: 'Consumable', value: 'Consumable' }, 
                { label: 'Asset', value: 'Asset' }
              ]} 
            />
          </Form.Item>
        </Col>
      </Row>
    </FormModal>
  );
};

export default InventoryCategoryForm;