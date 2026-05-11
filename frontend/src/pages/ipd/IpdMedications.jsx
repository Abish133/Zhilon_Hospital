import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Input, Select, DatePicker, InputNumber, message, Space, Modal, Tag, Row, Col } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, StopOutlined, CheckOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { medicineService } from '@/services';
import apiClient from '@services/apiClient';
import dayjs from 'dayjs';

const IpdMedications = ({ admissionId }) => {
  const [medications, setMedications] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMedications();
    fetchMedicines();
  }, [admissionId]);

  const fetchMedicines = async () => {
    try {
      const response = await medicineService.getAll();
      if (response.success) {
        setMedicines(response.data || []);
      }
    } catch (error) {
      setMedicines([]);
    }
  };

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/ipd/medications/admission/${admissionId}`);
      setMedications(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (values.medications?.length > 0) {
        for (const med of values.medications) {
          const selectedMedicine = medicines.find(m => m.medicine_id === med.medicine_id);
          await apiClient.post('/ipd/medications', {
            admission_id: parseInt(admissionId),
            medicine_id: med.medicine_id,
            medicine_name: selectedMedicine?.medicine_name,
            dosage: med.dosage,
            frequency: med.frequency,
            route: med.route || 'Oral',
            duration_days: med.duration_days,
            start_date: med.start_date.format('YYYY-MM-DD'),
            instructions: med.instructions
          });
        }
        message.success('Medications ordered successfully');
        setModalVisible(false);
        form.resetFields();
        fetchMedications();
      }
    } catch (error) {
      message.error('Failed to order medications');
    }
  };

  const handleStatusChange = async (medicationId, status, reason) => {
    try {
      await apiClient.put(`/ipd/medications/${medicationId}/status`, {
        status,
        stop_reason: reason
      });
      message.success(`Medication ${status.toLowerCase()}`);
      fetchMedications();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const columns = [
    { title: 'Medicine', dataIndex: 'medicine_name', key: 'medicine_name', width: 200 },
    { title: 'Dosage', dataIndex: 'dosage', key: 'dosage', width: 100 },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', width: 100 },
    { title: 'Route', dataIndex: 'route', key: 'route', width: 100 },
    { 
      title: 'Duration', 
      dataIndex: 'duration_days', 
      key: 'duration_days', 
      width: 100,
      render: (days) => `${days} days`
    },
    { 
      title: 'Start Date', 
      dataIndex: 'start_date', 
      key: 'start_date', 
      width: 120,
      render: (date) => dayjs(date).format('DD-MM-YYYY')
    },
    { title: 'Instructions', dataIndex: 'instructions', key: 'instructions', ellipsis: true },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (status) => {
        const colors = { Active: 'green', Completed: 'blue', Stopped: 'red', 'On-Hold': 'orange' };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        record.status === 'Active' && (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleStatusChange(record.medication_id, 'Completed', 'Course completed')}
            >
              Complete
            </Button>
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Stop Medication',
                  content: <Input.TextArea id="stop-reason" placeholder="Enter reason" rows={3} />,
                  onOk: () => {
                    const reason = document.getElementById('stop-reason').value;
                    if (reason) {
                      handleStatusChange(record.medication_id, 'Stopped', reason);
                    } else {
                      message.warning('Please provide a reason');
                      return Promise.reject();
                    }
                  }
                });
              }}
            >
              Stop
            </Button>
          </Space>
        )
      )
    }
  ];

  return (
    <>
      <Card
        title="Medication Orders"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Order Medications
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={medications}
          loading={loading}
          rowKey="medication_id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No medications ordered yet' }}
        />
      </Card>

      <SliderModal
        title="Order Medications"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={900}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.List name="medications">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ marginBottom: 8, background: '#fafafa' }}>
                    <Row gutter={8}>
                      <Col span={6}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'medicine_id']}
                          label="Medicine"
                          rules={[{ required: true, message: 'Select medicine' }]}
                        >
                          <Select
                            showSearch
                            placeholder="Select medicine"
                            filterOption={(input, option) =>
                              option.children.toLowerCase().includes(input.toLowerCase())
                            }
                          >
                            {medicines.map(med => (
                              <Select.Option key={med.medicine_id} value={med.medicine_id}>
                                {med.medicine_name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'dosage']}
                          label="Dosage"
                          rules={[{ required: true }]}
                        >
                          <Input placeholder="500mg" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'frequency']}
                          label="Frequency"
                          rules={[{ required: true }]}
                        >
                          <Select placeholder="Select">
                            <Select.Option value="OD">OD</Select.Option>
                            <Select.Option value="BD">BD</Select.Option>
                            <Select.Option value="TID">TID</Select.Option>
                            <Select.Option value="QID">QID</Select.Option>
                            <Select.Option value="PRN">PRN</Select.Option>
                            <Select.Option value="STAT">STAT</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'route']}
                          label="Route"
                          initialValue="Oral"
                        >
                          <Select>
                            <Select.Option value="Oral">Oral</Select.Option>
                            <Select.Option value="IV">IV</Select.Option>
                            <Select.Option value="IM">IM</Select.Option>
                            <Select.Option value="SC">SC</Select.Option>
                            <Select.Option value="Topical">Topical</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'duration_days']}
                          label="Days"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'start_date']}
                          label="Start Date"
                          rules={[{ required: true }]}
                          initialValue={dayjs()}
                        >
                          <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                        </Form.Item>
                      </Col>
                      <Col span={1}>
                        <Form.Item label=" ">
                          <Button 
                            type="text" 
                            danger 
                            icon={<MinusCircleOutlined />} 
                            onClick={() => remove(field.name)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'instructions']}
                          label="Instructions"
                        >
                          <Input placeholder="After meals, with water, etc." />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Medicine
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                Order All Medications
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>
    </>
  );
};

export default IpdMedications;
