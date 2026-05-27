
import { useState } from 'react';
import { Space, Button, Tag, Card, Row, Col, Statistic, Progress, message } from 'antd';
import { EditOutlined, MedicineBoxOutlined, WarningOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { MedicineFormModal } from '@components/common/ActionModals';
import { useApiQuery } from '@hooks/useApi';
import MedicineService from '@services/MedicineService';
import MedicineCategoryService from '@services/MedicineCategoryService';
import { formatCurrency } from '@utils/helpers';
 
const Pharmacy = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
 
  const { data, isLoading, refetch } = useApiQuery(
    ['medicines', searchQuery],
    () => searchQuery ? MedicineService.search(searchQuery) : MedicineService.getAll()
  );
 
  const { data: categoriesData } = useApiQuery(
    ['categories'],
    () => MedicineCategoryService.getAll()
  );
 
  const medicines = Array.isArray(data) ? data : (data?.data || []);
  const categories = categoriesData?.data || [];
  const lowStockCount = medicines.filter(m => (m.available_quantity || 0) <= (m.reorder_level !== undefined && m.reorder_level !== null ? m.reorder_level : 100)).length;
  const totalValue = medicines.reduce((sum, m) => sum + ((m.available_quantity || 0) * (m.selling_rate || 0)), 0);
 
  const columns = [
    {
      title: 'Medicine',
      dataIndex: 'medicine_name',
      key: 'medicine_name',
      render: (name) => <div style={{ fontWeight: 500 }}>{name}</div>
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => (
        <Tag color="blue">
          {record.medicineCategory ? record.medicineCategory.category_name : (categories.find(cat => cat.category_id === record.category_id)?.category_name || '-')}
        </Tag>
      )
    },
    { title: 'Strength', dataIndex: 'strength', key: 'strength' },
    { title: 'Form', dataIndex: 'dosage_form', key: 'dosage_form' },
    { title: 'Manufacturer', dataIndex: 'manufacturer', key: 'manufacturer' },
  
    // { title: 'Price', dataIndex: 'selling_rate', key: 'price', render: (price = 0) => formatCurrency(price) },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="primary"
            onClick={() => {
              setSelectedMedicine(record);
              setModalOpen(true);
            }}
          />
        </Space>
      )
    }
  ];
 
  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={medicines.length}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#000000' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={lowStockCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#000000' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Inventory Value"
              value={formatCurrency(totalValue)}
              valueStyle={{ color: '#000000' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ marginBottom: 8 }}>Stock Level Health</div>
            <Progress percent={medicines.length > 0 ? Math.round(((medicines.length - lowStockCount) / medicines.length) * 100) : 0} strokeColor="#000000" />
          </Card>
        </Col>
      </Row>
 
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/pharmacy/dispense')}>
            Dispense Medicine
          </Button>
          <Button type="primary" style={{ background: '#10b981', borderColor: '#10b981' }} icon={<MedicineBoxOutlined />} onClick={() => navigate('/pharmacy/ipd')}>
            Issue to IPD Wards
          </Button>
          <Button type="default" onClick={() => navigate('/pharmacy/medicines')}>
            Manage Medicines
          </Button>
        </Space>
        <SearchBar
          placeholder="Search medicines"
          onSearch={setSearchQuery}
          onAdd={() => setModalOpen(true)}
          addButtonText="Add Medicine"
        />
        <DataTable
          columns={columns}
          dataSource={medicines}
          loading={isLoading}
          rowKey="medicine_id"
        />
      </Card>
 
      <MedicineFormModal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedMedicine(null);
        }}
        initialData={selectedMedicine}
        onSuccess={() => {
          setModalOpen(false);
          setSelectedMedicine(null);
          refetch();
        }}
      />
    </div>
  );
};
 
export default Pharmacy;
 
 