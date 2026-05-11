import { useState } from 'react';
import { Card, Table, Button, Space, Tag, Form, Input, InputNumber, Select, message, Divider, Alert } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, ExperimentOutlined, ScanOutlined, UserOutlined } from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import PackageService from '@services/PackageService';
import apiClient from '@services/apiClient';
import { PACKAGE_TYPES } from '@utils/constants';

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

  // Lab + Radiology test catalogs for the package builder.
  const { data: labTestsData } = useApiQuery(
    ['lab-tests-active'],
    async () => await apiClient.get('/lab-tests'),
    { enabled: packageModal }
  );
  const { data: radTestsData } = useApiQuery(
    ['radiology-tests-active'],
    async () => await apiClient.get('/radiology-tests'),
    { enabled: packageModal }
  );
  const labTests = labTestsData?.data || [];
  const radTests = radTestsData?.data || [];

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

  // Open billing episodes (OPD visits + IPD admissions still active) â€” used by Apply modal.
  const { data: episodesData } = useApiQuery(
    ['open-billing-episodes'],
    async () => await apiClient.get('/billing-episodes', { params: { status: 'Open' } }),
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
      title: 'What\'s Included',
      dataIndex: 'services_included',
      key: 'services_included',
      render: (raw) => {
        const parsed = parseServices(raw);
        const labCount = parsed.lab_test_ids.length;
        const radCount = parsed.rad_test_ids.length;
        const credits = parsed.consult_credits;
        if (!labCount && !radCount && !credits && !parsed._legacy_slugs) return '-';
        return (
          <Space size={4} wrap>
            {labCount > 0 && <Tag color="blue" icon={<ExperimentOutlined />}>{labCount} Lab</Tag>}
            {radCount > 0 && <Tag color="purple" icon={<ScanOutlined />}>{radCount} Imaging</Tag>}
            {credits > 0 && <Tag color="cyan" icon={<UserOutlined />}>{credits} Consult{credits > 1 ? 's' : ''}</Tag>}
            {parsed._legacy_slugs && <Tag color="orange">Legacy: {parsed._legacy_slugs}</Tag>}
          </Space>
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
 
  // Convert API services_included (legacy slug or new structured) into form-state shape.
  const parseServices = (raw) => {
    let v = raw;
    if (typeof v === 'string') {
      try { v = JSON.parse(v); } catch (_) { v = {}; }
    }
    if (!v || typeof v !== 'object') return { lab_test_ids: [], rad_test_ids: [], consult_credits: 0 };
    if (Array.isArray(v)) return { lab_test_ids: [], rad_test_ids: [], consult_credits: 0 };
    // New structured format
    if (v.lab_tests || v.radiology_tests || v.consult_credits != null) {
      return {
        lab_test_ids: Array.isArray(v.lab_tests) ? v.lab_tests : [],
        rad_test_ids: Array.isArray(v.radiology_tests) ? v.radiology_tests : [],
        consult_credits: parseInt(v.consult_credits || 0, 10) || 0
      };
    }
    // Legacy slug format â€” display read-only summary; user must reselect to migrate.
    const slugs = Object.entries(v).filter(([k]) => !['consult', 'consultation'].includes(String(k).toLowerCase()));
    const consultEntry = Object.entries(v).find(([k]) => ['consult', 'consultation'].includes(String(k).toLowerCase()));
    return {
      lab_test_ids: [],
      rad_test_ids: [],
      consult_credits: consultEntry ? (parseInt(consultEntry[1] || 0, 10) || 0) : 0,
      _legacy_slugs: slugs.map(([k, v]) => `${k}Ã—${v}`).join(', ')
    };
  };

  const handleEdit = (packageData) => {
    setSelectedPackage(packageData);
    const parsed = parseServices(packageData.services_included);

    form.setFieldsValue({
      package_name: packageData.package_name,
      package_type: packageData.package_type,
      lab_test_ids: parsed.lab_test_ids,
      rad_test_ids: parsed.rad_test_ids,
      consult_credits: parsed.consult_credits,
      total_charge: packageData.total_charge,
      validity_days: packageData.validity_days,
      hospital_id: packageData.hospital_id,
      is_active: packageData.is_active,
      _legacy_slugs: parsed._legacy_slugs
    });
    setPackageModal(true);
  };

  const handleAdd = () => {
    setSelectedPackage(null);
    form.resetFields();
    setPackageModal(true);
  };

  const handleSubmit = async (values) => {
    // Build the structured services_included payload from the three pickers.
    const services_included = {
      lab_tests: values.lab_test_ids || [],
      radiology_tests: values.rad_test_ids || [],
      consult_credits: parseInt(values.consult_credits || 0, 10) || 0
    };
    const payload = {
      package_name: values.package_name,
      package_type: values.package_type,
      services_included,
      total_charge: values.total_charge,
      validity_days: values.validity_days,
      is_active: values.is_active !== false
    };
    if (selectedPackage) {
      updateMutation.mutate({ id: selectedPackage.package_id, data: payload });
    } else {
      createMutation.mutate(payload);
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
 
      <SliderModal
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
          <Divider style={{ margin: '4px 0 12px' }}>Bundled services</Divider>

          <Form.Item shouldUpdate>
            {() => form.getFieldValue('_legacy_slugs') ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message="Legacy package data detected"
                description={
                  <>
                    This package was created in the old format ({form.getFieldValue('_legacy_slugs')}).
                    Please re-pick the lab and radiology tests below from the master catalog so the
                    package can auto-create real orders when applied.
                  </>
                }
              />
            ) : null}
          </Form.Item>

          <Form.Item
            name="lab_test_ids"
            label="Lab Tests Included"
            extra="When applied, the system creates a single lab order with these tests automatically."
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Pick lab tests from your test master"
              filterOption={(input, option) =>
                String(option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
              options={labTests.map(t => ({
                value: t.test_id,
                label: `${t.test_name}${t.test_code ? ` (${t.test_code})` : ''}${t.charge ? ` â€” ₹${t.charge}` : ''}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="rad_test_ids"
            label="Radiology / Imaging Included"
            extra="When applied, the system creates radiology orders for each selected imaging study."
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Pick imaging from your radiology master"
              filterOption={(input, option) =>
                String(option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
              options={radTests.map(t => ({
                value: t.rad_test_id,
                label: `${t.test_name}${t.test_code ? ` (${t.test_code})` : ''}${t.modality ? ` Â· ${t.modality}` : ''}${t.charge ? ` â€” ₹${t.charge}` : ''}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="consult_credits"
            label="Consultation Credits"
            extra="Number of doctor consultations the package covers. Each consultation during the episode automatically draws against this counter."
            initialValue={0}
          >
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>

          <Divider style={{ margin: '4px 0 12px' }}>Pricing</Divider>

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
      </SliderModal>

      <SliderModal
        open={applyModal}
        title={`Apply Package: ${packageToApply?.package_name || ''}`}
        onCancel={() => { setApplyModal(false); setPackageToApply(null); applyForm.resetFields(); }}
        onOk={() => applyForm.submit()}
        confirmLoading={applyMutation.isPending}
        okText="Apply to Episode"
        width={600}
      >
        {packageToApply && (() => {
          const parsed = parseServices(packageToApply.services_included);
          return (
            <Alert
              style={{ marginBottom: 16 }}
              type="info"
              showIcon
              message={`Charge: ₹${packageToApply.total_charge}`}
              description={
                <Space direction="vertical" size={2}>
                  <span>The system will automatically create on apply:</span>
                  <span>â€¢ <b>{parsed.lab_test_ids.length}</b> lab test{parsed.lab_test_ids.length !== 1 ? 's' : ''} (added to a new lab order)</span>
                  <span>â€¢ <b>{parsed.rad_test_ids.length}</b> imaging study/studies</span>
                  <span>â€¢ <b>{parsed.consult_credits}</b> consultation credit{parsed.consult_credits !== 1 ? 's' : ''} (deducted automatically as doctors see the patient)</span>
                  <span style={{ color: '#666', fontSize: 12 }}>Single bundled charge â€” these items will <i>not</i> be billed individually.</span>
                  {parsed._legacy_slugs && (
                    <span style={{ color: '#d48806' }}>âš  Legacy slug data ({parsed._legacy_slugs}) â€” backend will resolve by test code/name automatically.</span>
                  )}
                </Space>
              }
            />
          );
        })()}
        <Form form={applyForm} layout="vertical" onFinish={handleApplySubmit}>
          <Form.Item
            name="episode_id"
            label="Open Billing Episode"
            rules={[{ required: true, message: 'Please pick an episode' }]}
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
      </SliderModal>
    </div>
  );
};
 
export default PackageManagement;
 
 