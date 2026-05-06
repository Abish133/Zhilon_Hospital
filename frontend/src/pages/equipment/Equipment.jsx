import { useState } from 'react';
import { Space, Button, Tag, Card, Row, Col, Statistic, message, Form, Input, Select, DatePicker, Table, Timeline } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { EyeOutlined, EditOutlined, ToolOutlined, WarningOutlined, CheckCircleOutlined, ToolFilled, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import EquipmentForm from './EquipmentForm';
import EquipmentService from '@services/EquipmentService';
import MaintenanceRequestService from '@services/MaintenanceRequestService';
import MaintenanceHistoryService from '@services/MaintenanceHistoryService';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { formatDate } from '@utils/helpers';

const Equipment = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [maintenanceForm] = Form.useForm();
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);

  const { data, isLoading, refetch } = useApiQuery(
    ['equipment', searchQuery],
    () => searchQuery ? EquipmentService.searchEquipment(searchQuery) : EquipmentService.getAll()
  );

  const { data: allMaintenanceRequests } = useApiQuery(
    ['maintenance-requests'],
    () => MaintenanceRequestService.getAll()
  );

  const maintenanceRequestMutation = useApiMutation(
    (data) => MaintenanceRequestService.create(data),
    {
      successMessage: 'Maintenance request submitted successfully',
      onSuccess: () => {
        setMaintenanceModalOpen(false);
        maintenanceForm.resetFields();
        setSelectedEquipment(null);
      }
    }
  );

  const columns = [
    { title: 'Serial No', dataIndex: 'serial_number', key: 'serial_number', render: (sn) => <Tag color="blue">{sn}</Tag> },
    { title: 'Equipment', dataIndex: 'equipment_name', key: 'equipment_name', render: (name) => <div style={{ fontWeight: 500 }}>{name}</div> },
    { title: 'Department', dataIndex: 'department', key: 'department', render: (dept) => dept?.department_name || 'N/A' },
    { title: 'Purchase Date', dataIndex: 'purchase_date', key: 'purchase_date', render: (date) => formatDate(date) },
    { title: 'AMC End', dataIndex: 'amc_end', key: 'amc_end', render: (date) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Active' ? 'green' : s === 'Under Maintenance' ? 'orange' : 'red'}>{s}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            type="primary"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            icon={<ToolFilled />}
            size="small" 
            onClick={() => handleMaintenance(record)}
          >
            Request
          </Button>
          <Button 
            icon={<HistoryOutlined />}
            size="small" 
            onClick={() => handleHistory(record)}
          >
            History
          </Button>
        </Space>
      )
    }
  ];

  const handleAdd = () => {
    setSelectedEquipment(null);
    setModalOpen(true);
  };

  const handleEdit = (equipment) => {
    setSelectedEquipment(equipment);
    setModalOpen(true);
  };

  const handleMaintenance = (equipment) => {
    setSelectedEquipment(equipment);
    maintenanceForm.setFieldsValue({ 
      equipment_id: equipment.equipment_id,
      equipment_name: equipment.equipment_name 
    });
    setMaintenanceModalOpen(true);
  };

  const handleHistory = async (equipment) => {
    setSelectedEquipment(equipment);
    try {
      // Get maintenance requests for this equipment
      const requests = allMaintenanceRequests?.data?.filter(req => 
        req.equipment_id === equipment.equipment_id
      ) || [];
      
      // Get maintenance history
      const historyRes = await MaintenanceHistoryService.getAll();
      const history = historyRes?.data?.filter(hist => 
        hist.equipment_id === equipment.equipment_id
      ) || [];
      
      // Combine and sort by date
      const combined = [
        ...requests.map(req => ({ ...req, type: 'request', date: req.request_date })),
        ...history.map(hist => ({ ...hist, type: 'history', date: hist.maintenance_date }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setMaintenanceHistory(combined);
      setHistoryModalOpen(true);
    } catch (error) {
      message.error('Failed to load maintenance history');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedEquipment(null);
  };

  const handleSuccess = () => {
    refetch();
    handleModalClose();
  };

  const handleMaintenanceRequest = (values) => {
    const payload = {
      equipment_id: selectedEquipment?.equipment_id,
      issue_description: values.issue_description,
      priority: values.priority
    };
    maintenanceRequestMutation.mutate(payload);
  };

  const getStats = () => {
    const equipmentData = data?.data || [];
    const total = equipmentData.length;
    const active = equipmentData.filter(eq => eq.status === 'Active').length;
    const maintenance = equipmentData.filter(eq => eq.status === 'Under Maintenance').length;
    const expiringSoon = equipmentData.filter(eq => {
      if (!eq.amc_end) return false;
      const daysToExpiry = new Date(eq.amc_end).getTime() - new Date().getTime();
      return daysToExpiry > 0 && daysToExpiry <= 30 * 24 * 60 * 60 * 1000;
    }).length;
    
    return { total, active, maintenance, expiringSoon };
  };

  const stats = getStats();

  const createHistoryTimeline = () => {
    return maintenanceHistory.map((item, index) => {
      const isRequest = item.type === 'request';
      return {
        color: isRequest ? (item.priority === 'Critical' ? 'red' : 'blue') : 'green',
        dot: isRequest ? <ToolOutlined /> : <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>
              {isRequest ? 'Maintenance Request' : 'Maintenance Completed'}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              {formatDate(item.date)}
            </div>
            <div>{item.issue_description || item.work_performed}</div>
            {isRequest && (
              <Tag color={item.priority === 'Critical' ? 'red' : item.priority === 'High' ? 'orange' : 'blue'}>
                {item.priority}
              </Tag>
            )}
            {item.status && (
              <Tag color={item.status === 'Resolved' ? 'green' : 'orange'}>
                {item.status}
              </Tag>
            )}
          </div>
        )
      };
    });
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Equipment" value={stats.total} prefix={<ToolOutlined />} valueStyle={{ color: '#0a0a0a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Active" value={stats.active} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10b981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Under Maintenance" value={stats.maintenance} prefix={<WarningOutlined />} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="AMC Expiring Soon" value={stats.expiringSoon} valueStyle={{ color: '#ef4444' }} /></Card></Col>
      </Row>

      <Card title="Equipment & Maintenance Management">
        <SearchBar placeholder="Search equipment" onSearch={setSearchQuery} onAdd={handleAdd} addButtonText="Add Equipment" />
        <DataTable columns={columns} dataSource={data?.data || []} loading={isLoading} rowKey="equipment_id" />
      </Card>

      <EquipmentForm
        open={modalOpen}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedEquipment}
      />

      <SliderModal
        title="Request Maintenance"
        open={maintenanceModalOpen}
        onCancel={() => {
          setMaintenanceModalOpen(false);
          setSelectedEquipment(null);
          maintenanceForm.resetFields();
        }}
        onOk={() => maintenanceForm.submit()}
        confirmLoading={maintenanceRequestMutation.isPending}
      >
        <Form 
          form={maintenanceForm} 
          layout="vertical" 
          onFinish={handleMaintenanceRequest}
        >
          <Form.Item name="equipment_name" label="Equipment">
            <Input disabled />
          </Form.Item>
          <Form.Item 
            name="issue_description" 
            label="Issue Description" 
            rules={[{ required: true, message: 'Please describe the issue' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Describe the issue or maintenance required..." 
            />
          </Form.Item>
          <Form.Item 
            name="priority" 
            label="Priority" 
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
                { label: 'Critical', value: 'Critical' }
              ]}
              placeholder="Select priority level"
            />
          </Form.Item>
        </Form>
      </SliderModal>

      <SliderModal
        title={`Maintenance History - ${selectedEquipment?.equipment_name}`}
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={null}
        width={800}
      >
        {maintenanceHistory.length > 0 ? (
          <Timeline items={createHistoryTimeline()} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            No maintenance history found
          </div>
        )}
      </SliderModal>
    </div>
  );
};

export default Equipment;
