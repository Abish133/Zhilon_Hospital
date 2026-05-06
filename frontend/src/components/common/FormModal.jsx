import { Drawer, Form, Button, Space } from 'antd';
import { useEffect, useRef } from 'react';

const FormModal = ({
  open,
  onCancel,
  onSubmit,
  title,
  children,
  initialValues,
  width = '50%',
  loading = false,
  okText = 'Submit',
  cancelText = 'Cancel',
  form: externalForm
}) => {
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      }
      wasOpen.current = true;
    } else if (wasOpen.current) {
      form.resetFields();
      wasOpen.current = false;
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
    }
  };

  return (
    <Drawer
      open={open}
      title={title}
      onClose={onCancel}
      placement="right"
      width={width}
      destroyOnHidden={false}
      forceRender
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>{cancelText}</Button>
            <Button type="primary" onClick={handleOk} loading={loading}>
              {okText}
            </Button>
          </Space>
        </div>
      }
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Form form={form} layout="vertical" initialValues={initialValues}>
          {children}
        </Form>
      </div>
    </Drawer>
  );
};

export default FormModal;
