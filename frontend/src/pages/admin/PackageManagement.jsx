import { useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, message, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import PackageService from '@services/PackageService';
import apiClient from '@services/apiClient';
import { PACKAGE_TYPES, AVAILABLE_SERVICES } from '@utils/constants';

const PackageManagement = () => {
  const [packageModal, setPackageModal] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageToApply, setPackageToApply] = useState(null);
  const [form] = Form.useForm();
  const [applyForm] = Form.useForm();
 
  const { data, isLoading, refetch } = useApiQuery(
    ['packages'],
    () => PackageService.getAll()
  );
 
  const packages = data?.data || [];
 
  const createMutation = useApiMutation(
    (data) => PackageService.register(data),
    {
      successMessage: 'Package created successfully',
      invalidateKeys: ['packages'],
      onSuccess: () => {
        setPackageModal(false);
        form.resetFields();
        refetch();
      }
    }
  );
 
  const updateMutation = useApiMutation(
    ({ id, data }) => PackageService.update(id, data),
    {
      successMessage: 'Package updated successfully',
      invalidateKeys: ['packages'],
      onSuccess: () => {
        setPackageModal(false);
        form.resetFields();
        setSelectedPackage(null);
        refetch();
      }
    }
  );

  // Open billing episodes (OPD visits + IPD admissions still active) — used by Apply modal.
  const { data: episodesData } = useApiQuery(
    ['open-billing-episodes'],
    async () => (await apiClient.get('/billing-episodes', { params: { status: 'Open' } })).data,
    { enabled: applyModal }
  );
  const openEpisodes = episodesData?.data || [];

  const applyMutation = useApiMutation(
    ({ packageId, payload }) => PackageService.applyToEpisode(packageId, payload),
    {
      successMessage: 'Package applied to episode successfully',
      invalidateKeys: ['packages', 'bill-charges'],
      onSuccess: () => {
        setApplyModal(false);
        applyForm.resetFields();
        setPackageToApply(null);
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error.message || 'Failed to apply package');
      }
    }
  );

  const handleApply = (pkg) => {
    setPackageToApply(pkg);
    applyForm.resetFields();
    setApplyModal(true);
  };

  const handleApplySubmit = (values) => {
    if (!packageToApply) return;
    applyMutation.mutate({
      packageId: packageToApply.package_id,
      payload: {
        episode_id: values.episode_id,
        discount_percent: values.discount_percent || 0
      }
    });
  };
 
  const columns = [
    {
      title: 'Package Name',
      dataIndex: 'package_name',
      key: 'package_name',
      render: (name) => <div style={{ fontWeight: 500 }}>{name}</div>
    },
    {
      title: 'Package Type',
      dataIndex: 'package_type',
      key: 'package_type',
      render: (type) => <Tag color="green">{type}</Tag>
    },
    {
      title: 'Services',
      dataIndex: 'services_included',
      key: 'services_included',
      render: (services) => {
        if (!services || !Array.isArray(services)) return '-';
        return (
          <div>
            {services.slice(0, 3).map(service => (
              <Tag key={service} color="blue" style={{ marginBottom: 2 }}>{service}</Tag>
            ))}
            {services.length > 3 && <Tag color="default">+{services.length - 3} more</Tag>}
          </div>
        );
      }
    },
    {
      title: 'Total Charge',
      dataIndex: 'total_charge',
      key: 'total_charge',
      render: (price) => <span style={{ fontWeight: 600, color: '#0a0a0a' }}>₹{price}</span>
    },
    {
      title: 'Validity',
      dataIndex: 'validity_days',
      key: 'validity_days',
      render: (days) => days ? <Tag color="blue">{days} days</Tag> : '-'
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<LinkOutlined />}
            onClick={() => handleApply(record)}
            disabled={!record.is_active}
          >
            Apply
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            type="primary"
            onClick={() => handleEdit(record)}
          />
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
          />
        </Space>
      )
    }
  ];
 
  const handleEdit = (packageData) => {
    setSelectedPackage(packageData);
    const servicesIncluded = Array.isArray(packageData.services_included) 
      ? packageData.services_included 
      : (typeof packageData.services_included === 'string' 
        ? JSON.parse(packageData.services_included) 
        : []);
    
    form.setFieldsValue({
      package_name: packageData.package_name,
      package_type: packageData.package_type,
      services_included: servicesIncluded,
      total_charge: packageData.total_charge,
      validity_days: packageData.validity_days,
      hospital_id: packageData.hospital_id,
      is_active: packageData.is_active
    });
    setPackageModal(true);
  };
 
  const handleAdd = () => {
    setSelectedPackage(null);
    form.resetFields();
    setPackageModal(true);
  };
 
  const handleSubmit = async (values) => {
    if (selectedPackage) {
      updateMutation.mutate({ id: selectedPackage.package_id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };
 
  return (
    <div>
      <Card
        title="Package Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Create Package
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={packages}
          rowKey="package_id"
          loading={isLoading}
        />
      </Card>
 
      <Modal
        open={packageModal}
        onCancel={() => {
          setPackageModal(false);
          setSelectedPackage(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        title={selectedPackage ? 'Edit Package' : 'Create Package'}
        width={600}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="package_name"
            label="Package Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Executive Health Checkup" />
          </Form.Item>
          <Form.Item
            name="package_type"
            label="Package Type"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select package type"
              options={PACKAGE_TYPES}
            />
          </Form.Item>
          <Form.Item
            name="services_included"
            label="Services Included"
          >
            <Checkbox.Group
              options={AVAILABLE_SERVICES.map(s => ({
                label: `${s.label} (₹${s.price})`,
                value: s.value
              }))}
            />
          </Form.Item>
          <Form.Item
            name="total_charge"
            label="Total Charge"
            rules={[{ required: true }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="₹"
              placeholder="Total package charge"
              min={0}
              step={0.01}
            />
          </Form.Item>
          <Form.Item
            name="validity_days"
            label="Validity Days"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Package validity in days"
              min={1}
            />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="Status"
            initialValue={true}
          >
            <Select
              options={[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={applyModal}
        title={`Apply Package: ${packageToApply?.package_name || ''}`}
        onCancel={() => { setApplyModal(false); setPackageToApply(null); applyForm.resetFields(); }}
        onOk={() => applyForm.submit()}
        confirmLoading={applyMutation.isPending}
        okText="Apply to Episode"
        width={560}
      >
        <Form form={applyForm} layout="vertical" onFinish={handleApplySubmit}>
          <Form.Item
            name="episode_id"
            label="Open Billing Episode"
            rules={[{ required: true, message: 'Please pick an episode' }]}
            extra={`Total charge: ₹${packageToApply?.total_charge ?? '-'}`}
          >
            <Select
              showSearch
              placeholder="Select an open episode"
              filterOption={(input, option) =>
                String(option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
              options={openEpisodes.map(ep => ({
                value: ep.episode_id,
                label: `#${ep.episode_id} | ${ep.episode_type} | ${ep.uhid || 'UHID-?'} | ${ep.patient?.first_name || ''} ${ep.patient?.last_name || ''}`.trim()
              }))}
            />
          </Form.Item>
          <Form.Item
            name="discount_percent"
            label="Discount %"
            initialValue={0}
          >
            <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
 
export default PackageManagement;
 
 