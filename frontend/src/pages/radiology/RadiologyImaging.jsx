import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Upload, DatePicker, Select } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { radiologyOrderService, radiologyImagingService, employeeService } from '@services';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const RadiologyImaging = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [technologists, setTechnologists] = useState([]);

  useEffect(() => {
    fetchOrder();
    fetchTechnologists();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await radiologyOrderService.getById(orderId);
      const orderData = response.data?.data || response.data;
      setOrder(orderData);
      form.setFieldsValue({ imaging_date: dayjs() });
    } catch (error) {
      message.error('Failed to fetch order details');
    }
  };

  const fetchTechnologists = async () => {
    try {
      const response = await employeeService.getAll();
      const employees = response.data?.data || response.data || [];
      setTechnologists(employees);
      const defaultId = user?.employee_id || user?.id;
      if (defaultId && employees.some(e => e.employee_id === defaultId)) {
        form.setFieldsValue({ technologist_id: defaultId });
      }
    } catch (error) {
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Convert images to base64
      const imagePromises = fileList.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(imagePromises);
      const imagesBlob = base64Images.join('|||'); // Separator for multiple images

      const imagingData = {
        rad_order_id: parseInt(orderId),
        imaging_date: values.imaging_date.format('YYYY-MM-DD HH:mm:ss'),
        technologist_id: values.technologist_id || user?.employee_id || user?.id || 1,
        images_path: imagesBlob,
        technical_notes: values.technical_notes,
        hospital_id: user?.hospital_id
      };

      await radiologyImagingService.create(imagingData);
      await radiologyOrderService.update(orderId, { status: 'In Progress' });
      
      message.success('Imaging captured successfully');
      navigate('/radiology');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save imaging data');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        message.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  return (
    <Card title="Radiology Imaging Capture">
      {order && (
        <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <p><strong>Patient:</strong> {order.patient?.first_name} {order.patient?.last_name} ({order.uhid})</p>
          <p><strong>Test:</strong> {order.test_name} - {order.modality}</p>
          <p><strong>Clinical Info:</strong> {order.clinical_info}</p>
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="imaging_date" label="Imaging Date" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="technologist_id" label="Technologist" rules={[{ required: true, message: 'Please select technologist' }]}>
          <Select
            placeholder="Select technologist"
            showSearch
            allowClear
            optionFilterProp="label"
            options={technologists.map(tech => ({
              value: tech.employee_id,
              label: `${tech.full_name} (${tech.emp_code}) - ${tech.role || 'Employee'}`
            }))}
          />
        </Form.Item>

        <Form.Item label="Upload Images">
          <Upload {...uploadProps} multiple accept="image/*,.dcm">
            <Button icon={<UploadOutlined />}>Select Images</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="technical_notes" label="Technical Notes">
          <Input.TextArea rows={4} placeholder="Enter technical observations, image quality, patient positioning, etc." />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Save & Complete Imaging
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default RadiologyImaging;
