import { useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, Select, Tag, Alert, Calendar, Badge, Space, Popconfirm, message } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { ToolOutlined, CalendarOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/PageHeader';
import EquipmentService from '@services/EquipmentService';
import MaintenanceRequestService from '@services/MaintenanceRequestService';
import MaintenanceHistoryService from '@services/MaintenanceHistoryService';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import dayjs from 'dayjs';

const EquipmentMaintenance = () => {
  const [requestModal, setRequestModal] = useState(false);
  const [calendarView, setCalendarView] = useState(false);
  const [form] = Form.useForm();

  const { data: equipment } = useApiQuery(['equipment'], () => EquipmentService.getAll());
  const { data: maintenanceRequests, refetch: refetchRequests } = useApiQuery(
    ['maintenance-requests'], 
    () => MaintenanceRequestService.getAll()
  );
  const { data: maintenanceHistory } = useApiQuery(
    ['maintenance-history'], 
    () => MaintenanceHistoryService.getAll()
  );

  const createMutation = useApiMutation(
    (data) => MaintenanceRequestService.create(data),
    {
      successMessage: 'Maintenance request created successfully',
      onSuccess: () => {
        refetchRequests();
        setRequestModal(false);
        form.resetFields();
      }
    }
  );

  const updateRequestMutation = useApiMutation(
    ({ id, data }) => MaintenanceRequestService.update(id, data),
    {
      successMessage: 'Maintenance request updated successfully',
      onSuccess: () => refetchRequests()
    }
  );

  const deleteRequestMutation = useApiMutation(
    (id) => MaintenanceRequestService.delete(id),
    {
      successMessage: 'Maintenance request deleted successfully',
      onSuccess: () => refetchRequests()
    }
  );

  const getAlerts = () => {
    const alerts = [];
    equipment?.data?.forEach((eq) => {
      const amcEnd = dayjs(eq.amc_end);
      const daysToExpiry = amcEnd.diff(dayjs(), 'days');
      if (daysToExpiry <= 30 && daysToExpiry > 0) {
        alerts.push({ type: 'warning', message: `${eq.equipment_name} AMC expires in ${daysToExpiry} days` });
      } else if (daysToExpiry <= 0) {
        alerts.push({ type: 'error', message: `${eq.equipment_name} AMC expired` });
      }
    });
    return alerts;
  };

  const getMaintenanceSchedule = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const scheduled = maintenanceRequests?.data?.filter((req) => {
      return dayjs(req.request_date).format('YYYY-MM-DD') === dateStr;
    }) || [];
    return scheduled;
  };

  const dateCellRender = (date) => {
    const scheduled = getMaintenanceSchedule(date);
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {scheduled.map((req) => (
          <li key={req.request_id}>
            <Badge 
              status={req.priority === 'Critical' ? 'error' : req.priority === 'High' ? 'warning' : 'processing'} 
              text={req.equipment?.equipment_name || 'Equipment'} 
            />
          </li>
        ))}
      </ul>
    );
  };

  const handleUpdateStatus = (record) => {
    Modal.confirm({
      title: 'Update Maintenance Status',
      content: (
        <Select
          defaultValue={record.status}
          style={{ width: '100%', marginTop: 16 }}
          onChange={(value) => {
            updateRequestMutation.mutate({
              id: record.request_id,
              data: { status: value }
            });
          }}
          options={[
            { label: 'Reported', value: 'Reported' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Resolved', value: 'Resolved' },
            { label: 'Pending Parts', value: 'Pending Parts' }
          ]}
        />
      ),
      onOk: () => {},
      okText: 'Update',
      cancelText: 'Cancel'
    });
  };

  const columns = [
    { 
      title: 'Request ID', 
      dataIndex: 'request_id', 
      key: 'request_id',
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    { 
      title: 'Equipment', 
      dataIndex: ['equipment', 'equipment_name'], 
      key: 'equipment_name' 
    },
    { 
      title: 'Issue Description', 
      dataIndex: 'issue_description', 
      key: 'issue_description',
      ellipsis: true
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={
          priority === 'Critical' ? 'red' : 
          priority === 'High' ? 'orange' : 
          priority === 'Medium' ? 'blue' : 'green'
        }>
          {priority}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'Reported' ? 'blue' : 
          status === 'In Progress' ? 'orange' : 
          status === 'Resolved' ? 'green' : 'purple'
        }>
          {status}
        </Tag>
      )
    },
    { 
      title: 'Request Date', 
      dataIndex: 'request_date', 
      key: 'request_date', 
      render: (date) => dayjs(date).format('DD MMM YYYY') 
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleUpdateStatus(record)}
          >
            Update
          </Button>
          <Popconfirm
            title="Delete Request"
            description="Are you sure to delete this maintenance request?"
            onConfirm={() => deleteRequestMutation.mutate(record.request_id)}
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

  return (
    <div>
      <PageHeader
        title="Equipment Maintenance"
        extra={
          <Space>
            <Button type="primary" onClick={() => setRequestModal(true)}>
              New Request
            </Button>
            <Button icon={<CalendarOutlined />} onClick={() => setCalendarView(!calendarView)}>
              {calendarView ? 'List View' : 'Calendar View'}
            </Button>
          </Space>
        }
      />

      {getAlerts().map((alert, index) => (
        <Alert key={index} type={alert.type} message={alert.message} style={{ marginBottom: 8 }} closable />
      ))}

      {calendarView ? (
        <Card>
          <Calendar dateCellRender={dateCellRender} />
        </Card>
      ) : (
        <Card title="Maintenance Requests">
          <Table 
            columns={columns} 
            dataSource={maintenanceRequests?.data || []} 
            rowKey="request_id" 
            scroll={{ x: 800 }}
          />
        </Card>
      )}

      <SliderModal
        title="Maintenance Request"
        open={requestModal}
        onCancel={() => setRequestModal(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="equipment_id" label="Equipment" rules={[{ required: true }]}>
            <Select
              placeholder="Select equipment"
              options={equipment?.data?.map((eq) => ({ 
                label: `${eq.equipment_name} (${eq.serial_number})`, 
                value: eq.equipment_id 
              }))}
            />
          </Form.Item>
          <Form.Item name="issue_description" label="Issue Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Describe the issue..." />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
                { label: 'Critical', value: 'Critical' }
              ]}
            />
          </Form.Item>
        </Form>
      </SliderModal>
    </div>
  );
};

export default EquipmentMaintenance;
