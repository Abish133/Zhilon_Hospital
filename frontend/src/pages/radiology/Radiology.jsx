import { useState } from 'react';
import { Space, Button, Tag, Card, Row, Col, Statistic, message, Form, Input, Select, Spin } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { EyeOutlined, CameraOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { ViewDetailsModal } from '@components/common/ActionModals';
import { useApiQuery } from '@hooks/useApi';
import RadiologyOrderService from '@services/RadiologyOrderService';
import PatientService from '@services/PatientService';
import RadiologyTestService from '@services/RadiologyTestService';
import { formatDate } from '@utils/helpers';

const Radiology = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderForm] = Form.useForm();
  const [reportForm] = Form.useForm();

  const { data, isLoading } = useApiQuery(['radiology-orders', searchQuery], () => 
    RadiologyOrderService.getAll({ search: searchQuery })
  );
  const { data: patientsData } = useApiQuery('patients', () => PatientService.getAll());
  const { data: testsData } = useApiQuery('radiology-tests', () => RadiologyTestService.getAll());

  const columns = [
    { title: 'Order ID', dataIndex: 'order_id', key: 'order_id', render: (id) => <Tag color="purple">#{id}</Tag> },
    { title: 'UHID', dataIndex: 'uhid', key: 'uhid' },
    { title: 'Patient', dataIndex: 'patient_name', key: 'patient_name', render: (name) => <div style={{ fontWeight: 500 }}>{name}</div> },
    { title: 'Test', dataIndex: 'test_name', key: 'test_name' },
    { title: 'Modality', dataIndex: 'modality', key: 'modality', render: (m) => <Tag color="blue">{m}</Tag> },
    { title: 'Order Date', dataIndex: 'order_date', key: 'order_date', render: (date) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Completed' ? 'green' : 'orange'}>{s}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedOrder(record); setViewModalOpen(true); }}>View</Button>
          {record.status === 'Pending' && (
            <Button size="small" type="primary" onClick={() => { setSelectedOrder(record); setReportModalOpen(true); }}>Report</Button>
          )}
        </Space>
      )
    }
  ];

  const handleCreateOrder = async () => {
    const values = await orderForm.validateFields();
    message.success('Radiology order created successfully');
    setOrderModalOpen(false);
    orderForm.resetFields();
  };

  const handleSubmitReport = async () => {
    const values = await reportForm.validateFields();
    message.success('Report submitted successfully');
    setReportModalOpen(false);
    reportForm.resetFields();
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Orders" value={25} prefix={<CameraOutlined />} styles={{ content: { color: '#0a0a0a' } }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pending" value={8} prefix={<ClockCircleOutlined />} styles={{ content: { color: '#f59e0b' } }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Completed" value={17} prefix={<CheckCircleOutlined />} styles={{ content: { color: '#10b981' } }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Today" value={5} styles={{ content: { color: '#3b82f6' } }} /></Card></Col>
      </Row>

      <Card>
        <SearchBar placeholder="Search by UHID or Patient" onSearch={setSearchQuery} onAdd={() => setOrderModalOpen(true)} addButtonText="Create Order" />
        <DataTable columns={columns} dataSource={data?.data || []} loading={isLoading} rowKey="order_id" />
      </Card>

      <SliderModal open={orderModalOpen} onCancel={() => setOrderModalOpen(false)} onOk={handleCreateOrder} title="Create Radiology Order">
        <Form form={orderForm} layout="vertical">
          <Form.Item name="patient_uhid" label="Patient" rules={[{ required: true }]}>
            <Select showSearch options={(patientsData?.data || []).map(p => ({ label: `${p.uhid} - ${p.first_name} ${p.last_name}`, value: p.uhid }))} />
          </Form.Item>
          <Form.Item name="test_name" label="Test" rules={[{ required: true }]}>
            <Select options={(testsData?.data || []).map(t => ({ label: `${t.test_name} - â‚¹${t.charge}`, value: t.test_name }))} />
          </Form.Item>
          <Form.Item name="clinical_info" label="Clinical Information">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </SliderModal>

      <SliderModal open={reportModalOpen} onCancel={() => setReportModalOpen(false)} onOk={handleSubmitReport} title="Submit Report">
        <Form form={reportForm} layout="vertical">
          <Form.Item label="Patient"><Input value={selectedOrder?.patient_name} disabled /></Form.Item>
          <Form.Item label="Test"><Input value={selectedOrder?.test_name} disabled /></Form.Item>
          <Form.Item name="findings" label="Findings" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Enter findings..." />
          </Form.Item>
          <Form.Item name="impression" label="Impression" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Enter impression..." />
          </Form.Item>
        </Form>
      </SliderModal>

      <ViewDetailsModal
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        record={selectedOrder}
        type="Radiology Order"
      />
    </div>
  );
};

export default Radiology;
