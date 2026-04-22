import { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Button, Space, message, Divider } from 'antd';
import { FilePdfOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { labOrderService, labOrderDetailService, labResultService } from '@/services';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const LabReport = () => {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [results, setResults] = useState([]);
  const { order_id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (order_id) {
      fetchReportData();
    }
  }, [order_id]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [orderRes, detailsRes, resultsRes] = await Promise.all([
        labOrderService.getById(order_id),
        labOrderDetailService.getAll({ order_id }),
        labResultService.getAll({ order_id })
      ]);

      if (orderRes.success) setOrder(orderRes.data);
      if (detailsRes.success) setOrderDetails(detailsRes.data || []);
      if (resultsRes.success) setResults(resultsRes.data || []);
    } catch (error) {
      message.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    message.info('PDF download functionality will be implemented');
  };

  const columns = [
    {
      title: 'Test Name',
      dataIndex: 'test_name',
      key: 'test_name',
      render: (_, record) => {
        const detail = orderDetails.find(d => d.detail_id === record.detail_id);
        return detail?.test_name || 'N/A';
      }
    },
    {
      title: 'Result',
      dataIndex: 'result_data',
      key: 'result_data',
      render: (result) => <strong>{result}</strong>
    },
    {
      title: 'Interpretation',
      dataIndex: 'interpretation',
      key: 'interpretation',
      render: (interpretation) => {
        const colors = {
          'Normal': 'green',
          'Abnormal': 'red',
          'High': 'orange',
          'Low': 'blue'
        };
        return (
          <span style={{ color: colors[interpretation] || 'black' }}>
            {interpretation}
          </span>
        );
      }
    },
    {
      title: 'Critical',
      dataIndex: 'critical_value',
      key: 'critical_value',
      render: (critical) => critical ? <span style={{ color: 'red', fontWeight: 'bold' }}>YES</span> : 'No'
    }
  ];

  if (!order) return null;

  return (
    <div className="lab-report-container">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .lab-report-container { padding: 20px; }
        }
      `}</style>

      <Card
        title="Laboratory Report"
        extra={
          <Space className="no-print">
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              Download PDF
            </Button>
            <Button onClick={() => navigate('/lab')}>
              Back to Orders
            </Button>
          </Space>
        }
      >
        {/* Hospital Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>{order.hospital?.hospitalName || 'Hospital Name'}</h2>
          <p style={{ margin: 0, color: '#666' }}>Laboratory Department</p>
          <p style={{ margin: 0, color: '#666' }}>Contact: +91-XXXXXXXXXX | Email: lab@hospital.com</p>
        </div>

        <Divider />

        {/* Report Header */}
        <div style={{ marginBottom: 24 }}>
          <h3>LABORATORY INVESTIGATION REPORT</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>Report ID:</strong> LAB-{order.order_id}
            </div>
            <div>
              <strong>Report Date:</strong> {dayjs().format('DD MMM YYYY')}
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <Card size="small" style={{ marginBottom: 16, background: '#f9f9f9' }}>
          <Descriptions title="Patient Information" column={2} bordered size="small">
            <Descriptions.Item label="Patient Name">
              {order.patient?.first_name} {order.patient?.last_name}
            </Descriptions.Item>
            <Descriptions.Item label="UHID">
              {order.uhid}
            </Descriptions.Item>
            <Descriptions.Item label="Age/Gender">
              {order.patient?.age || 'N/A'} / {order.patient?.gender || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Contact">
              {order.patient?.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Referred By">
              {order.orderedBy?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Visit Type">
              {order.visit_type}
            </Descriptions.Item>
            <Descriptions.Item label="Sample Collection Date">
              {dayjs(order.order_date).format('DD MMM YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Report Generation Date">
              {dayjs().format('DD MMM YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Test Results */}
        <Divider>Test Results</Divider>

        <Table
          columns={columns}
          dataSource={results}
          rowKey="result_id"
          loading={loading}
          pagination={false}
          bordered
          size="middle"
        />

        {/* Critical Values Alert */}
        {results.some(r => r.critical_value) && (
          <Card 
            size="small" 
            style={{ 
              marginTop: 16, 
              background: '#fff2e8', 
              borderColor: '#ff7a45' 
            }}
          >
            <strong style={{ color: '#d4380d' }}>⚠️ CRITICAL VALUES DETECTED</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              Some test results show critical values. Please consult with the referring physician immediately.
            </p>
          </Card>
        )}

        {/* Footer */}
        <Divider />

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: 8, width: 200 }}>
                Lab Technician
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {results[0]?.enteredBy?.username || 'Lab Staff'}
              </div>
            </div>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: 8, width: 200 }}>
                Verified By
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {results[0]?.verifiedBy?.username || 'Pathologist'}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: 40, fontSize: 11, color: '#666', borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <p><strong>Note:</strong></p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>This report is valid only with authorized signature and hospital stamp</li>
            <li>Results are based on the sample provided and testing methodology used</li>
            <li>For any queries, please contact the laboratory department</li>
            <li>This is a computer-generated report and does not require a signature if digitally verified</li>
          </ul>
        </div>

        {/* Report Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: '#999' }}>
          <p>*** End of Report ***</p>
          <p>Generated on {dayjs().format('DD MMM YYYY HH:mm:ss')}</p>
        </div>
      </Card>
    </div>
  );
};

export default LabReport;
