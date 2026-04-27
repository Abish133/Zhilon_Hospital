import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, message, Select, Descriptions, Divider, Row, Col } from 'antd';
import { SearchOutlined, CheckOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@utils/helpers';
import { patientService, opdPrescriptionService, medicineService } from '@services';
import medicineBatchService from '@services/MedicineBatchService';
import { pharmacySaleService, pharmacySaleDetailService } from '@services';
import { useAuthStore } from '@store';

const PharmacyDispense = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchForm] = Form.useForm();
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [dispensedItems, setDispensedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([fetchMedicines(), fetchBatches()]);
  };

  const fetchMedicines = async () => {
    try {
      const response = await medicineService.getAll();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setMedicines(data);
    } catch (error) {
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await medicineBatchService.getAll();
      const body = response?.data;
      const batchData = Array.isArray(body) ? body : (body?.data || []);
      setBatches(Array.isArray(batchData) ? batchData : []);
    } catch (error) {
      setBatches([]);
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      const searchValue = values.search_value.trim();
      let patientData = null;

      // If numeric, try direct ID lookup first
      if (/^\d+$/.test(searchValue)) {
        try {
          const byIdResponse = await patientService.getByUHID(searchValue);
          const body = byIdResponse?.data ?? byIdResponse;
          patientData = body?.data || null;
        } catch (e) { /* fall through to search */ }
      }

      // Otherwise (or if ID lookup failed), use server-side search by UHID/name/mobile
      if (!patientData) {
        const response = await patientService.getAll({
          search: searchValue,
          hospital_id: user?.hospital_id,
          pageSize: 10
        });
        const body = response?.data ?? response;
        const results = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        patientData = results.find(p =>
          p.uhid?.toLowerCase() === searchValue.toLowerCase() ||
          p.patient_id === parseInt(searchValue)
        ) || results[0] || null;
      }

      if (!patientData) {
        message.error('Patient not found');
        setPatient(null);
        setPrescriptions([]);
        return;
      }

      setPatient(patientData);

      try {
        const prescResponse = await opdPrescriptionService.getByPatientId(patientData.patient_id);
        const body = prescResponse?.data ?? prescResponse;
        const patientPrescriptions = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        setPrescriptions(patientPrescriptions);

        if (patientPrescriptions.length === 0) {
          message.info('No prescriptions found for this patient');
        }
      } catch (prescError) {
        setPrescriptions([]);
      }

      message.success('Patient loaded successfully');
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to load patient data');
      setPatient(null);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrescriptionItem = (prescription) => {
    if (!selectedPrescription) {
      setSelectedPrescription(prescription);
    }

    const medicine = medicines.find(m =>
      m.medicine_id === prescription.medicine_id ||
      m.medicine_name?.toLowerCase() === prescription.medicine_name?.toLowerCase()
    );

    if (!medicine) {
      message.error(`Medicine "${prescription.medicine_name}" not found in inventory. Please add it to Medicine Master first.`);
      return;
    }

    const availableBatches = batches.filter(b =>
      b.medicine_id === medicine.medicine_id &&
      b.available_quantity > 0
    );

    if (availableBatches.length === 0) {
      message.error(`No stock available for ${medicine.medicine_name}. Please receive stock via GRN first.`);
      return;
    }

    const batch = availableBatches[0];
    const item = {
      key: Date.now(),
      medicine_id: medicine.medicine_id,
      medicine_name: medicine.medicine_name,
      batch_id: batch.batch_id,
      batch_number: batch.batch_number,
      quantity: prescription.quantity || 1,
      rate: batch.mrp,
      amount: (batch.mrp || 0) * (prescription.quantity || 1),
      gst_percentage: medicine?.gst_percentage || 0
    };
    
    setDispensedItems([...dispensedItems, item]);
    message.success(`${item.medicine_name} added`);
  };

  const handleAddManualItem = () => {
    const newItem = {
      key: Date.now(),
      medicine_id: null,
      medicine_name: '',
      batch_id: null,
      batch_number: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      gst_percentage: 0
    };
    setDispensedItems([...dispensedItems, newItem]);
  };

  const handleRemoveItem = (key) => {
    setDispensedItems(items => items.filter(item => item.key !== key));
  };

  const handleItemChange = (key, field, value) => {
    setDispensedItems(items => items.map(item => {
      if (item.key !== key) return item;
      
      const updated = { ...item, [field]: value };
      
      if (field === 'medicine_id') {
        const medicine = medicines.find(m => m.medicine_id === value);
        const availableBatches = batches.filter(b => 
          b.medicine_id === value && 
          b.available_quantity > 0
        );
        
        if (availableBatches.length === 0) {
          message.error('No available batch for this medicine');
          return item;
        }
        
        const batch = availableBatches[0];
        updated.medicine_name = medicine?.medicine_name || '';
        updated.batch_id = batch.batch_id;
        updated.batch_number = batch.batch_number;
        updated.rate = batch.mrp;
        updated.gst_percentage = medicine?.gst_percentage || 0;
        updated.amount = Math.round((batch.mrp * updated.quantity) * 100) / 100;
      }
      
      if (field === 'batch_id') {
        const batch = batches.find(b => b.batch_id === value);
        updated.batch_number = batch?.batch_number || '';
        updated.rate = batch?.mrp || 0;
        updated.amount = Math.round(((batch?.mrp || 0) * updated.quantity) * 100) / 100;
      }
      
      if (field === 'quantity' || field === 'rate') {
        const newQuantity = field === 'quantity' ? value : updated.quantity;
        const newRate = field === 'rate' ? value : updated.rate;
        updated.amount = Math.round((newQuantity * newRate) * 100) / 100; // Round to 2 decimal places
      }
      
      return updated;
    }));
  };

  const handleDispense = async () => {
    if (!patient) {
      message.warning('Please search and select a patient');
      return;
    }

    if (dispensedItems.length === 0) {
      message.warning('Please add medicines to dispense');
      return;
    }

    const invalidItems = dispensedItems.filter(item => !item.medicine_id || !item.batch_id);
    if (invalidItems.length > 0) {
      message.warning('Please select medicine and batch for all items');
      return;
    }

    if (!user?.hospital_id) {
      message.error('Hospital context missing. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      const dispenseData = {
        uhid: patient.uhid,
        prescription_id: selectedPrescription?.prescription_id || null,
        medicines: dispensedItems.map(item => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity
        })),
        dispensed_by: user?.id,
        hospital_id: user.hospital_id
      };

      await pharmacySaleService.dispense(dispenseData);
      message.success('Medicines dispensed successfully');
      navigate('/pharmacy');
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to dispense medicines');
    } finally {
      setLoading(false);
    }
  };

  const prescriptionColumns = [
    { title: 'Medicine', dataIndex: 'medicine_name', key: 'medicine' },
    { title: 'Dosage', dataIndex: 'dosage', key: 'dosage' },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency' },
    { title: 'Duration', dataIndex: 'duration', key: 'duration' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="primary" onClick={() => handleAddPrescriptionItem(record)}>
          Add
        </Button>
      )
    }
  ];

  const dispensedColumns = [
    { 
      title: 'Medicine', 
      dataIndex: 'medicine_name', 
      key: 'medicine',
      render: (val, record) => (
        record.medicine_id ? val : (
          <Select
            style={{ width: 200 }}
            placeholder="Select medicine"
            showSearch
            filterOption={(input, option) => 
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            options={medicines.map(m => ({ label: m.medicine_name, value: m.medicine_id }))}
            onChange={(value) => handleItemChange(record.key, 'medicine_id', value)}
          />
        )
      )
    },
    { 
      title: 'Batch', 
      dataIndex: 'batch_number', 
      key: 'batch',
      render: (val, record) => (
        record.medicine_id && !record.batch_id ? (
          <Select
            style={{ width: 150 }}
            placeholder="Select batch"
            options={batches
              .filter(b => b.medicine_id === record.medicine_id && b.available_quantity > 0)
              .map(b => ({ label: `${b.batch_number} (${b.available_quantity})`, value: b.batch_id }))}
            onChange={(value) => handleItemChange(record.key, 'batch_id', value)}
          />
        ) : val
      )
    },
    { 
      title: 'Quantity', 
      dataIndex: 'quantity', 
      key: 'quantity',
      render: (val, record) => (
        <Input
          type="number"
          min={1}
          value={val}
          style={{ width: 80 }}
          onChange={(e) => handleItemChange(record.key, 'quantity', parseInt(e.target.value) || 1)}
        />
      )
    },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', render: (val) => formatCurrency(val) },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val) => formatCurrency(val) },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record.key)} />
      )
    }
  ];

  // Calculate totals with proper rounding
  const totalAmount = dispensedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = dispensedItems.reduce((sum, item) => {
    const itemAmount = item.amount || 0;
    const gstRate = (item.gst_percentage || 0) / 100;
    const itemTax = itemAmount * gstRate;
    return sum + itemTax;
  }, 0);
  const netAmount = totalAmount + taxAmount;

  return (
    <div>
      <Card title="Pharmacy Dispense">
        <Form form={searchForm} onFinish={handleSearch} layout="inline">
          <Form.Item name="search_value" rules={[{ required: true }]}>
            <Input placeholder="Enter UHID or Patient ID" prefix={<SearchOutlined />} style={{ width: 300 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Search Patient</Button>
          </Form.Item>
        </Form>

        {patient && (
          <>
            <Divider />
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Patient">{patient.first_name} {patient.last_name}</Descriptions.Item>
              <Descriptions.Item label="UHID">{patient.uhid}</Descriptions.Item>
              <Descriptions.Item label="Age">{patient.age}</Descriptions.Item>
              <Descriptions.Item label="Gender">{patient.gender}</Descriptions.Item>
            </Descriptions>

            {prescriptions.length > 0 && (
              <>
                <h3>Prescribed Medicines</h3>
                <Table
                  dataSource={prescriptions}
                  columns={prescriptionColumns}
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 24 }}
                  rowKey="prescription_id"
                />
              </>
            )}

            <Divider />
            <Space style={{ marginBottom: 16 }}>
              <Button icon={<PlusOutlined />} onClick={handleAddManualItem}>
                Add Manual Item
              </Button>
            </Space>

            <h3>Dispensed Items</h3>
            <Table
              columns={dispensedColumns}
              dataSource={dispensedItems}
              pagination={false}
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4} align="right"><strong>Total:</strong></Table.Summary.Cell>
                    <Table.Summary.Cell><strong>{formatCurrency(totalAmount)}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4} align="right"><strong>Tax:</strong></Table.Summary.Cell>
                    <Table.Summary.Cell><strong>{formatCurrency(taxAmount)}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4} align="right"><strong>Net Amount:</strong></Table.Summary.Cell>
                    <Table.Summary.Cell><strong>{formatCurrency(netAmount)}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                </>
              )}
            />

            <div style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                onClick={handleDispense}
                loading={loading}
                disabled={dispensedItems.length === 0}
              >
                Complete Dispense
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PharmacyDispense;
