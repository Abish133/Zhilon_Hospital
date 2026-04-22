import { useState } from 'react';
import { Card, Tabs, DatePicker, Button, Table, Space, message } from 'antd';
import { FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/PageHeader';
import { useApiQuery } from '@hooks/useApi';
import { reportService } from '@services/index';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const DetailedReports = () => {
  const [activeTab, setActiveTab] = useState('opd');
  const [filters, setFilters] = useState({
    from: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD')
  });

  const { data: opdData, isLoading: opdLoading } = useApiQuery(
    ['opd-report', filters],
    () => reportService.getOPDFootfall(filters),
    { enabled: activeTab === 'opd' }
  );

  const { data: ipdData, isLoading: ipdLoading } = useApiQuery(
    ['ipd-report', filters],
    () => reportService.getIPDOccupancy(filters),
    { enabled: activeTab === 'ipd' }
  );

  const { data: revenueData, isLoading: revenueLoading } = useApiQuery(
    ['revenue-report', filters],
    () => reportService.getRevenue(filters),
    { enabled: activeTab === 'revenue' }
  );

  const { data: doctorData, isLoading: doctorLoading } = useApiQuery(
    ['doctor-report', filters],
    () => reportService.getDoctorPerformance(filters),
    { enabled: activeTab === 'doctor' }
  );

  const { data: stockData, isLoading: stockLoading } = useApiQuery(
    ['stock-report', { months: 6 }],
    () => reportService.getStockExpiry({ months: 6 }),
    { enabled: activeTab === 'stock' }
  );

  const { data: paymentsData, isLoading: paymentsLoading } = useApiQuery(
    ['payments-report', filters],
    () => reportService.getOutstandingPayments(filters),
    { enabled: activeTab === 'payments' }
  );

  const reportTypeMap = {
    opd: 'opd-statistics',
    ipd: 'ipd-occupancy',
    revenue: 'revenue',
    doctor: 'doctor-performance',
    stock: 'expiring-batches',
    payments: 'outstanding-payments'
  };

  const handleExport = async (format) => {
    try {
      const reportType = reportTypeMap[activeTab] || activeTab;
      const blob = await reportService.exportReport(reportType, {
        from_date: filters.from,
        to_date: filters.to,
        format
      });
      const mime = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';
      const url = window.URL.createObjectURL(new Blob([blob], { type: mime }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}-report-${dayjs().format('YYYY-MM-DD')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Report exported successfully');
    } catch (error) {
      message.error(error?.message || 'Export failed');
    }
  };

  const FilterBar = () => (
    <Space style={{ marginBottom: 16 }}>
      <RangePicker
        value={[dayjs(filters.from), dayjs(filters.to)]}
        onChange={(dates) => {
          if (dates) {
            setFilters({
              from: dates[0].format('YYYY-MM-DD'),
              to: dates[1].format('YYYY-MM-DD')
            });
          }
        }}
      />
      <Button icon={<FileExcelOutlined />} onClick={() => handleExport('xlsx')}>
        Export Excel
      </Button>
      <Button icon={<FileTextOutlined />} onClick={() => handleExport('csv')}>
        Export CSV
      </Button>
    </Space>
  );

  const opdColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Total Appointments', dataIndex: 'total_appointments', key: 'total_appointments' },
    { title: 'Completed', dataIndex: 'completed', key: 'completed' },
    { title: 'Cancelled', dataIndex: 'cancelled', key: 'cancelled' },
    { title: 'No Show', dataIndex: 'no_show', key: 'no_show' }
  ];

  const ipdColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Total Beds', dataIndex: 'total_beds', key: 'total_beds' },
    { title: 'Occupied', dataIndex: 'occupied', key: 'occupied' },
    { title: 'Available', dataIndex: 'available', key: 'available' },
    { title: 'Occupancy %', dataIndex: 'occupancy_rate', key: 'occupancy_rate', render: (val) => `${val}%` }
  ];

  const revenueColumns = [
    { title: 'Service', dataIndex: 'service', key: 'service' },
    { title: 'Count', dataIndex: 'count', key: 'count' },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (val) => `₹${val != null ? Number(val).toFixed(2) : '0.00'}` }
  ];

  const doctorColumns = [
    { title: 'Doctor', dataIndex: 'doctor_name', key: 'doctor_name' },
    { title: 'Consultations', dataIndex: 'consultations', key: 'consultations' },
    { title: 'Surgeries', dataIndex: 'surgeries', key: 'surgeries' },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (val) => `₹${val != null ? Number(val).toFixed(2) : '0.00'}` }
  ];

  const stockColumns = [
    { title: 'Item', dataIndex: 'item_name', key: 'item_name' },
    { title: 'Batch', dataIndex: 'batch_number', key: 'batch_number' },
    { title: 'Expiry Date', dataIndex: 'expiry_date', key: 'expiry_date' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Days to Expiry', dataIndex: 'days_to_expiry', key: 'days_to_expiry' }
  ];

  const paymentsColumns = [
    { title: 'Bill No', dataIndex: 'bill_number', key: 'bill_number' },
    { title: 'Patient', dataIndex: 'patient_name', key: 'patient_name' },
    { title: 'Bill Amount', dataIndex: 'bill_amount', key: 'bill_amount', render: (val) => `₹${val != null ? Number(val).toFixed(2) : '0.00'}` },
    { title: 'Paid', dataIndex: 'paid_amount', key: 'paid_amount', render: (val) => `₹${val != null ? Number(val).toFixed(2) : '0.00'}` },
    { title: 'Outstanding', dataIndex: 'outstanding', key: 'outstanding', render: (val) => `₹${val != null ? Number(val).toFixed(2) : '0.00'}` }
  ];

  return (
    <div>
      <PageHeader title="Detailed Reports" />
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="OPD Footfall" key="opd">
            <FilterBar />
            <Table columns={opdColumns} dataSource={opdData?.data || []} loading={opdLoading} />
          </TabPane>
          <TabPane tab="IPD Occupancy" key="ipd">
            <FilterBar />
            <Table columns={ipdColumns} dataSource={ipdData?.data || []} loading={ipdLoading} />
          </TabPane>
          <TabPane tab="Revenue" key="revenue">
            <FilterBar />
            <Table columns={revenueColumns} dataSource={revenueData?.data || []} loading={revenueLoading} />
          </TabPane>
          <TabPane tab="Doctor Performance" key="doctor">
            <FilterBar />
            <Table columns={doctorColumns} dataSource={doctorData?.data || []} loading={doctorLoading} />
          </TabPane>
          <TabPane tab="Stock Expiry" key="stock">
            <Space style={{ marginBottom: 16 }}>
              <Button icon={<FileExcelOutlined />} onClick={() => handleExport('xlsx')}>
                Export Excel
              </Button>
            </Space>
            <Table columns={stockColumns} dataSource={stockData?.data || []} loading={stockLoading} />
          </TabPane>
          <TabPane tab="Outstanding Payments" key="payments">
            <FilterBar />
            <Table columns={paymentsColumns} dataSource={paymentsData?.data || []} loading={paymentsLoading} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default DetailedReports;
