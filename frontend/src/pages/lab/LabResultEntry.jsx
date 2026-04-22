import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Table, Space, InputNumber, Select, Divider } from 'antd';
import { ExperimentOutlined, SaveOutlined } from '@ant-design/icons';
import { labOrderService, labOrderDetailService, labResultService } from '@/services';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { TextArea } = Input;

const LabResultEntry = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [results, setResults] = useState({});
  const { order_id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (order_id) {
      fetchOrderData();
    }
  }, [order_id]);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      const [orderRes, detailsRes] = await Promise.all([
        labOrderService.getById(order_id),
        labOrderDetailService.getAll({ order_id })
      ]);

      if (orderRes.success) {
        setOrder(orderRes.data);
      }

      if (detailsRes.success) {
        setOrderDetails(detailsRes.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch order data');
    } finally {
      setLoading(false);
    }
  };

  const handleResultChange = (detailId, field, value) => {
    setResults(prev => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Save results for each test
      for (const detail of orderDetails) {
        const resultData = results[detail.detail_id];
        if (resultData && resultData.result_data) {
          await labResultService.create({
            order_id: parseInt(order_id),
            detail_id: detail.detail_id,
            test_id: detail.test_id,
            result_data: resultData.result_data,
            interpretation: resultData.interpretation || '',
            critical_value: resultData.critical_value || false,
            status: 'Verified'
          });

          // Update detail status
          await labOrderDetailService.update(detail.detail_id, {
            status: 'Completed'
          });
        }
      }

      // Update order status
      await labOrderService.update(order_id, {
        status: 'Completed'
      });

      message.success('Results saved successfully!');
      navigate('/lab');
    } catch (error) {
      message.error('Failed to save results');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Test Name',
      dataIndex: 'test_name',
      key: 'test_name',
      width: 200
    },
    {
      title: 'Test Code',
      dataIndex: 'test_code',
      key: 'test_code',
      width: 120
    },
    {
      title: 'Sample Type',
      dataIndex: 'sample_type',
      key: 'sample_type',
      width: 120
    },
    {
      title: 'Result',
      key: 'result',
      width: 200,
      render: (_, record) => (
        <Input
          placeholder="Enter result"
          onChange={(e) => handleResultChange(record.detail_id, 'result_data', e.target.value)}
        />
      )
    },
    {
      title: 'Interpretation',
      key: 'interpretation',
      width: 200,
      render: (_, record) => (
        <Select
          placeholder="Select"
          style={{ width: '100%' }}
          onChange={(value) => handleResultChange(record.detail_id, 'interpretation', value)}
        >
          <Select.Option value="Normal">Normal</Select.Option>
          <Select.Option value="Abnormal">Abnormal</Select.Option>
          <Select.Option value="High">High</Select.Option>
          <Select.Option value="Low">Low</Select.Option>
        </Select>
      )
    },
    {
      title: 'Critical',
      key: 'critical',
      width: 100,
      render: (_, record) => (
        <Select
          placeholder="No"
          style={{ width: '100%' }}
          onChange={(value) => handleResultChange(record.detail_id, 'critical_value', value)}
        >
          <Select.Option value={false}>No</Select.Option>
          <Select.Option value={true}>Yes</Select.Option>
        </Select>
      )
    }
  ];

  return (
    <Card
      title={
        <Space>
          <ExperimentOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span>Lab Result Entry</span>
        </Space>
      }
    >
      {order && (
        <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div><strong>Order ID:</strong> #{order.order_id}</div>
            <div><strong>Patient:</strong> {order.patient?.first_name} {order.patient?.last_name} (UHID: {order.uhid})</div>
            <div><strong>Ordered By:</strong> {order.orderedBy?.name}</div>
            <div><strong>Order Date:</strong> {dayjs(order.order_date).format('DD MMM YYYY HH:mm')}</div>
            <div><strong>Visit Type:</strong> {order.visit_type}</div>
          </Space>
        </Card>
      )}

      <Divider>Test Results</Divider>

      <Table
        columns={columns}
        dataSource={orderDetails}
        rowKey="detail_id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1000 }}
        bordered
        size="middle"
      />

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          <Button onClick={() => navigate('/lab')}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            Save Results
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default LabResultEntry;
