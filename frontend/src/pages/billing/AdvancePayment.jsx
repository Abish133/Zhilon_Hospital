import { useState } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Table, Space, message, Row, Col, Tag, Descriptions } from 'antd';
import { DollarOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { useAuthStore } from '@store';
import apiClient from '@services/apiClient';
import { formatCurrency, formatDate } from '@utils/helpers';
import DataTable from '@components/common/DataTable';

const { Option } = Select;

const AdvancePayment = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Fetch patients for search
  const { data: patientsData, refetch: searchPatients } = useApiQuery(
    ['patients-search'],
    async () => (await apiClient.get('/patients')).data,
    { enabled: false }
  );

  // Fetch IPD admissions for selected patient
  const { data: admissionsData } = useApiQuery(
    ['ipd-admissions', selectedPatient?.patient_id],
    async () => (await apiClient.get('/ipd-admissions', {
      params: { patient_id: selectedPatient.patient_id, status: 'Admitted' }
    })).data,
    { enabled: !!selectedPatient }
  );

  // Fetch advance payments
  const { data: advancesData, isLoading, refetch } = useApiQuery(
    ['payment-advances'],
    async () => (await apiClient.get('/payment-advances')).data
  );

  // Create advance payment mutation
  const createAdvanceMutation = useApiMutation(
    async (advanceData) => (await apiClient.post('/payment-advances', advanceData)).data,
    {
      onSuccess: () => {
        message.success('Advance payment recorded successfully');
        form.resetFields();
        setSelectedPatient(null);
        setSelectedAdmission(null);
        refetch();
      },
      onError: (error) => {
        message.error(error.message || 'Failed to record advance payment');
      }
    }
  );

  const handlePatientSearch = (values) => {
    searchPatients();
  };

  const handleAdvanceSubmit = (values) => {
    if (!selectedPatient || !selectedAdmission) {
      message.error('Please select patient and admission');
      return;
    }

    createAdvanceMutation.mutate({
      ...values,
      patient_id: selectedPatient.patient_id,
      admission_id: selectedAdmission.admission_id,
      received_by: 1, // Get from context
      hospital_id: user?.hospital_id,
      balance_amount: values.amount
    });
  };

  const patients = patientsData?.data || [];
  const admissions = admissionsData?.data || [];
  const advances = advancesData?.data || [];

  const advanceColumns = [
    {
      title: 'Receipt No.',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      render: (receipt) => <Tag color="blue">{receipt}</Tag>
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.patient?.first_name} {record.patient?.last_name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            UHID: {record.patient?.uhid}
          </div>
        </div>
      )
    },
    {
      title: 'Admission',
      key: 'admission',
      render: (_, record) => (
        <div>
          <div>Admission #{record.admission?.admission_id}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {formatDate(record.admission?.admission_date)}
          </div>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <div style={{ fontWeight: 600 }}>{formatCurrency(amount)}</div>
    },
    {
      title: 'Utilized',
      dataIndex: 'utilized_amount',
      key: 'utilized_amount',
      render: (amount) => <span style={{ color: '#ef4444' }}>{formatCurrency(amount)}</span>
    },
    {
      title: 'Balance',
      dataIndex: 'balance_amount',
      key: 'balance_amount',
      render: (amount) => <span style={{ color: '#10b981' }}>{formatCurrency(amount)}</span>
    },
    {
      title: 'Payment Mode',
      dataIndex: 'payment_mode',
      key: 'payment_mode',
      render: (mode) => <Tag>{mode}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'advance_date',
      key: 'advance_date',
      render: (date) => formatDate(date)
    },
    {
      title: 'Received By',
      key: 'received_by',
      render: (_, record) => record.receivedBy?.name
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Record Advance Payment" extra={<DollarOutlined />}>
            <Form form={searchForm} layout="vertical" onFinish={handlePatientSearch}>
              <Form.Item name="search" label="Search Patient">
                <Input.Search
                  placeholder="Enter UHID or Patient Name"
                  onSearch={() => searchForm.submit()}
                  enterButton={<SearchOutlined />}
                />
              </Form.Item>
            </Form>

            {patients.length > 0 && (
              <Form.Item label="Select Patient">
                <Select
                  placeholder="Choose patient"
                  onChange={(value) => {
                    const patient = patients.find(p => p.patient_id === value);
                    setSelectedPatient(patient);
                    setSelectedAdmission(null);
                  }}
                  showSearch
                  optionFilterProp="children"
                >
                  {patients.map(patient => (
                    <Option key={patient.patient_id} value={patient.patient_id}>
                      {patient.first_name} {patient.last_name} - {patient.uhid}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {selectedPatient && (
              <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Patient" span={3}>
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </Descriptions.Item>
                <Descriptions.Item label="UHID">{selectedPatient.uhid}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedPatient.phone}</Descriptions.Item>
                <Descriptions.Item label="Age">{selectedPatient.age}</Descriptions.Item>
              </Descriptions>
            )}

            <Form form={form} layout="vertical" onFinish={handleAdvanceSubmit}>
              {admissions.length > 0 && (
                <Form.Item 
                  name="admission_id" 
                  label="Select Admission"
                  rules={[{ required: true, message: 'Please select admission' }]}
                >
                  <Select
                    placeholder="Choose active admission"
                    onChange={(value) => {
                      const admission = admissions.find(a => a.admission_id === value);
                      setSelectedAdmission(admission);
                    }}
                  >
                    {admissions.map(admission => (
                      <Option key={admission.admission_id} value={admission.admission_id}>
                        Admission #{admission.admission_id} - {formatDate(admission.admission_date)}
                        <br />
                        <small>Ward: {admission.ward?.ward_name}, Bed: {admission.bed?.bed_number}</small>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    name="amount" 
                    label="Advance Amount"
                    rules={[{ required: true, message: 'Please enter amount' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    name="payment_mode" 
                    label="Payment Mode"
                    rules={[{ required: true, message: 'Please select payment mode' }]}
                  >
                    <Select>
                      <Option value="Cash">Cash</Option>
                      <Option value="Card">Card</Option>
                      <Option value="UPI">UPI</Option>
                      <Option value="Cheque">Cheque</Option>
                      <Option value="Bank Transfer">Bank Transfer</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="transaction_ref" label="Transaction Reference">
                <Input placeholder="Card/UPI/Cheque reference number" />
              </Form.Item>

              <Form.Item name="remarks" label="Remarks">
                <Input.TextArea rows={2} placeholder="Any additional notes" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<PlusOutlined />}
                  loading={createAdvanceMutation.isPending}
                  disabled={!selectedPatient || !selectedAdmission}
                  block
                >
                  Record Advance Payment
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Recent Advance Payments">
            <DataTable
              columns={advanceColumns}
              dataSource={advances.slice(0, 10)}
              loading={isLoading}
              rowKey="advance_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title="All Advance Payments" style={{ marginTop: 16 }}>
        <DataTable
          columns={advanceColumns}
          dataSource={advances}
          loading={isLoading}
          rowKey="advance_id"
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default AdvancePayment;