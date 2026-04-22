import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, TimePicker, message, Tag, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { shiftService } from '@/services';
import dayjs from 'dayjs';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await shiftService.getAll();
      if (response.success) {
        setShifts(response.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingShift(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingShift(record);
    form.setFieldsValue({
      shift_name: record.shift_name,
      start_time: record.start_time ? dayjs(record.start_time, 'HH:mm:ss') : null,
      end_time: record.end_time ? dayjs(record.end_time, 'HH:mm:ss') : null
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Delete Shift',
      content: 'Are you sure you want to delete this shift?',
      onOk: async () => {
        try {
          const response = await shiftService.delete(id);
          if (response.success) {
            message.success('Shift deleted successfully');
            fetchShifts();
          }
        } catch (error) {
          message.error('Failed to delete shift');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        shift_name: values.shift_name,
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss')
      };

      if (editingShift) {
        const response = await shiftService.update(editingShift.shift_id, payload);
        if (response.success) {
          message.success('Shift updated successfully');
          fetchShifts();
        }
      } else {
        const response = await shiftService.create(payload);
        if (response.success) {
          message.success('Shift created successfully');
          fetchShifts();
        }
      }
      setModalOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save shift');
    }
  };

  const columns = [
    {
      title: 'Shift Name',
      dataIndex: 'shift_name',
      key: 'shift_name'
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => time || '-'
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time) => time || '-'
    },
    {
      title: 'Duration',
      dataIndex: 'duration_hours',
      key: 'duration_hours',
      render: (hours) => hours ? `${hours} hours` : '-'
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.shift_id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Shift Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Shift
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={shifts}
          rowKey="shift_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingShift ? 'Edit Shift' : 'Add Shift'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="shift_name"
            label="Shift Name"
            rules={[{ required: true, message: 'Please enter shift name' }]}
          >
            <Input placeholder="e.g., Morning, Evening, Night" />
          </Form.Item>

          <Form.Item
            name="start_time"
            label="Start Time"
            rules={[{ required: true, message: 'Please select start time' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="end_time"
            label="End Time"
            rules={[{ required: true, message: 'Please select end time' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShiftManagement;

