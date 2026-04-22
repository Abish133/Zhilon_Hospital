import { useState, useMemo } from 'react';
import { Card, Calendar, Badge, Modal, Form, Input, Select, DatePicker, Button, message, List, Tag, Alert, Space } from 'antd';
import { ToolOutlined, WarningOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import EquipmentService from '@services/EquipmentService';
import MaintenanceRequestService from '@services/MaintenanceRequestService';
import PreventiveMaintenanceService from '@services/PreventiveMaintenanceService';
import MaintenanceHistoryService from '@services/MaintenanceHistoryService';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import dayjs from 'dayjs';

const EquipmentMaintenanceCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: equipment, refetch: refetchEquipment } = useApiQuery(['equipment'], () => EquipmentService.getAll());
  const { data: maintenanceRequests, refetch: refetchRequests } = useApiQuery(['maintenance-requests'], () => MaintenanceRequestService.getAll());
  const { data: preventiveMaintenances, refetch: refetchPreventive } = useApiQuery(['preventive-maintenance'], () => PreventiveMaintenanceService.getAll());
  const { data: maintenanceHistory, refetch: refetchHistory } = useApiQuery(['maintenance-history'], () => MaintenanceHistoryService.getAll());

  // Compute maintenanceSchedule from fetched data
  const maintenanceSchedule = useMemo(() => {
    const schedule = [];
    const equipmentList = equipment?.data || [];
    const equipmentMap = {};
    equipmentList.forEach(eq => {
      equipmentMap[eq.equipment_id] = eq.equipment_name || eq.name || `Equipment ${eq.equipment_id}`;
    });

    // Add maintenance requests
    (maintenanceRequests?.data || []).forEach(req => {
      if (req.scheduled_date) {
        schedule.push({
          id: `req-${req.request_id}`,
          equipment_id: req.equipment_id,
          equipment_name: equipmentMap[req.equipment_id] || 'Unknown Equipment',
          date: dayjs(req.scheduled_date).format('YYYY-MM-DD'),
          type: 'Repair',
          status: req.status || 'Scheduled'
        });
      }
    });

    // Add preventive maintenance schedules
    (preventiveMaintenances?.data || []).forEach(pm => {
      if (pm.next_due_date) {
        schedule.push({
          id: `pm-${pm.schedule_id}`,
          equipment_id: pm.equipment_id,
          equipment_name: equipmentMap[pm.equipment_id] || 'Unknown Equipment',
          date: dayjs(pm.next_due_date).format('YYYY-MM-DD'),
          type: 'Preventive',
          status: 'Scheduled'
        });
      }
    });

    // Add maintenance history (completed ones)
    (maintenanceHistory?.data || []).forEach(hist => {
      if (hist.maintenance_date) {
        schedule.push({
          id: `hist-${hist.history_id}`,
          equipment_id: hist.equipment_id,
          equipment_name: equipmentMap[hist.equipment_id] || 'Unknown Equipment',
          date: dayjs(hist.maintenance_date).format('YYYY-MM-DD'),
          type: hist.maintenance_type || 'Service',
          status: 'Completed'
        });
      }
    });

    return schedule;
  }, [equipment, maintenanceRequests, preventiveMaintenances, maintenanceHistory]);

  // Compute AMC/Warranty expiring equipment
  const amcExpiring = useMemo(() => {
    const equipmentList = equipment?.data || [];
    const today = dayjs();
    const expiring = [];

    equipmentList.forEach(eq => {
      const warrantyDate = eq.warranty_expiry || eq.amc_end_date;
      if (warrantyDate) {
        const expiryDate = dayjs(warrantyDate);
        const daysLeft = expiryDate.diff(today, 'day');
        if (daysLeft >= 0 && daysLeft <= 60) { // Show items expiring within 60 days
          expiring.push({
            equipment_id: eq.equipment_id,
            equipment_name: eq.equipment_name || eq.name || `Equipment ${eq.equipment_id}`,
            amc_end: expiryDate.format('DD MMM YYYY'),
            days_left: daysLeft
          });
        }
      }
    });

    return expiring.sort((a, b) => a.days_left - b.days_left);
  }, [equipment]);

  const createHistoryMutation = useApiMutation(
    (data) => MaintenanceHistoryService.create(data),
    {
      successMessage: 'Maintenance scheduled successfully',
      onSuccess: () => {
        setModalOpen(false);
        form.resetFields();
        refetchHistory();
      }
    }
  );

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const items = maintenanceSchedule.filter(m => m.date === dateStr);
    return items.map(item => ({
      type: item.type === 'Preventive' ? 'success' : item.status === 'Completed' ? 'default' : 'error',
      content: `${item.equipment_name} - ${item.type}`
    }));
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map((item, index) => (
          <li key={index} style={{ fontSize: 11 }}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const handleScheduleMaintenance = async (values) => {
    try {
      await createHistoryMutation.mutateAsync({
        equipment_id: values.equipment_id,
        maintenance_type: values.maintenance_type,
        maintenance_date: values.scheduled_date.format('YYYY-MM-DD'),
        vendor: values.vendor,
        notes: values.notes,
        status: 'Scheduled'
      });
    } catch (error) {
      message.error('Failed to schedule maintenance');
    }
  };

  return (
    <div>
      <Alert
        message="AMC Expiring Soon"
        description={
          <List
            size="small"
            dataSource={amcExpiring}
            renderItem={item => (
              <List.Item>
                <WarningOutlined style={{ color: item.days_left <= 15 ? '#ef4444' : '#f59e0b', marginRight: 8 }} />
                <strong>{item.equipment_name}</strong> - AMC expires in {item.days_left} days ({item.amc_end})
              </List.Item>
            )}
          />
        }
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        title={
          <span>
            <ToolOutlined /> Equipment Maintenance Calendar
          </span>
        }
        extra={<Button type="primary" onClick={() => setModalOpen(true)}>Schedule Maintenance</Button>}
      >
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={(date) => setSelectedDate(date)}
        />
      </Card>

      <Card title="Maintenance Schedule" style={{ marginTop: 16 }}>
        <List
          dataSource={maintenanceSchedule}
          renderItem={item => (
            <List.Item
              actions={[
                <Tag color={item.status === 'Scheduled' ? 'blue' : item.status === 'In Progress' ? 'orange' : 'green'}>
                  {item.status}
                </Tag>
              ]}
            >
              <List.Item.Meta
                avatar={item.type === 'Preventive' ? <CheckCircleOutlined style={{ fontSize: 24, color: '#10b981' }} /> : <WarningOutlined style={{ fontSize: 24, color: '#ef4444' }} />}
                title={item.equipment_name}
                description={`${item.type} Maintenance - ${dayjs(item.date).format('DD MMM YYYY')}`}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="Schedule Maintenance"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleScheduleMaintenance}>
          <Form.Item name="equipment_id" label="Equipment" rules={[{ required: true }]}>
            <Select
              placeholder="Select equipment"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => option?.children?.toLowerCase().includes(input.toLowerCase())}
            >
              {(equipment?.data || []).map(eq => (
                <Select.Option key={eq.equipment_id} value={eq.equipment_id}>
                  {eq.equipment_name || eq.name || `Equipment ${eq.equipment_id}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="maintenance_type" label="Maintenance Type" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Preventive Maintenance', value: 'Preventive' },
                { label: 'Breakdown Repair', value: 'Breakdown' },
                { label: 'Calibration', value: 'Calibration' },
                { label: 'AMC Service', value: 'AMC' }
              ]}
            />
          </Form.Item>
          <Form.Item name="scheduled_date" label="Scheduled Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="vendor" label="Service Vendor">
            <Input placeholder="Vendor name" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentMaintenanceCalendar;
