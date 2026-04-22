import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Row, Col, Statistic, Tabs } from 'antd';
import { ExperimentOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { labOrderService, labOrderDetailService, labSampleService } from '@/services';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const LabOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sampleModalVisible, setSampleModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await labOrderService.getAll();
      if (response.success) {
        const ordersData = response.data || [];
        setOrders(ordersData);
        

      }
    } catch (error) {
      message.error('Failed to fetch lab orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectSample = (order) => {
    setSelectedOrder(order);
    setSampleModalVisible(true);
    form.setFieldsValue({
      barcode: `SAMPLE-${order.order_id}-${Date.now()}`,
      collection_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      condition_on_receipt: 'Good'
    });
  };

  const handleSampleSubmit = async (values) => {
    try {
      const sampleData = {
        order_id: selectedOrder.order_id,
        barcode: values.barcode,
        sample_type: values.sample_type,
        collection_date: values.collection_date,
        received_in_lab_at: new Date(),
        condition_on_receipt: values.condition_on_receipt
      };

      const response = await labSampleService.create(sampleData);
      if (response.success) {
        await labOrderService.update(selectedOrder.order_id, { status: 'Sample Collected' });
        message.success('Sample collected successfully!');
        setSampleModalVisible(false);
        form.resetFields();
        fetchOrders();
        // Print barcode label
        printSampleLabel(values.barcode, selectedOrder);
      }
    } catch (error) {
      message.error('Failed to collect sample');
    }
  };

  const printSampleLabel = (barcode, order) => {
    const patient = order.patient || {};
    const details = (order.details || []).map(d => d.test_name).join(', ');
    const win = window.open('', '_blank', 'width=400,height=300');
    win.document.write(`
      <html><head><title>Sample Label</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 10px; font-size: 12px; }
        .label { border: 2px solid #000; padding: 10px; width: 340px; }
        .barcode { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; letter-spacing: 3px; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        h3 { margin: 0 0 6px 0; font-size: 14px; text-align: center; }
      </style></head><body>
      <div class="label">
        <h3>SAMPLE LABEL</h3>
        <div class="barcode">|||${barcode}|||</div>
        <div><b>${barcode}</b></div>
        <div class="row"><span><b>Patient:</b> ${patient.first_name || ''} ${patient.last_name || ''}</span><span><b>UHID:</b> ${patient.uhid || order.uhid || '-'}</span></div>
        <div><b>Tests:</b> ${details || '-'}</div>
        <div><b>Collected:</b> ${new Date().toLocaleString('en-IN')}</div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const getStatusColor = (status) => {
    const colors = {
      'Ordered': 'blue',
      'Sample Collected': 'cyan',
      'In Progress': 'orange',
      'Completed': 'green',
      'Cancelled': 'red'
    };
    return colors[status] || 'default';
  };

  const getTodayStats = () => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayOrders = orders.filter(o => dayjs(o.order_date).format('YYYY-MM-DD') === today);
    
    return {
      total: todayOrders.length,
      pending: orders.filter(o => o.status === 'Ordered').length,
      collected: orders.filter(o => o.status === 'Sample Collected').length,
      completed: orders.filter(o => o.status === 'Completed').length
    };
  };

  const expandedRowRender = (record) => {
    const details = orderDetails[record.order_id] || [];
    
    const columns = [
      {
        title: 'Test Name',
        dataIndex: 'test_name',
        key: 'test_name'
      },
      {
        title: 'Test Code',
        dataIndex: 'test_code',
        key: 'test_code'
      },
      {
        title: 'Sample Type',
        dataIndex: 'sample_type',
        key: 'sample_type'
      },
      {
        title: 'Charge',
        dataIndex: 'charge',
        key: 'charge',
        render: (charge) => `₹${charge}`
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
      }
    ];

    return <Table columns={columns} dataSource={details} pagination={false} rowKey="detail_id" size="small" bordered />;
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.patient?.first_name} {record.patient?.last_name}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            UHID: {record.uhid}
          </div>
        </div>
      )
    },
    {
      title: 'Visit Type',
      dataIndex: 'visit_type',
      key: 'visit_type',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: 'Ordered By',
      key: 'orderedBy',
      render: (_, record) => record.orderedBy?.name || 'N/A'
    },
    {
      title: 'Order Date',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date) => dayjs(date).format('DD MMM YYYY HH:mm')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'Ordered' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCollectSample(record)}
            >
              Collect Sample
            </Button>
          )}
          {record.status === 'Sample Collected' && (
            <Button
              size="small"
              type="primary"
              onClick={() => navigate(`/lab/results/${record.order_id}`)}
            >
              Enter Results
            </Button>
          )}
          {record.status === 'Completed' && (
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/lab/report/${record.order_id}`)}
            >
              View Report
            </Button>
          )}
        </Space>
      )
    }
  ];

  const stats = getTodayStats();
  const pendingOrders = orders.filter(o => o.status === 'Ordered');
  const collectedOrders = orders.filter(o => o.status === 'Sample Collected');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's Orders"
              value={stats.total}
              prefix={<ExperimentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Collection"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sample Collected"
              value={stats.collected}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ExperimentOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <span>Laboratory Orders</span>
          </Space>
        }
      >
        <Tabs
          items={[
            {
              key: 'pending',
              label: `Pending Collection (${pendingOrders.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={pendingOrders}
                  rowKey="order_id"
                  loading={loading}
                  expandable={{ expandedRowRender }}
                  pagination={{ pageSize: 10 }}
                  bordered
                  size="middle"
                />
              )
            },
            {
              key: 'collected',
              label: `Sample Collected (${collectedOrders.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={collectedOrders}
                  rowKey="order_id"
                  loading={loading}
                  expandable={{ expandedRowRender }}
                  pagination={{ pageSize: 10 }}
                  bordered
                  size="middle"
                />
              )
            },
            {
              key: 'completed',
              label: `Completed (${completedOrders.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={completedOrders}
                  rowKey="order_id"
                  loading={loading}
                  expandable={{ expandedRowRender }}
                  pagination={{ pageSize: 10 }}
                  bordered
                  size="middle"
                />
              )
            },
            {
              key: 'all',
              label: `All Orders (${orders.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={orders}
                  rowKey="order_id"
                  loading={loading}
                  expandable={{ expandedRowRender }}
                  pagination={{ pageSize: 10 }}
                  bordered
                  size="middle"
                />
              )
            }
          ]}
        />
      </Card>

      <Modal
        title="Collect Sample"
        open={sampleModalVisible}
        onCancel={() => {
          setSampleModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSampleSubmit}>
          <Form.Item
            name="barcode"
            label="Barcode"
            rules={[{ required: true, message: 'Please enter barcode' }]}
          >
            <Input placeholder="Sample barcode" />
          </Form.Item>

          <Form.Item
            name="sample_type"
            label="Sample Type"
            rules={[{ required: true, message: 'Please select sample type' }]}
          >
            <Select placeholder="Select sample type">
              <Select.Option value="Blood">Blood</Select.Option>
              <Select.Option value="Urine">Urine</Select.Option>
              <Select.Option value="Stool">Stool</Select.Option>
              <Select.Option value="Sputum">Sputum</Select.Option>
              <Select.Option value="Swab">Swab</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="condition_on_receipt"
            label="Condition on Receipt"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="Good">Good</Select.Option>
              <Select.Option value="Hemolyzed">Hemolyzed</Select.Option>
              <Select.Option value="Clotted">Clotted</Select.Option>
              <Select.Option value="Insufficient">Insufficient</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="collection_date" label="Collection Date">
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LabOrders;
