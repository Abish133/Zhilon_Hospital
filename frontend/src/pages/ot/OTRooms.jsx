import { useAuthStore } from '@store';
import { useState, useEffect } from 'react';
import { Card, Form, Button, Space, message, Input, Select, Tag } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import OTService from '../../services/OTService';

const OTRooms = () => {
  const [form] = Form.useForm();
  const [rooms, setRooms] = useState([]);
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await OTService.getRooms();
      setRooms(response.data || []);
    } catch (error) {
      message.error('Failed to fetch OT rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const roomData = {
        ...values,
        hospital_id: user?.hospital_id
      };

      if (editingRoom) {
        await OTService.updateRoom(editingRoom.room_id, roomData);
        message.success('OT room updated successfully');
      } else {
        await OTService.createRoom(roomData);
        message.success('OT room created successfully');
      }
      
      setModalOpen(false);
      setEditingRoom(null);
      form.resetFields();
      fetchRooms();
    } catch (error) {
      message.error('Failed to save OT room');
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    form.setFieldsValue(room);
    setModalOpen(true);
  };

  const handleDelete = async (roomId) => {
    try {
      await OTService.deleteRoom(roomId);
      message.success('OT room deleted successfully');
      fetchRooms();
    } catch (error) {
      message.error('Failed to delete OT room');
    }
  };

  const columns = [
    { title: 'Room ID', dataIndex: 'room_id', key: 'room_id', render: (id) => <Tag color="blue">#{id}</Tag> },
    { title: 'Room Name', dataIndex: 'room_name', key: 'room_name' },
    { title: 'Type', dataIndex: 'room_type', key: 'room_type', render: (type) => <Tag color={type === 'Major' ? 'red' : type === 'Minor' ? 'orange' : 'purple'}>{type}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'Available' ? 'green' : status === 'Occupied' ? 'red' : 'orange'}>{status}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.room_id)}>Delete</Button>
        </Space>
      )
    }
  ];

  const filteredRooms = rooms.filter(room => 
    room.room_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.room_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card title="OT Rooms Management">
      <SearchBar 
        placeholder="Search OT rooms..." 
        onSearch={setSearchQuery}
        onAdd={() => setModalOpen(true)}
        addButtonText="Add OT Room"
      />
      
      <DataTable 
        columns={columns} 
        dataSource={filteredRooms} 
        loading={loading} 
        rowKey="room_id" 
      />

      <SliderModal
        title={editingRoom ? "Edit OT Room" : "Add OT Room"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingRoom(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="room_name" label="Room Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., OT-1" />
          </Form.Item>
          <Form.Item name="room_type" label="Room Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Major">Major</Select.Option>
              <Select.Option value="Minor">Minor</Select.Option>
              <Select.Option value="Emergency">Emergency</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Available">Available</Select.Option>
              <Select.Option value="Occupied">Occupied</Select.Option>
              <Select.Option value="Maintenance">Maintenance</Select.Option>
              <Select.Option value="Sterilization">Sterilization</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </SliderModal>
    </Card>
  );
};

export default OTRooms;