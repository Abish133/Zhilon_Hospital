import { Card, Row, Col, Statistic, Progress, Table } from 'antd';
import { 
  UserOutlined, DollarOutlined, MedicineBoxOutlined, 
  ExperimentOutlined, ArrowUpOutlined, ArrowDownOutlined 
} from '@ant-design/icons';

const AnalyticsDashboard = () => {
  const revenueData = [
    { month: 'Jan', opd: 250000, ipd: 800000, pharmacy: 150000, lab: 100000 },
    { month: 'Feb', opd: 280000, ipd: 850000, pharmacy: 170000, lab: 120000 },
    { month: 'Mar', opd: 300000, ipd: 900000, pharmacy: 180000, lab: 130000 }
  ];

  const topDoctors = [
    { name: 'Dr. Sharma', patients: 245, revenue: 245000, rating: 4.8 },
    { name: 'Dr. Kumar', patients: 198, revenue: 198000, rating: 4.7 },
    { name: 'Dr. Patel', patients: 176, revenue: 176000, rating: 4.6 }
  ];

  const departmentStats = [
    { department: 'Cardiology', patients: 450, revenue: 1200000, occupancy: 85 },
    { department: 'Orthopedics', patients: 380, revenue: 950000, occupancy: 72 },
    { department: 'Pediatrics', patients: 520, revenue: 780000, occupancy: 68 }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue (This Month)"
              value={2850000}
              prefix="₹"
              suffix={<ArrowUpOutlined style={{ color: '#10b981' }} />}
              styles={{ value: { color: '#6366f1' } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              +12.5% from last month
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Patients"
              value={1847}
              prefix={<UserOutlined />}
              styles={{ value: { color: '#10b981' } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              +8.2% from last month
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bed Occupancy"
              value={78}
              suffix="%"
              styles={{ value: { color: '#f59e0b' } }}
            />
            <Progress percent={78} strokeColor="#f59e0b" showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Outstanding Payments"
              value={245000}
              prefix="₹"
              styles={{ value: { color: '#ef4444' } }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              15 pending bills
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Revenue Breakdown (Last 3 Months)">
            <Table
              dataSource={revenueData}
              pagination={false}
              size="small"
              columns={[
                { title: 'Month', dataIndex: 'month', key: 'month' },
                { title: 'OPD', dataIndex: 'opd', key: 'opd', render: (val) => `₹${val.toLocaleString()}` },
                { title: 'IPD', dataIndex: 'ipd', key: 'ipd', render: (val) => `₹${val.toLocaleString()}` },
                { title: 'Pharmacy', dataIndex: 'pharmacy', key: 'pharmacy', render: (val) => `₹${val.toLocaleString()}` },
                { title: 'Lab', dataIndex: 'lab', key: 'lab', render: (val) => `₹${val.toLocaleString()}` }
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Top Performing Doctors">
            <Table
              dataSource={topDoctors}
              pagination={false}
              size="small"
              columns={[
                { title: 'Doctor', dataIndex: 'name', key: 'name' },
                { title: 'Patients', dataIndex: 'patients', key: 'patients' },
                { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (val) => `₹${val.toLocaleString()}` },
                { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (val) => `⭐ ${val}` }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Department Performance">
            <Table
              dataSource={departmentStats}
              pagination={false}
              columns={[
                { title: 'Department', dataIndex: 'department', key: 'department' },
                { title: 'Patients', dataIndex: 'patients', key: 'patients' },
                { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (val) => `₹${val.toLocaleString()}` },
                { 
                  title: 'Occupancy', 
                  dataIndex: 'occupancy', 
                  key: 'occupancy',
                  render: (val) => <Progress percent={val} size="small" />
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsDashboard;
