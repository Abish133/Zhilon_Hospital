import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Tag, Space, message, Form, Select, InputNumber } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { SearchOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/services/apiClient';
import { medicineService, pharmacySaleService } from '@/services';
import medicineBatchService from '@/services/MedicineBatchService';
import { useAuthStore } from '@/store';

const IpdPharmacy = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  
  const [dispenseForm] = Form.useForm();
  const [dispenseLoading, setDispenseLoading] = useState(false);

  useEffect(() => {
    fetchAdmissions();
    fetchMedicinesAndBatches();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/ipd-admissions', {
        params: { status: 'Admitted', hospital_id: user?.hospital_id }
      });
      setAdmissions(response.data?.data || response.data || []);
    } catch (error) {
      message.error('Failed to load active IPD admissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicinesAndBatches = async () => {
    try {
      const [medRes, batchRes] = await Promise.all([
        medicineService.getAll(),
        medicineBatchService.getAll()
      ]);
      setMedicines(medRes.data?.data || medRes.data || medRes || []);
      setBatches(batchRes.data?.data || batchRes.data || batchRes || []);
    } catch (error) {
    }
  };

  const handleOpenDispense = (record) => {
    setSelectedAdmission(record);
    dispenseForm.resetFields();
    setDispenseModalOpen(true);
  };

  const handleDispenseSubmit = async (values) => {
    if (!values.items || values.items.length === 0) {
      return message.warning('Please add at least one medicine');
    }

    setDispenseLoading(true);
    try {
      const payload = {
        uhid: selectedAdmission.uhid,
        admission_id: selectedAdmission.admission_id,
        medicines: values.items.map(m => ({
          medicine_id: m.medicine_id,
          quantity: m.quantity
        })),
        dispensed_by: user?.user_id,
        hospital_id: user?.hospital_id
      };

      await pharmacySaleService.dispense(payload);
      message.success(`Medicines issued to Ward ${selectedAdmission.ward?.ward_name || ''} successfully`);
      setDispenseModalOpen(false);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to issue medicines');
    } finally {
      setDispenseLoading(false);
    }
  };

  const columns = [
    {
      title: 'UHID',
      dataIndex: 'uhid',
      key: 'uhid',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        String(record.uhid).toLowerCase().includes(value.toLowerCase()) ||
        String(record.patient?.first_name).toLowerCase().includes(value.toLowerCase()) ||
        String(record.patient?.last_name).toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Patient Name',
      key: 'patient',
      render: (_, record) => `${record.patient?.first_name || ''} ${record.patient?.last_name || ''}`
    },
    {
      title: 'Ward / Bed',
      key: 'location',
      render: (_, record) => (
        <Space>
          <Tag color="blue">{record.ward?.ward_name || 'N/A'}</Tag>
          <Tag color="cyan">{record.bed?.bed_number || 'N/A'}</Tag>
        </Space>
      )
    },
    {
      title: 'Admission Date',
      dataIndex: 'admission_date',
      key: 'date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" icon={<MedicineBoxOutlined />} onClick={() => handleOpenDispense(record)}>
          Issue Medicine
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="Ward-wise Pharmacy Issuance">
        <Input
          placeholder="Search patient by UHID or Name"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 300, marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={admissions}
          loading={loading}
          rowKey="admission_id"
        />
      </Card>

      <SliderModal
        title={`Issue Medicines to ${selectedAdmission?.patient?.first_name || ''} (UHID: ${selectedAdmission?.uhid || ''})`}
        open={dispenseModalOpen}
        onCancel={() => setDispenseModalOpen(false)}
        onOk={() => dispenseForm.submit()}
        confirmLoading={dispenseLoading}
        width={800}
        okText="Issue to Ward"
      >
        <Form form={dispenseForm} onFinish={handleDispenseSubmit}>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'medicine_id']}
                      rules={[{ required: true, message: 'Select medicine' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Select Medicine"
                        style={{ width: 300 }}
                        filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                        options={medicines.map(m => ({ label: m.medicine_name, value: m.medicine_id }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Quantity required' }]}
                    >
                      <InputNumber min={1} placeholder="Quantity" />
                    </Form.Item>
                    <Button danger onClick={() => remove(name)}>Remove</Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    + Add Medicine Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </SliderModal>
    </div>
  );
};

export default IpdPharmacy;
