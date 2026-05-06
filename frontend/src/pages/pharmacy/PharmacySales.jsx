import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Descriptions } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { EyeOutlined } from '@ant-design/icons';
import { pharmacySaleService, pharmacySaleDetailService } from '@services';
import { formatCurrency } from '@utils/helpers';

// Fallback currency formatter if the import fails
const safeCurrency = (amount) => {
  try {
    return formatCurrency ? formatCurrency(amount) : `â‚¹${amount || 0}`;
  } catch {
    return `â‚¹${amount || 0}`;
  }
};

const PharmacySales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState([]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await pharmacySaleService.getAll();
      
      // Try different data extraction patterns
      let salesData = [];
      if (response?.success && response?.data) {
        salesData = Array.isArray(response.data) ? response.data : [];
      } else if (response?.data) {
        salesData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        salesData = response;
      }
      
      setSales(salesData);
    } catch (error) {
      message.error('Failed to fetch sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (sale) => {
    setSelectedSale(sale);
    setDetailsModal(true);
    try {
      const response = await pharmacySaleDetailService.getAll({ sale_id: sale.sale_id });
      const detailsData = response?.data?.data || response?.data || response || [];
      setSaleDetails(Array.isArray(detailsData) ? detailsData : []);
    } catch (error) {
      message.error('Failed to fetch sale details');
      setSaleDetails([]);
    }
  };

  const columns = [
    { 
      title: 'Sale ID', 
      dataIndex: 'sale_id', 
      key: 'sale_id',
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    { 
      title: 'Date', 
      dataIndex: 'sale_date', 
      key: 'sale_date',
      render: (date) => date ? new Date(date).toLocaleString('en-IN') : '-'
    },
    { 
      title: 'Patient', 
      key: 'patient',
      render: (_, record) => record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : '-'
    },
    { 
      title: 'UHID', 
      dataIndex: 'uhid', 
      key: 'uhid',
      render: (uhid) => <Tag>{uhid}</Tag>
    },
    { 
      title: 'Visit Type', 
      dataIndex: 'visit_type', 
      key: 'visit_type',
      render: (type) => <Tag color={type === 'OPD' ? 'green' : type === 'IPD' ? 'orange' : 'default'}>{type}</Tag>
    },
    { 
      title: 'Visit ID', 
      dataIndex: 'visit_id', 
      key: 'visit_id',
      render: (id, record) => {
        return id ? <Tag color="cyan">#{id}</Tag> : <span style={{color: '#999'}}>No Visit</span>;
      }
    },
    { 
      title: 'Prescription ID', 
      dataIndex: 'prescription_id', 
      key: 'prescription_id',
      render: (id, record) => {
        return id ? <Tag color="magenta">#{id}</Tag> : <span style={{color: '#999'}}>No Prescription</span>;
      }
    },
    { 
      title: 'Total', 
      dataIndex: 'total_amount', 
      key: 'total_amount',
      render: (amount) => safeCurrency(amount)
    },
    { 
      title: 'Tax', 
      dataIndex: 'tax_amount', 
      key: 'tax_amount',
      render: (amount) => safeCurrency(amount)
    },
    { 
      title: 'Net Amount', 
      dataIndex: 'net_amount', 
      key: 'net_amount',
      render: (amount) => <strong>{safeCurrency(amount)}</strong>
    },
    { 
      title: 'Payment', 
      dataIndex: 'payment_mode', 
      key: 'payment_mode',
      render: (mode) => <Tag color="purple">{mode}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewDetails(record)}
        >
          View
        </Button>
      )
    }
  ];

  const detailColumns = [
    { title: 'Medicine', dataIndex: 'medicine_name', key: 'medicine' },
    { title: 'Batch', key: 'batch', render: (_, record) => record.batch?.batch_number || '-' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', render: (rate) => safeCurrency(rate) },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount) => safeCurrency(amount) },
    { title: 'GST %', dataIndex: 'gst_percentage', key: 'gst' }
  ];

  return (
    <div>
      <Card title="Pharmacy Sales">
        <Table
          columns={columns}
          dataSource={sales}
          loading={loading}
          rowKey={(record) => record.sale_id || record.id || Math.random()}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: sales.length === 0 && !loading ? 'No sales data found' : 'Loading...' }}
        />
      </Card>

      <SliderModal
        title="Sale Details"
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        footer={null}
        width={800}
      >
        {selectedSale && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Sale ID">#{selectedSale.sale_id}</Descriptions.Item>
              <Descriptions.Item label="Date">{selectedSale.sale_date ? new Date(selectedSale.sale_date).toLocaleString('en-IN') : '-'}</Descriptions.Item>
              <Descriptions.Item label="Patient">
                {selectedSale.patient ? `${selectedSale.patient.first_name} ${selectedSale.patient.last_name}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="UHID">{selectedSale.uhid}</Descriptions.Item>
              <Descriptions.Item label="Visit Type">{selectedSale.visit_type}</Descriptions.Item>
              <Descriptions.Item label="Visit ID">{selectedSale.visit_id ? `#${selectedSale.visit_id}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Prescription ID">{selectedSale.prescription_id ? `#${selectedSale.prescription_id}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Payment Mode">{selectedSale.payment_mode}</Descriptions.Item>
              <Descriptions.Item label="Dispensed By">
                {selectedSale.dispensedBy?.username || '-'}
              </Descriptions.Item>
            </Descriptions>

            <h4>Items</h4>
            <Table
              columns={detailColumns}
              dataSource={saleDetails}
              pagination={false}
              size="small"
              rowKey="sale_detail_id"
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4} align="right"><strong>Total:</strong></Table.Summary.Cell>
                    <Table.Summary.Cell><strong>{safeCurrency(selectedSale.total_amount)}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4} align="right"><strong>Tax:</strong></Table.Summary.Cell>
                    <Table.Summary.Cell><strong>{safeCurrency(selectedSale.tax_amount)}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4} align="right"><strong>Net Amount:</strong></Table.Summary.Cell>
                    <Table.Summary.Cell><strong>{safeCurrency(selectedSale.net_amount)}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                </>
              )}
            />
          </>
        )}
      </SliderModal>
    </div>
  );
};

export default PharmacySales;
