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

  const handlePrint = () => {
    const p = selectedPrescription;
    if (!p) return;
    const patientName = `${p.patient?.first_name || ''} ${p.patient?.last_name || ''}`.trim() || 'N/A';
    const html = `<html><head><title>Prescription #${p.prescription_id}</title><style>
      body{font-family:Arial,sans-serif;margin:28px;color:#111;font-size:13px}
      h2{text-align:center;margin:0 0 2px}
      .sub{text-align:center;color:#666;margin-bottom:16px}
      .meta{display:flex;justify-content:space-between;border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:12px}
      .rx{font-size:26px;font-weight:bold;margin:8px 0}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      th,td{border:1px solid #ddd;padding:7px 10px;text-align:left}
      th{background:#f3f4f6}
      .foot{margin-top:48px;text-align:right}
    </style></head><body>
      <h2>Prescription</h2>
      <div class="sub">#${p.prescription_id} • ${dayjs(p.prescribed_at).format('DD MMM YYYY, hh:mm A')}</div>
      <div class="meta">
        <div><b>Patient:</b> ${patientName}<br/><b>UHID:</b> ${p.patient?.uhid || 'N/A'}</div>
        <div><b>Prescribed by:</b> ${p.prescribedBy?.name || '—'}</div>
      </div>
      <div class="rx">℞</div>
      <table>
        <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Route</th><th>Duration</th><th>Qty</th></tr></thead>
        <tbody><tr>
          <td>${p.medicine_name || '-'}</td>
          <td>${p.dosage || '-'}</td>
          <td>${p.frequency || '-'}</td>
          <td>${p.route || '-'}</td>
          <td>${p.duration || '-'}</td>
          <td>${p.quantity ?? '-'}</td>
        </tr></tbody>
      </table>
      ${p.instructions ? `<p style="margin-top:12px"><b>Instructions:</b> ${p.instructions}</p>` : ''}
      <div class="foot"><p>____________________________</p><p>Doctor's Signature</p></div>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
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
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
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
