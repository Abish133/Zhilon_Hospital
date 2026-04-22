import { Card, Descriptions, Button, Space, Spin, message, Form, Input, Modal, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { PrinterOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { radiologyOrderService, radiologyReportService, doctorService } from '@services';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const RadiologyReport = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [report, setReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      const orderRes = await radiologyOrderService.getById(orderId);
      const orderData = orderRes.data?.data || orderRes.data;
      setOrder(orderData);
      
      try {
        const reportRes = await radiologyReportService.getByOrderId(orderId);
        const reportData = reportRes.data?.data || reportRes.data;
        setReport(Array.isArray(reportData) ? reportData[0] : reportData);
      } catch (err) {
        setReport(null);
      }
    } catch (error) {
      message.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const response = await doctorService.getAll();
      const doctorsList = response.data?.data || response.data || [];
      setDoctors(doctorsList);
      form.setFieldsValue({ reported_by: user?.id });
      setModalOpen(true);
    } catch (error) {
      form.resetFields();
      setModalOpen(true);
    }
  };

  const handleSubmitReport = async () => {
    try {
      const values = await form.validateFields();
      const reportData = {
        rad_order_id: parseInt(orderId),
        findings: values.findings,
        impression: values.impression,
        reported_by: values.reported_by,
        reported_at: new Date().toISOString(),
        hospital_id: user?.hospital_id
      };

      await radiologyReportService.create(reportData);
      await radiologyOrderService.update(orderId, { status: 'Reported' });
      
      message.success('Report created successfully');
      form.resetFields();
      setModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Failed to create report');
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <Card 
        title={`Radiology Report - Order #${orderId}`}
        extra={
          <Space>
            {!report && order?.status === 'Completed' && (
              <Button icon={<EditOutlined />} type="primary" onClick={handleCreateReport}>Create Report</Button>
            )}
            {report && (
              <>
                <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
                <Button icon={<DownloadOutlined />} type="primary">Download</Button>
              </>
            )}
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Patient Name">{order?.patient?.first_name} {order?.patient?.last_name}</Descriptions.Item>
          <Descriptions.Item label="UHID">{order?.uhid}</Descriptions.Item>
          <Descriptions.Item label="Test Name">{order?.test_name}</Descriptions.Item>
          <Descriptions.Item label="Modality">{order?.modality}</Descriptions.Item>
          <Descriptions.Item label="Order Date">{dayjs(order?.order_date).format('DD/MM/YYYY')}</Descriptions.Item>
          <Descriptions.Item label="Report Date">{report?.reported_at ? dayjs(report.reported_at).format('DD/MM/YYYY') : 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Radiologist">
            {report?.radiologist_name || 
             (report?.reportedBy?.name) || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">{order?.status}</Descriptions.Item>
          <Descriptions.Item label="Findings" span={2}>
            {report?.findings || 'No findings recorded'}
          </Descriptions.Item>
          <Descriptions.Item label="Impression" span={2}>
            {report?.impression || 'No impression recorded'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Button onClick={() => navigate('/radiology')} style={{ marginTop: 16 }}>Back to Orders</Button>

      <Modal
        title="Create Radiology Report"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSubmitReport}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="reported_by" label="Radiologist" rules={[{ required: true, message: 'Please select radiologist' }]}>
            <Select placeholder="Select radiologist" showSearch optionFilterProp="children">
              {doctors.map(doc => (
                <Select.Option key={doc.id} value={doc.id}>
                  Dr. {doc.name} - {doc.specialization}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="findings" label="Findings" rules={[{ required: true, message: 'Please enter findings' }]}>
            <Input.TextArea rows={6} placeholder="Enter detailed findings..." />
          </Form.Item>
          <Form.Item name="impression" label="Impression" rules={[{ required: true, message: 'Please enter impression' }]}>
            <Input.TextArea rows={4} placeholder="Enter clinical impression..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RadiologyReport;
