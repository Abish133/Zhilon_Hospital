import { useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, Select, Tag, Space, Popconfirm, message } from 'antd';
import { ScheduleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/PageHeader';
import EquipmentService from '@services/EquipmentService';
import PreventiveMaintenanceService from '@services/PreventiveMaintenanceService';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import dayjs from 'dayjs';

const PreventiveMaintenance = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPM, setSelectedPM] = useState(null);
  const [form] = Form.useForm();

  const { data: equipment } = useApiQuery(['equipment'], () => EquipmentService.getAll());
  const { data: preventiveMaintenances, refetch } = useApiQuery(
    ['preventive-maintenance'], 
    () => PreventiveMaintenanceService.getAll()
  );

  const createMutation = useApiMutation(
    (data) => selectedPM ? 
      PreventiveMaintenanceService.update(selectedPM.pm_id, data) : 
      PreventiveMaintenanceService.create(data),
    {
      successMessage: selectedPM ? 'PM schedule updated successfully' : 'PM schedule created successfully',
      onSuccess: () => {
        refetch();
        setModalOpen(false);
        setSelectedPM(null);
        form.resetFields();
      }
    }
  );

  const deleteMutation = useApiMutation(
    (id) => PreventiveMaintenanceService.delete(id),
    {
      successMessage: 'PM schedule deleted successfully',
      onSuccess: () => refetch()
    }
  );

  const columns = [
    { 
      title: 'PM ID', 
      dataIndex: 'pm_id', 
      key: 'pm_id',
      render: (id) => <Tag color="blue">PM-{id}</Tag>
    },
    { 
      title: 'Equipment', 
      dataIndex: ['equipment', 'equipment_name'], 
      key: 'equipment_name' 
    },
    { 
      title: 'Schedule', 
      dataIndex: 'pm_schedule', 
      key: 'pm_schedule',
      render: (schedule) => <Tag color="green">{schedule}</Tag>
    },
    { 
      title: 'Last PM Date', 
      dataIndex: 'last_pm_date', 
      key: 'last_pm_date', 
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : 'N/A'
    },
    { 
      title: 'Next PM Date', 
      dataIndex: 'next_pm_date', 
      key: 'next_pm_date', 
      render: (date) => {
        if (!date) return 'N/A';
        const nextDate = dayjs(date);
        const today = dayjs();
        const daysLeft = nextDate.diff(today, 'days');
        
        return (
          <div>
            <div>{nextDate.format('DD MMM YYYY')}</div>
            <Tag color={daysLeft <= 7 ? 'red' : daysLeft <= 30 ? 'orange' : 'green'}>
              {daysLeft > 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}
            </Tag>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete PM Schedule"
            description="Are you sure to delete this PM schedule?"
            onConfirm={() => deleteMutation.mutate(record.pm_id)}
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
    setSelectedPM(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (pm) => {
    setSelectedPM(pm);
    form.setFieldsValue({
      ...pm,
      last_pm_date: pm.last_pm_date ? dayjs(pm.last_pm_date) : null,
      next_pm_date: pm.next_pm_date ? dayjs(pm.next_pm_date) : null
    });
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      last_pm_date: values.last_pm_date?.format('YYYY-MM-DD'),
      next_pm_date: values.next_pm_date?.format('YYYY-MM-DD')
    };
    createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Preventive Maintenance"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Schedule PM
          </Button>
        }
      />

      <Card>
        <Table 
          columns={columns} 
          dataSource={preventiveMaintenances?.data || []} 
          rowKey="pm_id" 
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={selectedPM ? 'Edit PM Schedule' : 'Schedule Preventive Maintenance'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedPM(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={600}
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
          
          <Form.Item name="pm_schedule" label="PM Schedule" rules={[{ required: true }]}>
            <Select
              placeholder="Select schedule frequency"
              options={[
                { label: 'Weekly', value: 'Weekly' },
                { label: 'Monthly', value: 'Monthly' },
                { label: 'Quarterly', value: 'Quarterly' },
                { label: 'Half-Yearly', value: 'Half-Yearly' },
                { label: 'Yearly', value: 'Yearly' }
              ]}
            />
          </Form.Item>

          <Form.Item name="last_pm_date" label="Last PM Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="next_pm_date" label="Next PM Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="pm_checklist" label="PM Checklist">
            <Input.TextArea 
              rows={4} 
              placeholder="Enter preventive maintenance checklist items..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PreventiveMaintenance;