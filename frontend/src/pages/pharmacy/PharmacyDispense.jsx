import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, message, Select, Descriptions, Divider, Row, Col, Alert, Tag } from 'antd';
import { SearchOutlined, CheckOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@utils/helpers';
import { patientService, opdPrescriptionService, medicineService, hospitalService } from '@services';
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
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [selfPurchase, setSelfPurchase] = useState(false);

  const norm = (s) => (s || '').trim().toLowerCase();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([fetchMedicines(), fetchBatches(), fetchPharmacyMode()]);
  };

  const fetchPharmacyMode = async () => {
    try {
      if (!user?.hospital_id) return;
      const res = await hospitalService.getById(user.hospital_id);
      if (res?.success && res.data) setSelfPurchase(res.data.pharmacy_mode === 'self_purchase');
    } catch (error) { /* default in-house */ }
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
        const allPrescriptions = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        // Only show prescriptions that haven't been dispensed yet.
        const patientPrescriptions = allPrescriptions.filter(p => p.dispense_status !== 'Dispensed');
        setPrescriptions(patientPrescriptions);

        if (patientPrescriptions.length === 0) {
          message.info('No pending prescriptions to dispense for this patient');
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

  // earliest-expiry-first (FEFO) in-stock batches for a given medicine
  const inStockBatches = (medicineId) =>
    batches
      .filter(b => b.medicine_id === medicineId && b.available_quantity > 0)
      .sort((a, b) => new Date(a.expiry_date || 0) - new Date(b.expiry_date || 0));

  // In-stock brands (medicine records) that share the same molecule (generic_name).
  const brandsForMolecule = (genericName) => {
    const g = norm(genericName);
    if (!g) return [];
    return medicines.filter(m => norm(m.generic_name) === g && inStockBatches(m.medicine_id).length > 0);
  };

  const handleAddPrescriptionItem = (prescription) => {
    if (!selectedPrescription) {
      setSelectedPrescription(prescription);
    }

    const prescribed = medicines.find(m =>
      m.medicine_id === prescription.medicine_id ||
      norm(m.medicine_name) === norm(prescription.medicine_name)
    );

    if (!prescribed) {
      message.error(`Medicine "${prescription.medicine_name}" not found in inventory. Please add it to Medicine Master first.`);
      return;
    }

    // Pick the brand to dispense: the prescribed brand if it has stock, otherwise
    // a substitute brand of the SAME molecule (standard generic substitution).
    const molecule = prescribed.generic_name;
    const sameMolecule = brandsForMolecule(molecule);
    const chosen = inStockBatches(prescribed.medicine_id).length > 0
      ? prescribed
      : sameMolecule[0];

    if (!chosen) {
      message.error(
        `No stock for "${prescribed.brand_name || prescribed.medicine_name}"` +
        (molecule ? ` or any other ${molecule} brand` : '') + '. Receive stock via GRN first.'
      );
      return;
    }

    const batch = inStockBatches(chosen.medicine_id)[0];
    const substituted = chosen.medicine_id !== prescribed.medicine_id;
    const qty = prescription.quantity || 1;
    const item = {
      key: Date.now(),
      prescription_id: prescription.prescription_id || null,
      medicine_id: chosen.medicine_id,
      medicine_name: chosen.medicine_name,
      brand_name: chosen.brand_name,
      generic_name: chosen.generic_name || molecule,
      prescribed_brand: prescribed.brand_name || prescribed.medicine_name,
      substituted,
      batch_id: batch.batch_id,
      batch_number: batch.batch_number,
      quantity: qty,
      rate: batch.mrp,
      amount: (batch.mrp || 0) * qty,
      gst_percentage: chosen.gst_percentage || 0
    };

    setDispensedItems([...dispensedItems, item]);
    if (substituted) {
      message.warning(`Substituted ${chosen.brand_name || chosen.medicine_name} for ${item.prescribed_brand} — same molecule (${molecule}).`);
    } else {
      message.success(`${chosen.brand_name || chosen.medicine_name} added`);
    }
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
        updated.brand_name = medicine?.brand_name;
        // keep the molecule if switching among same-molecule brands; else adopt the new one
        updated.generic_name = medicine?.generic_name || updated.generic_name;
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
      // Collect every prescription line being dispensed so the backend can mark
      // them all as Dispensed (manual items have no prescription_id).
      const prescriptionIds = [...new Set(
        dispensedItems.map(item => item.prescription_id).filter(Boolean)
      )];

      // Walk-in = a counter sale with no prescription/admission link.
      // In-house pharmacy: only walk-in sales collect a payment mode (OPD/IPD are
      // billed via episodes). Self-purchase pharmacy: the patient always pays at
      // the counter, so we send the payment mode for every sale.
      const isWalkIn = !selectedPrescription && prescriptionIds.length === 0;
      const collectPayment = isWalkIn || selfPurchase;

      const dispenseData = {
        uhid: patient.uhid,
        prescription_id: selectedPrescription?.prescription_id || null,
        prescription_ids: prescriptionIds,
        medicines: dispensedItems.map(item => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity
        })),
        dispensed_by: user?.id,
        hospital_id: user.hospital_id,
        ...(collectPayment ? { payment_mode: paymentMode } : {})
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
    {
      title: 'Medicine (Molecule)',
      dataIndex: 'medicine_name',
      key: 'medicine',
      render: (val, record) => {
        const m = medicines.find(x => x.medicine_id === record.medicine_id || norm(x.medicine_name) === norm(record.medicine_name));
        const molecule = m?.generic_name;
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{val}</div>
            {molecule && <div style={{ fontSize: 12, color: '#7c3aed' }}>{molecule}</div>}
          </div>
        );
      }
    },
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

  // Brand options for the dispensed row: in-stock brands sharing the row's molecule
  // (always include the currently chosen brand so the value stays valid).
  const brandOptions = (record) => {
    let list = brandsForMolecule(record.generic_name);
    if (!list.find(m => m.medicine_id === record.medicine_id)) {
      const cur = medicines.find(m => m.medicine_id === record.medicine_id);
      if (cur) list = [cur, ...list];
    }
    return list.map(m => ({
      label: `${m.brand_name || m.medicine_name}${m.strength ? ` (${m.strength})` : ''}`,
      value: m.medicine_id
    }));
  };

  const dispensedColumns = [
    {
      title: 'Medicine (Brand / Molecule)',
      key: 'medicine',
      render: (_, record) => {
        // Manual (counter) item — free pick from the whole catalogue.
        if (!record.medicine_id) {
          return (
            <Select
              style={{ width: 240 }}
              placeholder="Select medicine"
              showSearch
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              options={medicines.map(m => ({
                label: `${m.brand_name || m.medicine_name}${m.generic_name ? ` — ${m.generic_name}` : ''}`,
                value: m.medicine_id
              }))}
              onChange={(value) => handleItemChange(record.key, 'medicine_id', value)}
            />
          );
        }
        // Prescription item — show brand + molecule, allow brand substitution.
        const opts = brandOptions(record);
        return (
          <div>
            {opts.length > 1 ? (
              <Select
                size="small"
                style={{ width: 200 }}
                value={record.medicine_id}
                options={opts}
                onChange={(value) => handleItemChange(record.key, 'medicine_id', value)}
              />
            ) : (
              <div style={{ fontWeight: 600 }}>{record.brand_name || record.medicine_name}</div>
            )}
            {record.generic_name && <div style={{ fontSize: 12, color: '#7c3aed' }}>{record.generic_name}</div>}
            {record.substituted && (
              <Tag color="orange" style={{ marginTop: 4 }}>Substituted for {record.prescribed_brand}</Tag>
            )}
          </div>
        );
      }
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
        {selfPurchase && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Self-Purchase Pharmacy"
            description="The patient pays for medicines here at the counter. These charges are NOT added to the hospital (OPD/IPD) bill."
          />
        )}
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

            {(!selectedPrescription || selfPurchase) && (
              <div style={{ marginTop: 16 }}>
                <Space>
                  <span style={{ fontWeight: 500 }}>
                    {selfPurchase ? 'Payment Mode (patient pays at pharmacy):' : 'Payment Mode (walk-in counter sale):'}
                  </span>
                  <Select
                    value={paymentMode}
                    onChange={setPaymentMode}
                    style={{ width: 170 }}
                    options={[
                      { label: 'Cash', value: 'Cash' },
                      { label: 'Card', value: 'Card' },
                      { label: 'UPI', value: 'UPI' },
                      { label: 'Net Banking', value: 'Net Banking' },
                      { label: 'Pending', value: 'Pending' }
                    ]}
                  />
                </Space>
              </div>
            )}

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
