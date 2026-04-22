import { useState, useMemo } from 'react';
import { Space, Button, Tag, Card, Row, Col, Statistic, Modal, Form, Select, Input, message } from 'antd';
import { EyeOutlined, BankOutlined, UserOutlined, FileTextOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { ipdAdmissionService, wardService, bedService } from '@services';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import dayjs from 'dayjs';

const IPDAdmissions = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [transferForm] = Form.useForm();
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAdmission, setTransferAdmission] = useState(null);
  const selectedWardId = Form.useWatch('ward_id', transferForm);

  const { data, isLoading, refetch } = useApiQuery(
    ['ipd-admissions'],
    () => ipdAdmissionService.getAll()
  );

  const { data: wardsData } = useApiQuery(['wards'], () => wardService.getAll());
  const { data: bedsData } = useApiQuery(['beds'], () => bedService.getAll());

  const admissions = data?.data || [];
  const wards = wardsData?.data || [];
  const beds = bedsData?.data || [];

  const availableBeds = useMemo(() => {
    if (!selectedWardId) return [];
    return beds.filter(b => b.ward_id === selectedWardId && b.status === 'Available');
  }, [beds, selectedWardId]);

  const transferMutation = useApiMutation(
    (values) => ipdAdmissionService.transferBed({
      admission_id: transferAdmission.admission_id,
      ...values
    }),
    {
      onSuccess: () => {
        message.success('Patient transferred successfully');
        setTransferOpen(false);
        setTransferAdmission(null);
        transferForm.resetFields();
        refetch();
      },
      onError: (err) => {
        message.error(err?.response?.data?.message || 'Failed to transfer patient');
      }
    }
  );

  const openTransfer = (record) => {
    setTransferAdmission(record);
    transferForm.resetFields();
    transferForm.setFieldsValue({
      ward_id: record.ward_id,
      bed_id: record.bed_id,
      room_number: record.room_number
    });
    setTransferOpen(true);
  };

  const handleTransfer = (values) => {
    const selectedBed = beds.find(b => b.bed_id === values.bed_id);
    transferMutation.mutate({
      ward_id: values.ward_id,
      bed_id: values.bed_id,
      room_number: values.room_number,
      bed_number: selectedBed?.bed_number
    });
  };

  const getStatusColor = (status) => {
    const colors = { Admitted: 'blue', Discharged: 'green', Transferred: 'orange' };
    return colors[status] || 'default';
  };

  const columns = [
    { title: 'UHID', dataIndex: 'uhid', key: 'uhid', width: 150, fixed: 'left' },
    {
      title: 'Patient',
      key: 'patient_name',
      render: (_, record) => (
        <div style={{ fontWeight: 500 }}>
          {record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : '-'}
        </div>
      )
    },
    {
      title: 'Doctor',
      key: 'doctor_name',
      render: (_, record) => record.admittingDoctor?.name || '-'
    },
    {
      title: 'Ward',
      key: 'ward_name',
      render: (_, record) => record.ward ? <Tag color="purple">{record.ward.ward_name}</Tag> : '-'
    },
    {
      title: 'Room/Bed',
      key: 'bed',
      render: (_, record) => record.bed ? `${record.room_number || '-'}/${record.bed.bed_number}` : '-'
    },
    {
      title: 'Admission Date',
      dataIndex: 'admission_date',
      key: 'admission_date',
      render: (date) => date ? dayjs(date).format('DD-MM-YYYY') : '-'
    },
    { title: 'Reason', dataIndex: 'admission_reason', key: 'reason' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 260,
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/ipd/care/${record.admission_id}`)}
          >
            View
          </Button>
          {record.status === 'Admitted' && (
            <>
              <Button
                size="small"
                onClick={() => navigate(`/ipd/vitals/${record.admission_id}`)}
              >
                Vitals
              </Button>
              <Button
                icon={<SwapOutlined />}
                size="small"
                onClick={() => openTransfer(record)}
              >
                Transfer
              </Button>
            </>
          )}
          <Button
            icon={<FileTextOutlined />}
            size="small"
            onClick={() => navigate(`/ipd/patient/${record.admission_id}`)}
          >
            Patient Details
          </Button>
          {record.status === 'Admitted' && (
            <Button
              size="small"
              type="primary"
              onClick={() => navigate(`/ipd/discharge/${record.admission_id}`)}
            >
              Discharge
            </Button>
          )}
        </Space>
      )
    }
  ];

  const admittedCount = admissions.filter(a => a.status === 'Admitted').length;
  const dischargedToday = admissions.filter(a =>
    a.status === 'Discharged' && dayjs(a.discharge_date).isSame(dayjs(), 'day')
  ).length;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Admissions" value={admissions.length} prefix={<UserOutlined />} valueStyle={{ color: '#6366f1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Currently Admitted" value={admittedCount} prefix={<BankOutlined />} valueStyle={{ color: '#10b981' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Beds" value={beds.length} valueStyle={{ color: '#f59e0b' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Discharges Today" value={dischargedToday} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <SearchBar
          placeholder="Search by UHID or Patient Name"
          onSearch={setSearchQuery}
          onAdd={() => navigate('/ipd/admit')}
          addButtonText="Admit Patient"
        />
        <DataTable
          columns={columns}
          dataSource={admissions.filter(admission =>
            searchQuery === '' ||
            admission.uhid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (admission.patient &&
              `${admission.patient.first_name} ${admission.patient.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
          )}
          loading={isLoading}
          rowKey="admission_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={transferAdmission ? `Transfer: ${transferAdmission.patient?.first_name || ''} ${transferAdmission.patient?.last_name || ''}` : 'Transfer Patient'}
        open={transferOpen}
        onCancel={() => setTransferOpen(false)}
        onOk={() => transferForm.submit()}
        confirmLoading={transferMutation.isPending}
        width={560}
      >
        {transferAdmission && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Current location</div>
            <div>
              {transferAdmission.ward?.ward_name || '-'} /
              Room {transferAdmission.room_number || '-'} /
              Bed {transferAdmission.bed?.bed_number || '-'}
            </div>
          </div>
        )}
        <Form form={transferForm} layout="vertical" onFinish={handleTransfer}>
          <Form.Item
            name="ward_id"
            label="New Ward"
            rules={[{ required: true, message: 'Please select a ward' }]}
          >
            <Select
              showSearch
              placeholder="Select ward"
              optionFilterProp="label"
              onChange={() => transferForm.setFieldValue('bed_id', undefined)}
              options={wards.map(w => ({
                label: `${w.ward_name} (${w.ward_type})`,
                value: w.ward_id
              }))}
            />
          </Form.Item>
          <Form.Item
            name="bed_id"
            label="New Bed"
            rules={[{ required: true, message: 'Please select a bed' }]}
          >
            <Select
              showSearch
              placeholder={selectedWardId ? 'Select an available bed' : 'Select a ward first'}
              optionFilterProp="label"
              disabled={!selectedWardId}
              notFoundContent={selectedWardId ? 'No available beds in this ward' : null}
              options={availableBeds.map(b => ({
                label: `Bed ${b.bed_number} - ${b.bed_type}`,
                value: b.bed_id
              }))}
            />
          </Form.Item>
          <Form.Item name="room_number" label="Room Number">
            <Input placeholder="e.g. 201" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IPDAdmissions;
