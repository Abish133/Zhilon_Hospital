import { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Button, Space, Descriptions } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { MedicineBoxOutlined, EyeOutlined, SearchOutlined, PrinterOutlined } from '@ant-design/icons';
import { opdPrescriptionService } from '@/services';
import dayjs from 'dayjs';

const OPDPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await opdPrescriptionService.getAll();
      if (response.success) {
        setPrescriptions(response.data || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record) => {
    setSelectedPrescription(record);
    setViewModalVisible(true);
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patient?.first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    p.patient?.last_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    p.medicine_name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Prescription ID',
      dataIndex: 'prescription_id',
      key: 'id',
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div>{record.patient?.first_name} {record.patient?.last_name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>UHID: {record.patient?.uhid}</div>
        </div>
      )
    },
    {
      title: 'Medicine',
      dataIndex: 'medicine_name',
      key: 'medicine'
    },
    {
      title: 'Dosage',
      dataIndex: 'dosage',
      key: 'dosage'
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency'
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: 'Prescribed By',
      key: 'doctor',
      render: (_, record) => record.prescribedBy?.name
    },
    {
      title: 'Date',
      dataIndex: 'prescribed_at',
      key: 'date',
      render: (date) => dayjs(date).format('DD MMM YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <MedicineBoxOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <span>OPD Prescriptions</span>
          </Space>
        }
        extra={
          <Input
            placeholder="Search by patient or medicine"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filteredPrescriptions}
          rowKey="prescription_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <SliderModal
        title="Prescription Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />}>
            Print
          </Button>,
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedPrescription && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Prescription ID" span={2}>
              #{selectedPrescription.prescription_id}
            </Descriptions.Item>
            <Descriptions.Item label="Patient">
              {selectedPrescription.patient?.first_name} {selectedPrescription.patient?.last_name}
            </Descriptions.Item>
            <Descriptions.Item label="UHID">
              {selectedPrescription.patient?.uhid}
            </Descriptions.Item>
            <Descriptions.Item label="Medicine" span={2}>
              {selectedPrescription.medicine_name}
            </Descriptions.Item>
            <Descriptions.Item label="Dosage">
              {selectedPrescription.dosage}
            </Descriptions.Item>
            <Descriptions.Item label="Frequency">
              {selectedPrescription.frequency}
            </Descriptions.Item>
            <Descriptions.Item label="Route">
              {selectedPrescription.route}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {selectedPrescription.duration}
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">
              {selectedPrescription.quantity}
            </Descriptions.Item>
            <Descriptions.Item label="Prescribed By">
              {selectedPrescription.prescribedBy?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Instructions" span={2}>
              {selectedPrescription.instructions || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Prescribed Date" span={2}>
              {dayjs(selectedPrescription.prescribed_at).format('DD MMM YYYY hh:mm A')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </SliderModal>
    </div>
  );
};

export default OPDPrescriptions;
