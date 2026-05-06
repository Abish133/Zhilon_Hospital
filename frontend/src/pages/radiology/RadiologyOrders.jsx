import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Form, Input, Select, DatePicker, Space } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { EyeOutlined, CheckOutlined, FileImageOutlined, FileTextOutlined } from '@ant-design/icons';
import { radiologyOrderService, radiologyImagingService, radiologyReportService } from '@services';
import { useNavigate } from 'react-router-dom';

const RadiologyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form] = Form.useForm();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewImages, setViewImages] = useState([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await radiologyOrderService.getAll();
      const ordersData = response.data?.data || response.data || [];
      setOrders(ordersData);
    } catch (error) {
      message.error('Failed to fetch radiology orders');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (order) => {
    setViewOrder(order);
    setViewModalOpen(true);
    
    if (order.status === 'In Progress' || order.status === 'Completed' || order.status === 'Reported') {
      try {
        const response = await radiologyImagingService.getByOrderId(order.rad_order_id);
        const imagingData = response.data?.data || response.data || [];
        const imaging = Array.isArray(imagingData) ? imagingData[0] : imagingData;
        if (imaging?.images_path) {
          const images = imaging.images_path.split('|||');
          setViewImages(images);
        }
      } catch (error) {
      }
    }
  };

  const handleSchedule = (order) => {
    setSelectedOrder(order);
    form.setFieldsValue({
      scheduled_date: null,
      scheduled_time: null
    });
    setModalOpen(true);
  };

  const handleScheduleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const scheduleData = {
        scheduled_date: values.scheduled_date.format('YYYY-MM-DD'),
        scheduled_time: values.scheduled_time,
        status: 'Scheduled'
      };
      await radiologyOrderService.update(selectedOrder.rad_order_id, scheduleData);
      message.success('Order scheduled successfully');
      setModalOpen(false);
      fetchOrders();
    } catch (error) {
      message.error('Failed to schedule order');
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await radiologyOrderService.update(orderId, { status });
      message.success(`Status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Ordered': 'blue',
      'Scheduled': 'cyan',
      'In Progress': 'orange',
      'Completed': 'green',
      'Reported': 'purple'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'rad_order_id',
      key: 'rad_order_id',
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : '-'
    },
    {
      title: 'UHID',
      dataIndex: 'uhid',
      key: 'uhid',
      render: (uhid) => <Tag>{uhid}</Tag>
    },
    {
      title: 'Test Name',
      key: 'test_name',
      render: (_, record) => (
        <Space size={4}>
          <strong>{record.test_name}</strong>
          {record.covered_by_package_charge_id && <Tag color="purple">Package</Tag>}
        </Space>
      )
    },
    {
      title: 'Modality',
      dataIndex: 'modality',
      key: 'modality',
      render: (modality) => <Tag color="purple">{modality}</Tag>
    },
    {
      title: 'Order Date',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date) => new Date(date).toLocaleDateString('en-IN')
    },
    {
      title: 'Scheduled',
      key: 'scheduled',
      render: (_, record) => record.scheduled_date ? 
        `${new Date(record.scheduled_date).toLocaleDateString('en-IN')} ${record.scheduled_time || ''}` : '-'
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
            <Button size="small" onClick={() => handleSchedule(record)}>
              Schedule
            </Button>
          )}
          {record.status === 'Scheduled' && (
            <Button size="small" type="primary" icon={<FileImageOutlined />} 
              onClick={() => navigate(`/radiology/imaging/${record.rad_order_id}`)}>
              Capture
            </Button>
          )}
          {record.status === 'In Progress' && (
            <Button size="small" type="primary" icon={<CheckOutlined />}
              onClick={() => handleStatusUpdate(record.rad_order_id, 'Completed')}>
              Complete
            </Button>
          )}
          {record.status === 'Completed' && (
            <Button size="small" icon={<FileTextOutlined />}
              onClick={() => navigate(`/radiology/report/${record.rad_order_id}`)}>
              Report
            </Button>
          )}
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="Radiology Orders">
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="rad_order_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <SliderModal
        title="Schedule Radiology Test"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleScheduleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="scheduled_date" label="Scheduled Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="scheduled_time" label="Scheduled Time">
            <Input type="time" />
          </Form.Item>
        </Form>
      </SliderModal>

      <SliderModal
        title="Order Details"
        open={viewModalOpen}
        onCancel={() => { setViewModalOpen(false); setViewImages([]); }}
        footer={[
          viewOrder?.status === 'In Progress' && (
            <Button key="complete" type="primary" onClick={() => {
              handleStatusUpdate(viewOrder.rad_order_id, 'Completed');
              setViewModalOpen(false);
              setViewImages([]);
            }}>
              Mark as Completed
            </Button>
          ),
          <Button key="close" onClick={() => { setViewModalOpen(false); setViewImages([]); }}>Close</Button>
        ]}
        width={800}
      >
        {viewOrder && (
          <div style={{ padding: '16px 0' }}>
            <p><strong>Order ID:</strong> #{viewOrder.rad_order_id}</p>
            <p><strong>Patient:</strong> {viewOrder.patient?.first_name} {viewOrder.patient?.last_name}</p>
            <p><strong>UHID:</strong> {viewOrder.uhid}</p>
            <p><strong>Test Name:</strong> {viewOrder.test_name}</p>
            <p><strong>Modality:</strong> {viewOrder.modality}</p>
            <p><strong>Clinical Info:</strong> {viewOrder.clinical_info || 'N/A'}</p>
            <p><strong>Ordered By:</strong> {viewOrder.orderedBy ? `${viewOrder.orderedBy.first_name} ${viewOrder.orderedBy.last_name}` : 'N/A'}</p>
            <p><strong>Order Date:</strong> {new Date(viewOrder.order_date).toLocaleString('en-IN')}</p>
            <p><strong>Scheduled Date:</strong> {viewOrder.scheduled_date ? new Date(viewOrder.scheduled_date).toLocaleDateString('en-IN') : 'Not scheduled'}</p>
            <p><strong>Scheduled Time:</strong> {viewOrder.scheduled_time || 'N/A'}</p>
            <p><strong>Status:</strong> <Tag color={getStatusColor(viewOrder.status)}>{viewOrder.status}</Tag></p>
            
            {viewImages.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <strong>Captured Images:</strong>
                <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  {viewImages.map((img, idx) => (
                    <div key={idx} style={{ border: '1px solid #d9d9d9', padding: 8, borderRadius: 4, textAlign: 'center' }}>
                      {img && img.startsWith('data:image') ? (
                        <>
                          <img 
                            src={img} 
                            alt={`Image ${idx + 1}`} 
                            style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain', cursor: 'pointer' }}
                            onClick={() => { setSelectedImage(img); setImageModalOpen(true); }}
                          />
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Click to enlarge</div>
                        </>
                      ) : (
                        <div style={{ color: '#999', fontSize: 12 }}>Invalid image data</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SliderModal>

      <SliderModal
        title="Image Viewer"
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        footer={null}
        width="90%"
        centered
      >
        {selectedImage && (
          <img src={selectedImage} alt="Full size" style={{ width: '100%', height: 'auto' }} />
        )}
      </SliderModal>
    </div>
  );
};

export default RadiologyOrders;
