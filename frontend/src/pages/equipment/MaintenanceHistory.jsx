import { useState } from 'react';
import { Card, Table, Button, Form, Input, DatePicker, Select, Tag, Space, Popconfirm, InputNumber, Descriptions } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { HistoryOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/PageHeader';
import EquipmentService from '@services/EquipmentService';
import MaintenanceHistoryService from '@services/MaintenanceHistoryService';
import MaintenanceRequestService from '@services/MaintenanceRequestService';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import dayjs from 'dayjs';

const MaintenanceHistory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [form] = Form.useForm();

  const { data: equipment } = useApiQuery(['equipment'], () => EquipmentService.getAll());
  const { data: maintenanceRequests } = useApiQuery(['maintenance-requests'], () => MaintenanceRequestService.getAll());
  const { data: maintenanceHistory, refetch } = useApiQuery(
    ['maintenance-history'], 
    () => MaintenanceHistoryService.getAll()
  );

  const createMutation = useApiMutation(
    (data) => selectedHistory ? 
      MaintenanceHistoryService.update(selectedHistory.history_id, data) : 
      MaintenanceHistoryService.create(data),
    {
      successMessage: selectedHistory ? 'Maintenance history updated successfully' : 'Maintenance history created successfully',
      onSuccess: () => {
        refetch();
        setModalOpen(false);
        setSelectedHistory(null);
        form.resetFields();
      }
    }
  );

  const deleteMutation = useApiMutation(
    (id) => MaintenanceHistoryService.delete(id),
    {
      successMessage: 'Maintenance history deleted successfully',
      onSuccess: () => refetch()
    }
  );

  const columns = [
    { 
      title: 'History ID', 
      dataIndex: 'history_id', 
      key: 'history_id',
      render: (id) => <Tag color="blue">H-{id}</Tag>
    },
    { 
      title: 'Equipment', 
      dataIndex: ['equipment', 'equipment_name'], 
      key: 'equipment_name' 
    },
    { 
      title: 'Maintenance Date', 
      dataIndex: 'maintenance_date', 
      key: 'maintenance_date', 
      render: (date) => dayjs(date).format('DD MMM YYYY')
    },
    { 
      title: 'Type', 
      dataIndex: 'maintenance_type', 
      key: 'maintenance_type',
      render: (type) => (
        <Tag color={
          type === 'Preventive' ? 'green' : 
          type === 'Breakdown' ? 'red' : 'blue'
        }>
          {type}
        </Tag>
      )
    },
    { 
      title: 'Cost', 
      dataIndex: 'cost', 
      key: 'cost', 
      render: (cost) => cost ? `₹${cost}` : 'N/A'
    },
    { 
      title: 'Serviced By', 
      dataIndex: 'serviced_by', 
      key: 'serviced_by' 
    },
    { 
      title: 'Next Service', 
      dataIndex: 'next_service_date', 
      key: 'next_service_date', 
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete History"
            description="Are you sure to delete this maintenance history?"
            onConfirm={() => deleteMutation.mutate(record.history_id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleAdd = () => {
    setSelectedHistory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (history) => {
    setSelectedHistory(history);
    form.setFieldsValue({
      ...history,
      maintenance_date: history.maintenance_date ? dayjs(history.maintenance_date) : null,
      next_service_date: history.next_service_date ? dayjs(history.next_service_date) : null
    });
    setModalOpen(true);
  };

  const handleView = (history) => {
    setSelectedHistory(history);
    setViewModalOpen(true);
  };

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      maintenance_date: values.maintenance_date?.format('YYYY-MM-DD'),
      next_service_date: values.next_service_date?.format('YYYY-MM-DD')
    };
    createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Maintenance History"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add History
          </Button>
        }
      />

      <Card>
        <Table 
          columns={columns} 
          dataSource={maintenanceHistory?.data || []} 
          rowKey="history_id" 
          scroll={{ x: 1000 }}
        />
      </Card>

      <SliderModal
        title={selectedHistory ? 'Edit Maintenance History' : 'Add Maintenance History'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedHistory(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="equipment_id" label="Equipment" rules={[{ required: true }]}>
            <Select
              placeholder="Select equipment"
              options={equipment?.data?.map((eq) => ({ 
                label: `${eq.equipment_name} (${eq.serial_number})`, 
                value: eq.equipment_id 
              }))}
            />
          </Form.Item>

          <Form.Item name="request_id" label="Related Request (Optional)">
            <Select
              placeholder="Select maintenance request"
              allowClear
              options={maintenanceRequests?.data?.map((req) => ({ 
                label: `Request #${req.request_id} - ${req.equipment?.equipment_name}`, 
                value: req.request_id 
              }))}
            />
          </Form.Item>
          
          <Form.Item name="maintenance_date" label="Maintenance Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="maintenance_type" label="Maintenance Type" rules={[{ required: true }]}>
            <Select
              placeholder="Select maintenance type"
              options={[
                { label: 'Preventive', value: 'Preventive' },
                { label: 'Breakdown', value: 'Breakdown' },
                { label: 'Calibration', value: 'Calibration' }
              ]}
            />
          </Form.Item>

          <Form.Item name="work_done" label="Work Done">
            <Input.TextArea 
              rows={3} 
              placeholder="Describe the work performed..."
            />
          </Form.Item>

          <Form.Item name="parts_replaced" label="Parts Replaced">
            <Input.TextArea 
              rows={2} 
              placeholder="List parts that were replaced..."
            />
          </Form.Item>

          <Form.Item name="cost" label="Cost">
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
              placeholder="Enter maintenance cost"
            />
          </Form.Item>

          <Form.Item name="serviced_by" label="Serviced By">
            <Input placeholder="Enter service provider name" />
          </Form.Item>

          <Form.Item name="next_service_date" label="Next Service Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </SliderModal>

      <SliderModal
        title="Maintenance History Details"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedHistory && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="History ID">H-{selectedHistory.history_id}</Descriptions.Item>
            <Descriptions.Item label="Equipment">{selectedHistory.equipment?.equipment_name}</Descriptions.Item>
            <Descriptions.Item label="Maintenance Date">{dayjs(selectedHistory.maintenance_date).format('DD MMM YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={
                selectedHistory.maintenance_type === 'Preventive' ? 'green' : 
                selectedHistory.maintenance_type === 'Breakdown' ? 'red' : 'blue'
              }>
                {selectedHistory.maintenance_type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Work Done">{selectedHistory.work_done || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Parts Replaced">{selectedHistory.parts_replaced || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Cost">{selectedHistory.cost ? `₹${selectedHistory.cost}` : 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Serviced By">{selectedHistory.serviced_by || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Next Service Date">
              {selectedHistory.next_service_date ? dayjs(selectedHistory.next_service_date).format('DD MMM YYYY') : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </SliderModal>
    </div>
  );
};

export default MaintenanceHistory;