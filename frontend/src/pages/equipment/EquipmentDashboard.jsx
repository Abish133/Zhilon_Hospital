import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Alert, Progress, Tabs } from 'antd';
import { 
  ToolOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  HistoryOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EquipmentService from '@services/EquipmentService';
import MaintenanceRequestService from '@services/MaintenanceRequestService';
import MaintenanceHistoryService from '@services/MaintenanceHistoryService';
import PreventiveMaintenanceService from '@services/PreventiveMaintenanceService';
import { useApiQuery } from '@hooks/useApi';
import dayjs from 'dayjs';

const EquipmentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: equipment } = useApiQuery(['equipment'], () => EquipmentService.getAll());
  const { data: maintenanceRequests } = useApiQuery(['maintenance-requests'], () => MaintenanceRequestService.getAll());
  const { data: maintenanceHistory } = useApiQuery(['maintenance-history'], () => MaintenanceHistoryService.getAll());
  const { data: preventiveMaintenances } = useApiQuery(['preventive-maintenance'], () => PreventiveMaintenanceService.getAll());

  const getStats = () => {
    const equipmentData = equipment?.data || [];
    const requestsData = maintenanceRequests?.data || [];
    const historyData = maintenanceHistory?.data || [];
    const pmData = preventiveMaintenances?.data || [];

    const totalEquipment = equipmentData.length;
    const activeEquipment = equipmentData.filter(eq => eq.status === 'Active').length;
    const underMaintenance = equipmentData.filter(eq => eq.status === 'Under Maintenance').length;
    
    const pendingRequests = requestsData.filter(req => req.status === 'Reported').length;
    const inProgressRequests = requestsData.filter(req => req.status === 'In Progress').length;
    
    const thisMonthHistory = historyData.filter(hist => 
      dayjs(hist.maintenance_date).isAfter(dayjs().startOf('month'))
    ).length;

    const overduePM = pmData.filter(pm => 
      pm.next_pm_date && dayjs(pm.next_pm_date).isBefore(dayjs())
    ).length;

    const upcomingPM = pmData.filter(pm => 
      pm.next_pm_date && 
      dayjs(pm.next_pm_date).isAfter(dayjs()) && 
      dayjs(pm.next_pm_date).isBefore(dayjs().add(30, 'days'))
    ).length;

    return {
      totalEquipment,
      activeEquipment,
      underMaintenance,
      pendingRequests,
      inProgressRequests,
      thisMonthHistory,
      overduePM,
      upcomingPM
    };
  };

  const getAlerts = () => {
    const alerts = [];
    const equipmentData = equipment?.data || [];
    const pmData = preventiveMaintenances?.data || [];

    // AMC Expiring alerts
    equipmentData.forEach((eq) => {
      if (eq.amc_end) {
        const daysToExpiry = dayjs(eq.amc_end).diff(dayjs(), 'days');
        if (daysToExpiry <= 30 && daysToExpiry > 0) {
          alerts.push({ 
            type: 'warning', 
            message: `${eq.equipment_name} AMC expires in ${daysToExpiry} days`,
            action: () => navigate('/equipment')
          });
        } else if (daysToExpiry <= 0) {
          alerts.push({ 
            type: 'error', 
            message: `${eq.equipment_name} AMC expired`,
            action: () => navigate('/equipment')
          });
        }
      }
    });

    // Overdue PM alerts
    pmData.forEach((pm) => {
      if (pm.next_pm_date && dayjs(pm.next_pm_date).isBefore(dayjs())) {
        const daysOverdue = dayjs().diff(dayjs(pm.next_pm_date), 'days');
        alerts.push({ 
          type: 'error', 
          message: `${pm.equipment?.equipment_name} PM is ${daysOverdue} days overdue`,
          action: () => navigate('/equipment/preventive-maintenance')
        });
      }
    });

    return alerts;
  };

  const stats = getStats();
  const alerts = getAlerts();

  const recentRequestsColumns = [
    { title: 'ID', dataIndex: 'request_id', key: 'request_id', render: (id) => <Tag color="blue">#{id}</Tag> },
    { title: 'Equipment', dataIndex: ['equipment', 'equipment_name'], key: 'equipment_name' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p) => <Tag color={p === 'Critical' ? 'red' : 'orange'}>{p}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="blue">{s}</Tag> },
    { title: 'Date', dataIndex: 'request_date', key: 'request_date', render: (d) => dayjs(d).format('DD MMM') }
  ];

  const upcomingPMColumns = [
    { title: 'Equipment', dataIndex: ['equipment', 'equipment_name'], key: 'equipment_name' },
    { title: 'Schedule', dataIndex: 'pm_schedule', key: 'pm_schedule', render: (s) => <Tag color="green">{s}</Tag> },
    { title: 'Next PM', dataIndex: 'next_pm_date', key: 'next_pm_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
    { title: 'Days Left', key: 'days_left', render: (_, record) => {
      const days = dayjs(record.next_pm_date).diff(dayjs(), 'days');
      return <Tag color={days <= 7 ? 'red' : days <= 30 ? 'orange' : 'green'}>{days} days</Tag>;
    }}
  ];

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div>
          {alerts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {alerts.slice(0, 3).map((alert, index) => (
                <Alert
                  key={index}
                  type={alert.type}
                  message={alert.message}
                  style={{ marginBottom: 8 }}
                  action={
                    <Button size="small" onClick={alert.action}>
                      View
                    </Button>
                  }
                  closable
                />
              ))}
            </div>
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Total Equipment" 
                  value={stats.totalEquipment} 
                  prefix={<ToolOutlined />} 
                  valueStyle={{ color: '#0a0a0a' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Active Equipment" 
                  value={stats.activeEquipment} 
                  prefix={<CheckCircleOutlined />} 
                  valueStyle={{ color: '#10b981' }} 
                />
                <Progress 
                  percent={Math.round((stats.activeEquipment / stats.totalEquipment) * 100)} 
                  size="small" 
                  showInfo={false} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Under Maintenance" 
                  value={stats.underMaintenance} 
                  prefix={<WarningOutlined />} 
                  valueStyle={{ color: '#f59e0b' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Pending Requests" 
                  value={stats.pendingRequests} 
                  prefix={<ClockCircleOutlined />} 
                  valueStyle={{ color: '#ef4444' }} 
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="In Progress" 
                  value={stats.inProgressRequests} 
                  prefix={<ToolOutlined />} 
                  valueStyle={{ color: '#f59e0b' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="This Month History" 
                  value={stats.thisMonthHistory} 
                  prefix={<HistoryOutlined />} 
                  valueStyle={{ color: '#10b981' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Overdue PM" 
                  value={stats.overduePM} 
                  prefix={<WarningOutlined />} 
                  valueStyle={{ color: '#ef4444' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Upcoming PM" 
                  value={stats.upcomingPM} 
                  prefix={<ScheduleOutlined />} 
                  valueStyle={{ color: '#f59e0b' }} 
                />
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'requests',
      label: 'Recent Requests',
      children: (
        <Card 
          title="Recent Maintenance Requests" 
          extra={<Button onClick={() => navigate('/equipment/maintenance')}>View All</Button>}
        >
          <Table 
            columns={recentRequestsColumns} 
            dataSource={maintenanceRequests?.data?.slice(0, 10) || []} 
            rowKey="request_id" 
            pagination={false}
            size="small"
          />
        </Card>
      )
    },
    {
      key: 'preventive',
      label: 'Upcoming PM',
      children: (
        <Card 
          title="Upcoming Preventive Maintenance" 
          extra={<Button onClick={() => navigate('/equipment/preventive-maintenance')}>View All</Button>}
        >
          <Table 
            columns={upcomingPMColumns} 
            dataSource={preventiveMaintenances?.data?.filter(pm => 
              pm.next_pm_date && dayjs(pm.next_pm_date).isAfter(dayjs())
            ).slice(0, 10) || []} 
            rowKey="pm_id" 
            pagination={false}
            size="small"
          />
        </Card>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
          Equipment Maintenance Dashboard
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Monitor and manage all equipment maintenance activities
        </p>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ToolOutlined />} onClick={() => navigate('/equipment')}>
          Equipment List
        </Button>
        <Button icon={<CalendarOutlined />} onClick={() => navigate('/equipment/maintenance')}>
          Maintenance Requests
        </Button>
        <Button icon={<ScheduleOutlined />} onClick={() => navigate('/equipment/preventive-maintenance')}>
          Preventive Maintenance
        </Button>
        <Button icon={<HistoryOutlined />} onClick={() => navigate('/equipment/maintenance-history')}>
          Maintenance History
        </Button>
      </Space>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
};

export default EquipmentDashboard;