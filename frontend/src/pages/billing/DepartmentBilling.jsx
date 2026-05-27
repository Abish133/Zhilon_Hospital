import { useState } from 'react';
import { Space, Button, Tag, Card, Row, Col, Statistic, message, Input } from 'antd';
import { FileTextOutlined, SearchOutlined, DollarOutlined, MedicineBoxOutlined, ExperimentOutlined, UserOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import { useApiQuery } from '@hooks/useApi';
import { formatCurrency, formatDate } from '@utils/helpers';
import { useNavigate } from 'react-router-dom';
import apiClient from '@services/apiClient';

const DepartmentBilling = ({ departmentType, serviceTypeMap }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Use the new endpoint created for department summaries
  const { data: summaryData, isLoading } = useApiQuery(
    ['department-summary', serviceTypeMap],
    async () => {
      const response = await apiClient.get(`/bill-charges/department-summary?type=${serviceTypeMap}`);
      return response;
    }
  );

  const bills = summaryData?.data || [];

  // Client-side filtering by patient name or UHID if search is provided
  const filteredBills = bills.filter(bill => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = `${bill.patient?.first_name || ''} ${bill.patient?.last_name || ''}`.toLowerCase().includes(q);
    const uhidMatch = (bill.patient?.uhid || '').toLowerCase().includes(q);
    return nameMatch || uhidMatch;
  });

  const getDepartmentIcon = () => {
    switch(departmentType) {
      case 'Pharmacy': return <MedicineBoxOutlined />;
      case 'Laboratory': return <ExperimentOutlined />;
      case 'OPD': return <UserOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const columns = [
    { 
      title: 'Patient', 
      key: 'patient', 
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.patient?.first_name} {r.patient?.last_name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>UHID: {r.patient?.uhid}</div>
        </div>
      ) 
    },
    { 
      title: 'Episode', 
      dataIndex: 'episode_type', 
      width: 100, 
      render: (t) => <Tag color={t === 'OPD' ? 'blue' : 'green'}>{t}</Tag> 
    },
    { 
      title: 'Episode Date', 
      dataIndex: 'start_date', 
      render: (d) => formatDate(d) 
    },
    { 
      title: 'Pending Amount', 
      dataIndex: 'department_balance_amount', 
      render: (a) => <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(a)}</span> 
    },
    { 
      title: 'Paid Amount', 
      dataIndex: 'department_paid_amount', 
      render: (a) => <span style={{ color: '#10b981' }}>{formatCurrency(a)}</span> 
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const balance = record.department_balance_amount || 0;
        const paid = record.department_paid_amount || 0;
        if (balance <= 0 && paid > 0) return <Tag color="green">Paid</Tag>;
        if (balance <= 0 && paid === 0) return <Tag color="green">Paid</Tag>;
        if (paid > 0) return <Tag color="orange">Partially Paid</Tag>;
        return <Tag color="red">Pending</Tag>;
      }
    },
    {
      title: 'Actions', 
      key: 'actions', 
      fixed: 'right', 
      width: 150,
      render: (_, record) => {
        const isPaid = (record.department_balance_amount || 0) <= 0 && (record.department_paid_amount || 0) > 0;
        return (
          <Space size={4}>
            <Button 
              icon={<DollarOutlined />} 
              size="small" 
              type={isPaid ? "default" : "primary"} 
              onClick={() => navigate(`/billing/generate/${record.episode_id}?department=${serviceTypeMap}`)}
            >
              {isPaid ? 'View / Receipt' : 'Collect Payment'}
            </Button>
          </Space>
        );
      }
    }
  ];

  // Calculate high level totals
  const totalPending = filteredBills.reduce((sum, b) => sum + (b.department_balance_amount || 0), 0);
  const totalPaid = filteredBills.reduce((sum, b) => sum + (b.department_paid_amount || 0), 0);

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title={`${departmentType} Revenue Collected`} 
              value={totalPaid} 
              formatter={(v) => formatCurrency(v)} 
              valueStyle={{ color: '#10b981' }} 
              prefix={getDepartmentIcon()}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title={`${departmentType} Pending Collection`} 
              value={totalPending} 
              formatter={(v) => formatCurrency(v)} 
              valueStyle={{ color: '#ef4444' }} 
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title={`Active ${departmentType} Patients`} 
              value={filteredBills.length} 
              valueStyle={{ color: '#f59e0b' }} 
            />
          </Card>
        </Col>
      </Row>
      <Card title={`${departmentType} Billing Queue`}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input 
              placeholder="Search by UHID or Patient Name" 
              prefix={<SearchOutlined />} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              allowClear 
            />
          </Col>
        </Row>
        <DataTable 
          columns={columns} 
          dataSource={filteredBills} 
          loading={isLoading} 
          rowKey="episode_id" 
        />
      </Card>
    </div>
  );
};

export default DepartmentBilling;
