import { useState, useEffect } from 'react';
import { Card, Table, Tag, DatePicker, Select, Space, Input, Button, message, Descriptions } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { SearchOutlined, UserOutlined, ClockCircleOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { auditLogService } from '@/services';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      if (filters.from_date && filters.to_date) {
        params.from_date = filters.from_date;
        params.to_date = filters.to_date;
      }
      const response = await auditLogService.getAll(params);
      if (response.success) {
        setLogs(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedLog(record);
    setDetailModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const params = {
        ...filters,
        format: 'csv'
      };
      if (filters.from_date && filters.to_date) {
        params.from_date = filters.from_date;
        params.to_date = filters.to_date;
      }
      // apiClient interceptor unwraps response.data — for responseType:'blob'
      // that means `blob` IS the Blob, NOT an axios response wrapper.
      const blob = await auditLogService.export(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Audit logs exported successfully');
    } catch (error) {
      message.error('Failed to export audit logs');
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'date_range') {
      if (value) {
        setFilters({
          ...filters,
          from_date: value[0].format('YYYY-MM-DD'),
          to_date: value[1].format('YYYY-MM-DD')
        });
      } else {
        const { from_date, to_date, ...rest } = filters;
        setFilters(rest);
      }
    } else {
      setFilters({ ...filters, [key]: value });
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'green',
      UPDATE: 'blue',
      DELETE: 'red',
      LOGIN: 'purple',
      LOGOUT: 'default',
      VIEW: 'cyan',
      EXPORT: 'orange',
      PRINT: 'geekblue'
    };
    return colors[action] || 'default';
  };

  const columns = [
    { 
      title: 'Timestamp', 
      dataIndex: 'createdAt', 
      key: 'timestamp',
      width: 180,
      render: (val) => val ? <><ClockCircleOutlined /> {dayjs(val).format('YYYY-MM-DD HH:mm:ss')}</> : '-'
    },
    { 
      title: 'User', 
      key: 'user',
      width: 150,
      render: (_, record) => (
        <><UserOutlined /> {record.user?.name || 'System'}</>
      )
    },
    { 
      title: 'Action', 
      dataIndex: 'action_type', 
      key: 'action',
      width: 100,
      render: (action) => <Tag color={getActionColor(action)}>{action}</Tag>
    },
    { title: 'Entity', dataIndex: 'entity_type', key: 'entity', width: 120 },
    { title: 'Details', dataIndex: 'details', key: 'details', ellipsis: true },
    { title: 'IP Address', dataIndex: 'ip_address', key: 'ip', width: 140 },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
          View
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card 
        title="Audit Logs"
        extra={
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export
          </Button>
        }
      >
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
          <Space wrap>
            <RangePicker
              onChange={(dates) => handleFilterChange('date_range', dates)}
            />
            <Select
              placeholder="Filter by Action"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => handleFilterChange('action_type', value)}
              options={[
                { label: 'CREATE', value: 'CREATE' },
                { label: 'UPDATE', value: 'UPDATE' },
                { label: 'DELETE', value: 'DELETE' },
                { label: 'VIEW', value: 'VIEW' },
                { label: 'LOGIN', value: 'LOGIN' },
                { label: 'LOGOUT', value: 'LOGOUT' }
              ]}
            />
            <Select
              placeholder="Filter by Entity"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => handleFilterChange('entity_type', value)}
              options={[
                { label: 'Patient', value: 'Patient' },
                { label: 'OPD', value: 'OPD' },
                { label: 'IPD', value: 'IPD' },
                { label: 'Billing', value: 'Billing' },
                { label: 'Shift', value: 'Shift' },
                { label: 'Roster', value: 'Roster' },
                { label: 'Payroll', value: 'Payroll' }
              ]}
            />
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="log_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => setPagination(prev => ({ ...prev, page }))
          }}
        />
      </Card>

      {/* Detail Modal */}
      <SliderModal
        title="Audit Log Details"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Timestamp">
              {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedLog.user?.name || 'System'} ({selectedLog.user?.email || 'N/A'})
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              <Tag color={getActionColor(selectedLog.action_type)}>{selectedLog.action_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Entity Type">{selectedLog.entity_type}</Descriptions.Item>
            <Descriptions.Item label="Entity ID">{selectedLog.entity_id || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Request Method">{selectedLog.request_method}</Descriptions.Item>
            <Descriptions.Item label="Request URL">{selectedLog.request_url}</Descriptions.Item>
            <Descriptions.Item label="Response Status">
              <Tag color={selectedLog.response_status < 400 ? 'green' : 'red'}>
                {selectedLog.response_status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="IP Address">{selectedLog.ip_address}</Descriptions.Item>
            <Descriptions.Item label="User Agent">{selectedLog.user_agent}</Descriptions.Item>
            <Descriptions.Item label="Details">{selectedLog.details}</Descriptions.Item>
            {selectedLog.request_body && (
              <Descriptions.Item label="Request Body">
                <pre style={{ maxHeight: '200px', overflow: 'auto', background: '#f5f5f5', padding: '10px' }}>
                  {JSON.stringify(selectedLog.request_body, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </SliderModal>
    </div>
  );
};

export default AuditLogs;
