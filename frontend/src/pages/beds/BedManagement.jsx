// import { useState } from 'react';
// import { Card, Row, Col, Tag, Button, Modal, Form, Select, Input, message, Tabs, Space, Typography, Spin, Empty } from 'antd';
// import { BankOutlined, CheckCircleOutlined, CloseCircleOutlined, ToolOutlined, SwapOutlined } from '@ant-design/icons';
// import { bedService, wardService } from '@services';
// import { useApiQuery, useApiMutation } from '@hooks/useApi';

// const { Title } = Typography;

// const BedManagement = () => {
//   const [transferModal, setTransferModal] = useState(false);
//   const [maintenanceModal, setMaintenanceModal] = useState(false);
//   const [selectedBed, setSelectedBed] = useState(null);
//   const [form] = Form.useForm();

//   const { data: bedsData, isLoading, refetch } = useApiQuery(['beds'], () => bedService.getAll());
//   const { data: wardsData } = useApiQuery(['wards'], () => wardService.getAll());

//   const updateBedMutation = useApiMutation(
//     ({ id, data }) => bedService.update(id, data),
//     {
//       onSuccess: () => {
//         message.success('Bed updated successfully');
//         refetch();
//         setTransferModal(false);
//         setMaintenanceModal(false);
//         form.resetFields();
//       },
//       onError: () => message.error('Failed to update bed')
//     }
//   );

//   const beds = bedsData?.data || [];
//   const wards = wardsData?.data || [];

//   const getStatusColor = (status) => ({
//     Available: '#10b981',
//     Occupied: '#3b82f6',
//     'Under Maintenance': '#f59e0b',
//     Reserved: '#0a0a0a'
//   }[status]);

//   const getStatusIcon = (status) => ({
//     Available: <CheckCircleOutlined />,
//     Occupied: <CloseCircleOutlined />,
//     'Under Maintenance': <ToolOutlined />,
//     Reserved: <BankOutlined />
//   }[status]);

//   const handleTransfer = async (values) => {
//     await updateBedMutation.mutateAsync({ id: selectedBed.bed_id, data: { status: 'Available' } });
//     await updateBedMutation.mutateAsync({ id: values.to_bed, data: { status: 'Occupied' } });
//   };

//   const handleMaintenance = async (values) => {
//     updateBedMutation.mutate({ id: selectedBed.bed_id, data: { status: values.status } });
//   };

//   const wardGroups = [...new Set(beds.map(b => b.ward?.ward_name).filter(Boolean))];

//   if (isLoading) {
//     return (
//       <div style={{ maxWidth: 1600, margin: '0 auto', padding: 24 }}>
//         <Card><Spin size="large" /></Card>
//       </div>
//     );
//   }

//   if (beds.length === 0) {
//     return (
//       <div style={{ maxWidth: 1600, margin: '0 auto', padding: 24 }}>
//         <Card>
//           <Empty 
//             description={
//               <div>
//                 <p>No beds found. Please add beds first.</p>
//                 {wards.length > 0 && <p>You have {wards.length} ward(s) available. Go to Ward Management to add beds.</p>}
//               </div>
//             }
//           />
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div style={{ maxWidth: 1600, margin: '0 auto' }}>
//       <div style={{ marginBottom: 24 }}>
//         <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
//           Bed Management
//         </Title>
//       </div>

