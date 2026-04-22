import { useState, useEffect } from 'react';
import {
  Card, Button, Row, Col, Select, DatePicker, Table, Statistic, Space, Form, Empty,
  message, Spin, Tag
} from 'antd';
import {
  DownloadOutlined, ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@services/apiClient';

const AdvancedReports = () => {
  const [selectedReport, setSelectedReport] = useState('patient-statistics');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reports = [
    { value: 'patient-statistics', label: 'Patient Statistics' },
    { value: 'doctor-productivity', label: 'Doctor Productivity' },
    { value: 'pharmacy-sales', label: 'Pharmacy Sales' },
    { value: 'inventory-expiry', label: 'Inventory Expiry' },
    { value: 'outstanding-payments', label: 'Outstanding Payments' },
    { value: 'bed-occupancy', label: 'Bed Occupancy' },
    { value: 'department-performance', label: 'Department Performance' },
    { value: 'revenue', label: 'Revenue Report' }
  ];

  // Map frontend report key → backend API path
  const reportEndpoints = {
    'patient-statistics': '/reports-advanced/patients/statistics',
    'doctor-productivity': '/reports-advanced/doctors/productivity',
    'pharmacy-sales': '/reports-advanced/pharmacy/sales',
    'inventory-expiry': '/reports-advanced/inventory/expiry',
    'outstanding-payments': '/reports-advanced/billing/outstanding',
    'bed-occupancy': '/reports-advanced/ipd/bed-occupancy',
    'department-performance': '/reports-advanced/departments/performance',
    'revenue': '/reports-advanced/billing/revenue'
  };

  const loadReport = async () => {
    const endpoint = reportEndpoints[selectedReport];
    if (!endpoint) {
      message.error('Unknown report type');
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.from_date = dateRange[0].format('YYYY-MM-DD');
        params.to_date = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await apiClient.get(endpoint, { params });
      const body = response.data;

      if (body?.success) {
        setReportData({
          title: reports.find(r => r.value === selectedReport)?.label || 'Report',
          data: body.data || [],
          summary: body.summary || null,
          count: body.count || 0
        });
      } else {
        message.error(body?.message || 'Failed to load report');
        setReportData(null);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || error.message || 'Failed to load report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedReport]);

  const handleDownload = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      message.warning('No data to download');
      return;
    }

    const csv = convertToCSV(reportData.data);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `${selectedReport}-${dayjs().format('YYYY-MM-DD')}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success('Report downloaded successfully');
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const firstRow = data[0];
    if (!firstRow || typeof firstRow !== 'object') return '';
    
    const headers = Object.keys(firstRow);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        // Escape commas and quotes in CSV values
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(','))
    ];
    return csv.join('\n');
  };

  const formatColumnValue = (text, key) => {
    if (text === null || text === undefined) return '—';
    // Format currency-like columns
    const currencyKeys = ['total_revenue', 'total_sales_amount', 'outstanding_amount', 'paid_amount', 'total_amount', 'stock_value', 'total_outstanding'];
    if (currencyKeys.includes(key)) {
      return `₹${parseFloat(text || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    // Format percentage columns
    if (key.includes('percentage') || key.includes('occupancy_rate')) {
      return `${parseFloat(text || 0).toFixed(1)}%`;
    }
    // Format date columns
    if (key.includes('date') && typeof text === 'string' && text.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dayjs(text).format('DD MMM YYYY');
    }
    // Format status columns
    if (key === 'status') {
      const colorMap = { 'EXPIRED': 'red', 'EXPIRING_SOON': 'orange', 'OK': 'green', 'LOW_STOCK': 'red', 'MEDIUM_STOCK': 'orange', 'SUFFICIENT': 'green' };
      return <Tag color={colorMap[text] || 'default'}>{text?.replace(/_/g, ' ')}</Tag>;
    }
    if (typeof text === 'number' && !Number.isInteger(text)) {
      return text.toFixed(2);
    }
    return text;
  };

  const renderReportContent = () => {
    if (!reportData) return <Empty description="Select a report and click Refresh" />;
    if (!reportData.data || reportData.data.length === 0) {
      return <Empty description="No data available for the selected filters" />;
    }

    // Safety check: ensure first row exists and is an object
    const firstRow = reportData.data[0];
    if (!firstRow || typeof firstRow !== 'object') {
      return <Empty description="Invalid data format" />;
    }

    const columns = Object.keys(firstRow).map(key => ({
      title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      dataIndex: key,
      key,
      render: (text) => formatColumnValue(text, key),
      sorter: (a, b) => {
        const aVal = parseFloat(a[key]);
        const bVal = parseFloat(b[key]);
        if (!isNaN(aVal) && !isNaN(bVal)) return aVal - bVal;
        return String(a[key] || '').localeCompare(String(b[key] || ''));
      }
    }));

    return (
      <div>
        {reportData.summary && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            {Object.entries(reportData.summary).map(([key, value]) => {
              const currencyKeys = ['total_revenue', 'total_outstanding', 'total_sales_amount'];
              const isCurrency = currencyKeys.includes(key);
              return (
                <Col xs={12} sm={6} key={key}>
                  <Card>
                    <Statistic
                      title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      value={typeof value === 'number' ? value : parseFloat(value) || 0}
                      prefix={isCurrency ? '₹' : undefined}
                      precision={isCurrency ? 2 : 0}
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        <Card style={{ marginTop: 16 }}>
          <Table
            columns={columns}
            dataSource={reportData.data.map((item, idx) => ({ ...item, key: idx }))}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
            bordered
            size="small"
          />
        </Card>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Advanced Reports</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
          Generate real-time reports from hospital data
        </p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Select Report">
                <Select
                  value={selectedReport}
                  onChange={setSelectedReport}
                  options={reports}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Date Range">
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={loadReport}
                loading={loading}
              >
                Generate Report
              </Button>
            </Col>
            <Col>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                disabled={!reportData || !reportData.data?.length}
              >
                Download CSV
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Spin spinning={loading}>
        {renderReportContent()}
      </Spin>
    </div>
  );
};

export default AdvancedReports;
