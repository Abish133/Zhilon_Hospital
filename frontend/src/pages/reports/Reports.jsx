import { Card, Row, Col, Select, DatePicker, Button, Space, Statistic, message, Spin, Table } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@utils/helpers';
import { generateReportPDF } from '@utils/pdfGenerator';
import ReportService from '@services/ReportService';

const { RangePicker } = DatePicker;

const Reports = () => {
  const [reportType, setReportType] = useState('opd');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const reportTypes = [
    { label: 'OPD Statistics', value: 'opd' },
    { label: 'IPD Occupancy', value: 'ipd' },
    { label: 'Revenue Report', value: 'revenue' },
    { label: 'Doctor Performance', value: 'doctor' },
    { label: 'Stock Expiry', value: 'expiry' },
    { label: 'Outstanding Payments', value: 'outstanding' },
    { label: 'Inventory Consumption', value: 'consumption' }
  ];

  const handleGenerate = async () => {
    if (!reportType) {
      message.error('Please select a report type');
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (dateRange) {
        params.from = dateRange[0]?.format('YYYY-MM-DD');
        params.to = dateRange[1]?.format('YYYY-MM-DD');
      }

      let response;
      switch (reportType) {
        case 'opd':
          response = await ReportService.getOPDFootfall(params);
          break;
        case 'ipd':
          response = await ReportService.getIPDOccupancy(params);
          break;
        case 'revenue':
          response = await ReportService.getRevenue(params);
          break;
        case 'doctor':
          response = await ReportService.getDoctorPerformance(params);
          break;
        case 'expiry':
          response = await ReportService.getStockExpiry(params);
          break;
        case 'outstanding':
          response = await ReportService.getOutstandingPayments(params);
          break;
        case 'consumption':
          response = await ReportService.getInventoryConsumption(params);
          break;
        default:
          response = null;
      }

      if (response?.data?.success) {
        setReportData(response.data.data);
        message.success('Report generated successfully');
      } else {
        message.error('Failed to generate report');
      }
    } catch (error) {
      message.error(error.message || 'Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const params = {};
      if (dateRange) {
        params.from = dateRange[0]?.format('YYYY-MM-DD');
        params.to = dateRange[1]?.format('YYYY-MM-DD');
      }

      if (type === 'PDF') {
        const exportResponse = await ReportService.exportReport(`${reportType}_pdf`, params);
        const url = window.URL.createObjectURL(new Blob([exportResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}-report.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
      }
      message.success(`Exporting to ${type}...`);
    } catch (error) {
      message.error('Export failed');
    }
  };

  return (
    <div>
      <Card title="Generate Reports">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Select Report Type"
              style={{ width: '100%' }}
              options={reportTypes}
              value={reportType}
              onChange={setReportType}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker 
              style={{ width: '100%' }} 
              onChange={(dates) => setDateRange(dates)}
            />
          </Col>
          <Col xs={24} sm={24} md={10}>
            <Space style={{ width: '100%' }}>
              <Button 
                type="primary" 
                loading={loading} 
                onClick={handleGenerate}
                style={{ flex: 1 }}
              >
                Generate
              </Button>
              <Button 
                icon={<FilePdfOutlined />} 
                danger 
                onClick={() => handleExport('PDF')}
              >
                Export PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {reportData && Array.isArray(reportData) && reportData.length > 0 && (
          <Card style={{ marginTop: 16 }} title="Report Details">
            <Table
              columns={Object.keys(reportData[0]).map(key => ({
                title: key.replace(/_/g, ' ').toUpperCase(),
                dataIndex: key,
                key: key,
                render: (text) => {
                  try {
                    const num = parseFloat(text);
                    return !isNaN(num) ? num.toLocaleString() : text;
                  } catch {
                    return text;
                  }
                },
                sorter: (a, b) => {
                  const aVal = parseFloat(a[key]) || a[key];
                  const bVal = parseFloat(b[key]) || b[key];
                  return aVal > bVal ? 1 : -1;
                }
              }))}
              dataSource={reportData.map((item, idx) => ({ ...item, key: idx }))}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 'max-content' }}
              bordered
              size="small"
            />
          </Card>
        )}
        {reportData && Array.isArray(reportData) && reportData.length === 0 && (
          <Card style={{ marginTop: 16, textAlign: 'center' }}>
            <p style={{ color: '#999' }}>No data available for the selected report</p>
          </Card>
        )}
        {reportData === null && !loading && (
          <Card style={{ marginTop: 16, textAlign: 'center' }}>
            <p style={{ color: '#999' }}>Select a report type and click Generate to view data</p>
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default Reports;