//       <Tabs items={wardGroups.map(wardName => ({
//         key: wardName,
//         label: wardName,
//         children: (
//           <div>
//             <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
//               <Col xs={12} sm={12} md={6}>
//                 <Card style={{ 
//                   borderRadius: 16, 
//                   border: '1px solid #e2e8f0',
//                   minHeight: 140,
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}>
//                   <div style={{ textAlign: 'center' }}>
//                     <CheckCircleOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 12 }} />
//                     <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
//                       {beds.filter(b => b.ward?.ward_name === wardName && b.status === 'Available').length}
//                     </div>
//                     <div style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Available</div>
//                   </div>
//                 </Card>
//               </Col>
//               <Col xs={12} sm={12} md={6}>
//                 <Card style={{ 
//                   borderRadius: 16, 
//                   border: '1px solid #e2e8f0',
//                   minHeight: 140,
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}>
//                   <div style={{ textAlign: 'center' }}>
//                     <CloseCircleOutlined style={{ fontSize: 32, color: '#3b82f6', marginBottom: 12 }} />
//                     <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
//                       {beds.filter(b => b.ward?.ward_name === wardName && b.status === 'Occupied').length}
//                     </div>
//                     <div style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Occupied</div>
//                   </div>
//                 </Card>
//               </Col>
//               <Col xs={12} sm={12} md={6}>
//                 <Card style={{ 
//                   borderRadius: 16, 
//                   border: '1px solid #e2e8f0',
//                   minHeight: 140,
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}>
//                   <div style={{ textAlign: 'center' }}>
//                     <ToolOutlined style={{ fontSize: 32, color: '#f59e0b', marginBottom: 12 }} />
//                     <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
//                       {beds.filter(b => b.ward?.ward_name === wardName && b.status === 'Under Maintenance').length}
//                     </div>
//                     <div style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Under Maintenance</div>
//                   </div>
//                 </Card>
//               </Col>
//               <Col xs={12} sm={12} md={6}>
//                 <Card style={{ 
//                   borderRadius: 16, 
//                   border: '1px solid #e2e8f0',
//                   minHeight: 140,
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}>
//                   <div style={{ textAlign: 'center' }}>
//                     <BankOutlined style={{ fontSize: 32, color: '#0a0a0a', marginBottom: 12 }} />
//                     <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
//                       {beds.filter(b => b.ward?.ward_name === wardName && b.status === 'Reserved').length}
//                     </div>
//                     <div style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Reserved</div>
//                   </div>
//                 </Card>
//               </Col>
//             </Row>
//             <Row gutter={[20, 20]}>
//               {beds.filter(b => b.ward?.ward_name === wardName).map(bed => (
//                 <Col key={bed.bed_id} xs={24} sm={12} md={8} lg={6}>
//                   <Card 
//                     hoverable
//                     style={{ 
//                       borderRadius: 16,
//                       border: '1px solid #e2e8f0',
//                       borderLeft: `4px solid ${getStatusColor(bed.status)}`,
//                       minHeight: 180,
//                       display: 'flex',
//                       flexDirection: 'column'
//                     }}
//                   >
//                     <div style={{ marginBottom: 12 }}>
//                       <Tag color={getStatusColor(bed.status)} icon={getStatusIcon(bed.status)} style={{ borderRadius: 8, fontWeight: 600 }}>
//                         {bed.status}
//                       </Tag>
//                     </div>
//                     <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#0f172a' }}>
//                       Room {bed.room_number || '-'} - Bed {bed.bed_number}
//                     </div>
//                     <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
//                       {bed.bed_type} - ₹{bed.charge_per_day}/day
//                     </div>
//                     <Space size="small" style={{ marginTop: 'auto' }}>
//                       {bed.status === 'Occupied' && (
//                         <Button size="small" icon={<SwapOutlined />} onClick={() => { setSelectedBed(bed); setTransferModal(true); }} style={{ borderRadius: 8 }}>
//                           Transfer
//                         </Button>
//                       )}
//                       <Button size="small" icon={<ToolOutlined />} onClick={() => { setSelectedBed(bed); setMaintenanceModal(true); }} style={{ borderRadius: 8 }}>
//                         Status
//                       </Button>
//                     </Space>
//                   </Card>
//                 </Col>
//               ))}
//             </Row>
//           </div>
//         )
//       }))} />

//       <SliderModal open={transferModal} onCancel={() => setTransferModal(false)} onOk={() => form.submit()} title="Transfer Patient">
//         <Form form={form} layout="vertical" onFinish={handleTransfer}>
//           <Form.Item label="From"><Input value={`${selectedBed?.room_number} - ${selectedBed?.bed_number}`} disabled /></Form.Item>
//           <Form.Item name="to_bed" label="To Bed" rules={[{ required: true }]}>
//             <Select options={beds.filter(b => b.status === 'Available').map(b => ({ 
//               label: `${b.ward?.ward_name} - Room ${b.room_number} - Bed ${b.bed_number}`, 
//               value: b.bed_id 
//             }))} />
//           </Form.Item>
//           <Form.Item name="reason" label="Reason"><Input.TextArea rows={2} /></Form.Item>
//         </Form>
//       </SliderModal>

//       <SliderModal open={maintenanceModal} onCancel={() => setMaintenanceModal(false)} onOk={() => form.submit()} title="Update Bed Status">
//         <Form form={form} layout="vertical" onFinish={handleMaintenance}>
//           <Form.Item label="Bed"><Input value={`${selectedBed?.room_number} - ${selectedBed?.bed_number}`} disabled /></Form.Item>
//           <Form.Item name="status" label="Status" rules={[{ required: true }]}>
//             <Select options={[
//               { label: 'Available', value: 'Available' }, 
//               { label: 'Under Maintenance', value: 'Under Maintenance' }, 
//               { label: 'Occupied', value: 'Occupied' }
//             ]} />
//           </Form.Item>
//           <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
//         </Form>
//       </SliderModal>
//     </div>
//   );
// };

// export default BedManagement;


import { useState } from 'react';
import { Card, Button, Modal, Form, Input, Select, message, Tag, Space, InputNumber } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { bedService, wardService } from '@services';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import DataTable from '@components/common/DataTable';
import { useAuthStore } from '@store';
 
const BedManagement = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
 
  const { data: bedsData, isLoading, refetch } = useApiQuery(['beds'], () => bedService.getAll());
  const { data: wardsData } = useApiQuery(['wards'], () => wardService.getAll());
 
  const createMutation = useApiMutation(
    (data) => bedService.create(data),
    {
      onSuccess: () => {
        message.success('Bed created successfully');
        setModalOpen(false);
        form.resetFields();
        refetch();
      },
      onError: (error) => message.error(error?.response?.data?.message || 'Failed to create bed')
    }
  );
 
  const updateMutation = useApiMutation(
    ({ id, data }) => bedService.update(id, data),
    {
      onSuccess: () => {
        message.success('Bed updated successfully');
        setModalOpen(false);
        setEditingBed(null);
        form.resetFields();
        refetch();
      },
      onError: (error) => message.error(error?.response?.data?.message || 'Failed to update bed')
    }
  );
 
  const deleteMutation = useApiMutation(
    (id) => bedService.delete(id),
    {
      onSuccess: () => {
        message.success('Bed deleted successfully');
        refetch();
      },
      onError: () => message.error('Failed to delete bed')
    }
  );
 
  const beds = bedsData?.data || [];
  const wards = wardsData?.data || [];
 
  const handleSubmit = async (values) => {
    const bedData = {
      ...values,
      hospital_id: user?.hospital_id
    };
 
    if (editingBed) {
      updateMutation.mutate({ id: editingBed.bed_id, data: bedData });
    } else {
      createMutation.mutate(bedData);
    }
  };
 
  const handleEdit = (bed) => {
    setEditingBed(bed);
    form.setFieldsValue(bed);
    setModalOpen(true);
  };
 
  const handleDelete = (bedId) => {
    Modal.confirm({
      title: 'Delete Bed',
      content: 'Are you sure you want to delete this bed?',
      onOk: () => deleteMutation.mutate(bedId)
    });
  };
 
  const columns = [
    {
      title: 'Ward',
      key: 'ward',
      render: (_, record) => record.ward?.ward_name || '-'
    },
    {
      title: 'Room',
      dataIndex: 'room_number',
      key: 'room_number',
      render: (text) => text || '-'
    },
    { title: 'Bed Number', dataIndex: 'bed_number', key: 'bed_number' },
    { title: 'Type', dataIndex: 'bed_type', key: 'bed_type' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'Available': 'green',
          'Occupied': 'blue',
          'Under Maintenance': 'orange'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Charge/Day',
      dataIndex: 'charge_per_day',
      key: 'charge_per_day',
      render: (charge) => `₹${charge}`
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.bed_id)} />
        </Space>
      )
    }
  ];
 
  return (
    <Card
      title="Bed Management"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingBed(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Add Bed
        </Button>
      }
    >
      <DataTable
        columns={columns}
        dataSource={beds}
        rowKey="bed_id"
        loading={isLoading}
      />
 
      <SliderModal
        title={editingBed ? 'Edit Bed' : 'Add Bed'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingBed(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="ward_id"
            label="Ward"
            rules={[{ required: true, message: 'Please select ward' }]}
          >
            <Select
              placeholder="Select ward"
              options={wards.map(w => ({
                label: w.ward_name,
                value: w.ward_id
              }))}
            />
          </Form.Item>
 
          <Form.Item name="room_number" label="Room Number">
            <Input placeholder="Enter room number (e.g., 101)" />
          </Form.Item>
 
          <Form.Item
            name="bed_number"
            label="Bed Number"
            rules={[{ required: true, message: 'Please enter bed number' }]}
          >
            <Input placeholder="Enter bed number (e.g., A1)" />
          </Form.Item>
 
          <Form.Item
            name="bed_type"
            label="Bed Type"
            rules={[{ required: true, message: 'Please select bed type' }]}
          >
            <Select
              placeholder="Select bed type"
              options={[
                { label: 'General', value: 'General' },
                { label: 'Oxygen', value: 'Oxygen' },
                { label: 'Ventilator', value: 'Ventilator' }
              ]}
            />
          </Form.Item>
 
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              placeholder="Select status"
              options={[
                { label: 'Available', value: 'Available' },
                { label: 'Occupied', value: 'Occupied' },
                { label: 'Under Maintenance', value: 'Under Maintenance' }
              ]}
            />
          </Form.Item>
 
          <Form.Item
            name="charge_per_day"
            label="Charge Per Day"
            rules={[{ required: true, message: 'Please enter charge per day' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="Enter charge per day"
              prefix="₹"
            />
          </Form.Item>
 
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingBed ? 'Update' : 'Add'} Bed
              </Button>
              <Button onClick={() => {
                setModalOpen(false);
                setEditingBed(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>
    </Card>
  );
};
 
export default BedManagement;
 
 
 