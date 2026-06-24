import { Card, Tabs, Form, Input, InputNumber, Select, Switch, Button, Space, Divider, message, Modal, List, Spin, Tag, Upload } from 'antd';
import { SaveOutlined, ExclamationCircleOutlined, EditOutlined, DeleteOutlined, PlusOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DepartmentFormModal } from '@components/common/EmployeeModals';
import { departmentService, hospitalService } from '@/services';
import { useAuthStore } from '@/store';
import apiClient from '@config/api';

const { confirm } = Modal;

// Logos are served from the backend origin (not under /api). Build an absolute
// URL for previewing a stored relative path like "/uploads/logos/logo-x.png".
const ASSET_BASE = (apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '');
const toLogoUrl = (u) => !u ? null : (/^https?:/i.test(u) ? u : `${ASSET_BASE}${u.startsWith('/') ? '' : '/'}${u}`);

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const hospitalId = user?.hospital_id;

  const [generalForm] = Form.useForm();
  const [brandingForm] = Form.useForm();
  const [billingForm] = Form.useForm();
  const [notificationsForm] = Form.useForm();

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editDeptModalOpen, setEditDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [savingSection, setSavingSection] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [fetchingDepts, setFetchingDepts] = useState(false);
  const [hospital, setHospital] = useState(null);
  const [fetchingHospital, setFetchingHospital] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchDepartments();
    if (hospitalId) fetchHospital();
  }, [hospitalId]);

  const fetchDepartments = async () => {
    setFetchingDepts(true);
    try {
      const response = await departmentService.getAll();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      message.error('Failed to load departments');
    } finally {
      setFetchingDepts(false);
    }
  };

  const fetchHospital = async () => {
    setFetchingHospital(true);
    try {
      const response = await hospitalService.getById(hospitalId);
      if (response.success && response.data) {
        const h = response.data;
        setHospital(h);
        const hospitalSettings = h.settings || {};
        generalForm.setFieldsValue({
          hospitalName: h.hospitalName,
          address: h.address,
          phone: h.phone,
          hospitalEmail: h.hospitalEmail,
          website: h.website,
          registration_number: h.registration_number
        });
        brandingForm.setFieldsValue({
          logo_url: h.logo_url,
          header_html: h.header_html,
          footer_html: h.footer_html
        });
        setLogoPreview(toLogoUrl(h.logo_url));
        billingForm.setFieldsValue({
          gst_number: h.gst_number,
          pan_number: h.pan_number,
          tax_rate: hospitalSettings.tax_rate ?? 18,
          currency: hospitalSettings.currency || 'INR',
          auto_billing: hospitalSettings.auto_billing ?? true
        });
        notificationsForm.setFieldsValue({
          email_notifications: hospitalSettings.email_notifications ?? true,
          sms_notifications: hospitalSettings.sms_notifications ?? false,
          low_stock_alerts: hospitalSettings.low_stock_alerts ?? true
        });
      }
    } catch (error) {
      message.error('Failed to load hospital settings');
    } finally {
      setFetchingHospital(false);
    }
  };

  const handleSaveGeneral = async (values) => {
    if (!hospitalId) return message.error('Hospital context missing');
    setSavingSection('General');
    try {
      const response = await hospitalService.update(hospitalId, values);
      if (response.success) {
        setHospital(response.data);
        message.success('General settings saved successfully');
      } else {
        message.error(response.message || 'Save failed');
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveBranding = async (values) => {
    if (!hospitalId) return message.error('Hospital context missing');
    setSavingSection('Branding');
    try {
      const response = await hospitalService.update(hospitalId, values);
      if (response.success) {
        setHospital(response.data);
        message.success('Branding settings saved successfully');
      } else {
        message.error(response.message || 'Save failed');
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to save branding settings');
    } finally {
      setSavingSection(null);
    }
  };

  // Validate, upload, and persist the logo immediately (returns a stored URL we
  // drop into the hidden logo_url field so "Save Changes" keeps it).
  const handleLogoUpload = async ({ file, onSuccess, onError }) => {
    if (!hospitalId) { message.error('Hospital context missing'); return; }
    const isImage = ['image/png', 'image/jpeg'].includes(file.type);
    if (!isImage) { message.error('Logo must be a PNG or JPG image'); onError?.(new Error('bad type')); return; }
    if (file.size > 2 * 1024 * 1024) { message.error('Logo must be 2MB or smaller'); onError?.(new Error('too big')); return; }

    setUploadingLogo(true);
    try {
      const res = await hospitalService.uploadLogo(hospitalId, file);
      if (res.success) {
        const url = res.data.logo_url;
        brandingForm.setFieldsValue({ logo_url: url });
        setLogoPreview(toLogoUrl(url));
        if (res.data.hospital) setHospital(res.data.hospital);
        message.success('Logo uploaded successfully');
        onSuccess?.(res);
      } else {
        message.error(res.message || 'Logo upload failed');
        onError?.(new Error(res.message));
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Logo upload failed');
      onError?.(error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveBilling = async (values) => {
    if (!hospitalId) return message.error('Hospital context missing');
    setSavingSection('Billing');
    try {
      const { gst_number, pan_number, ...settingsValues } = values;
      const payload = {
        gst_number,
        pan_number,
        settings: { ...(hospital?.settings || {}), ...settingsValues }
      };
      const response = await hospitalService.update(hospitalId, payload);
      if (response.success) {
        setHospital(response.data);
        message.success('Billing settings saved successfully');
      } else {
        message.error(response.message || 'Save failed');
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveNotifications = async (values) => {
    if (!hospitalId) return message.error('Hospital context missing');
    setSavingSection('Notifications');
    try {
      const payload = {
        settings: { ...(hospital?.settings || {}), ...values }
      };
      const response = await hospitalService.update(hospitalId, payload);
      if (response.success) {
        setHospital(response.data);
        message.success('Notification settings saved successfully');
      } else {
        message.error(response.message || 'Save failed');
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSection(null);
    }
  };

  const handleEditDept = (dept) => {
    setSelectedDept(dept);
    setEditDeptModalOpen(true);
  };

  const handleDeleteDept = (dept) => {
    confirm({
      title: 'Delete Department',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete ${dept.department_name}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await departmentService.delete(dept.id);
          message.success(`${dept.department_name} deleted successfully`);
          fetchDepartments();
        } catch (error) {
          message.error('Failed to delete department: ' + (error.message || 'Unknown error'));
        }
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#1e293b' }}>System Settings</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Configure your hospital management system</p>
      </div>
      <Card>
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: 'General Settings',
              children: (
                <Spin spinning={fetchingHospital}>
                  <Form form={generalForm} layout="vertical" onFinish={handleSaveGeneral}>
                    <Form.Item label="Hospital Name" name="hospitalName" rules={[{ required: true, message: 'Hospital name is required' }]}>
                      <Input placeholder="Enter hospital name" />
                    </Form.Item>
                    <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Address is required' }]}>
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item label="Contact Number" name="phone" rules={[{ required: true, message: 'Phone is required' }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item label="Email" name="hospitalEmail" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
                      <Input type="email" />
                    </Form.Item>
                    <Form.Item label="Website" name="website">
                      <Input placeholder="https://example.com" />
                    </Form.Item>
                    <Form.Item label="Registration Number" name="registration_number">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Pharmacy Model" tooltip="Selected during hospital registration. This is locked and cannot be changed here.">
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px'
                      }}>
                        <Tag color={hospital?.pharmacy_mode === 'self_purchase' ? 'purple' : 'blue'} style={{ marginInlineEnd: 0 }}>
                          {hospital?.pharmacy_mode === 'self_purchase' ? 'Self-Purchase Pharmacy' : 'In-House Pharmacy'}
                        </Tag>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {hospital?.pharmacy_mode === 'self_purchase'
                            ? 'Patient buys & pays at the pharmacy counter — not added to the hospital bill.'
                            : 'Medicines & OT consumables are billed to the patient’s hospital bill.'}
                        </span>
                        <Tag style={{ marginInlineStart: 'auto', marginInlineEnd: 0 }}>Read-only</Tag>
                      </div>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={savingSection === 'General'}>
                      Save Changes
                    </Button>
                  </Form>
                </Spin>
              )
            },
            {
              key: '1.5',
              label: 'Branding & Documents',
              children: (
                <Spin spinning={fetchingHospital}>
                  <Form form={brandingForm} layout="vertical" onFinish={handleSaveBranding}>
                    <Form.Item label="Hospital Logo" extra="PNG or JPG, up to 2MB. Appears on generated PDF documents (payslips, prescriptions).">
                      <Space direction="vertical" size="middle">
                        {logoPreview && (
                          <img
                            src={logoPreview}
                            alt="Hospital logo"
                            style={{ maxHeight: 80, maxWidth: 240, objectFit: 'contain', border: '1px solid #f0f0f0', borderRadius: 6, padding: 4 }}
                          />
                        )}
                        <Upload
                          accept="image/png,image/jpeg"
                          showUploadList={false}
                          customRequest={handleLogoUpload}
                        >
                          <Button icon={<UploadOutlined />} loading={uploadingLogo}>
                            {logoPreview ? 'Change Logo' : 'Upload Logo'}
                          </Button>
                        </Upload>
                      </Space>
                    </Form.Item>
                    {/* logo_url is set by the uploader and persisted on Save */}
                    <Form.Item name="logo_url" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item label="Footer Note" name="footer_html" extra="A short line printed at the bottom of generated documents — e.g. a thank-you message or terms. Plain text.">
                      <Input.TextArea rows={2} maxLength={200} showCount placeholder="Thank you for choosing us. Wishing you a speedy recovery!" />
                    </Form.Item>

                    <Divider style={{ margin: '8px 0 16px' }} />

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>What appears on your documents</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                        Your logo and the details below are printed automatically on generated PDFs. Edit these in the <b>General</b> and <b>Billing</b> tabs — no HTML needed.
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                        <div><span style={{ color: '#64748b' }}>Hospital name: </span>{hospital?.hospitalName || '—'}</div>
                        <div><span style={{ color: '#64748b' }}>Phone: </span>{hospital?.phone || '—'}</div>
                        <div><span style={{ color: '#64748b' }}>Email: </span>{hospital?.hospitalEmail || '—'}</div>
                        <div><span style={{ color: '#64748b' }}>Address: </span>{hospital?.address || '—'}</div>
                        <div><span style={{ color: '#64748b' }}>GST: </span>{hospital?.gst_number || '—'}</div>
                        <div><span style={{ color: '#64748b' }}>Reg. no: </span>{hospital?.registration_number || '—'}</div>
                      </div>
                    </div>

                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={savingSection === 'Branding'}>
                      Save Changes
                    </Button>
                  </Form>
                </Spin>
              )
            },
            {
              key: '2',
              label: 'Billing Settings',
              children: (
                <Spin spinning={fetchingHospital}>
                  <Form form={billingForm} layout="vertical" onFinish={handleSaveBilling}>
                    <Form.Item label="GST Number" name="gst_number">
                      <Input placeholder="22AAAAA0000A1Z5" />
                    </Form.Item>
                    <Form.Item label="PAN Number" name="pan_number">
                      <Input placeholder="AAAAA0000A" />
                    </Form.Item>
                    <Form.Item
                      label="Default Medicine GST (%)"
                      name="tax_rate"
                      tooltip="Default GST applied to medicines that don't have their own GST set on the Medicine master. Consultation, lab and radiology charges use their own configured rates and are not affected."
                      extra="Applies to pharmacy/medicine lines without a specific GST. Leave 0 if medicines are exempt."
                    >
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Currency" name="currency">
                      <Select options={[
                        { label: 'INR - Indian Rupee', value: 'INR' },
                        { label: 'USD - US Dollar', value: 'USD' }
                      ]} />
                    </Form.Item>
                    <Form.Item label="Enable Auto Billing" name="auto_billing" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={savingSection === 'Billing'}>
                      Save Changes
                    </Button>
                  </Form>
                </Spin>
              )
            },
            {
              key: '3',
              label: 'Notifications',
              children: (
                <Spin spinning={fetchingHospital}>
                  <Form form={notificationsForm} layout="vertical" onFinish={handleSaveNotifications}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Email Notifications</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Receive email alerts for important events</div>
                      </div>
                      <Form.Item name="email_notifications" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>SMS Notifications</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Send SMS to patients</div>
                      </div>
                      <Form.Item name="sms_notifications" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Low Stock Alerts</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Alert when medicine stock is low</div>
                      </div>
                      <Form.Item name="low_stock_alerts" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ marginTop: 16 }} loading={savingSection === 'Notifications'}>
                      Save Changes
                    </Button>
                  </Form>
                </Spin>
              )
            },
            {
              key: '4',
              label: 'Departments',
              children: (
                <div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ marginBottom: 16 }}
                    onClick={() => {
                      setSelectedDept(null);
                      setDeptModalOpen(true);
                    }}
                  >
                    Add Department
                  </Button>
                  <Spin spinning={fetchingDepts}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {departments.length === 0 && !fetchingDepts && <div style={{ color: '#999' }}>No departments found</div>}
                      {departments.map(dept => (
                        <Card
                          key={dept.id}
                          size="small"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>{dept.department_name}</div>
                                {dept.department_code && <Tag color="blue">{dept.department_code}</Tag>}
                              </div>
                              <Space size="small" wrap>
                                {/* <span style={{ fontSize: '13px', color: '#64748b' }}>Head: {dept.head || '-'}</span> */}
                                <span style={{ fontSize: '13px', color: '#64748b' }}>Staff: {dept.employees?.length || 0}</span>
                                {dept.description && <span style={{ fontSize: '13px', color: '#94a3b8' }}>• {dept.description}</span>}
                              </Space>
                            </div>
                            <Space wrap>
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                type="primary"
                                onClick={() => handleEditDept(dept)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                icon={<DeleteOutlined />}
                                danger
                                onClick={() => handleDeleteDept(dept)}
                              >
                                Delete
                              </Button>
                            </Space>
                          </div>
                        </Card>
                      ))}
                    </Space>
                  </Spin>
                </div>
              )
            },
            {
              key: '5',
              label: 'Administration',
              children: (
                <List
                  dataSource={[
                    { title: 'Charge Master', desc: 'Configure service charges and rates', path: '/admin/charges' },
                    { title: 'User Management', desc: 'Manage system users and roles', path: '/admin/users' },
                    { title: 'Doctor Schedules', desc: 'Configure doctor OPD schedules', path: '/admin/schedules' },
                    { title: 'Attendance & Payroll', desc: 'Manage employee attendance and payroll', path: '/admin/attendance' },
                    { title: 'Audit Logs', desc: 'View system audit logs', path: '/admin/audit-logs' },
                    { title: 'Analytics Dashboard', desc: 'View hospital analytics and reports', path: '/admin/analytics' },
                    { title: 'Package Management', desc: 'Manage health checkup packages', path: '/admin/packages' },
                    { title: 'Refund Management', desc: 'Process billing refunds', path: '/billing/refunds' }
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button key="open" type="link" icon={<RightOutlined />} onClick={() => navigate(item.path)}>Open</Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={item.title}
                        description={item.desc}
                      />
                    </List.Item>
                  )}
                />
              )
            }
          ]} />

        <DepartmentFormModal
          open={deptModalOpen}
          onCancel={() => {
            setDeptModalOpen(false);
            setSelectedDept(null);
          }}
          initialData={selectedDept}
          onSuccess={() => {
            setDeptModalOpen(false);
            setSelectedDept(null);
            message.success('Department created successfully');
            fetchDepartments();
          }}
        />

        <DepartmentFormModal
          open={editDeptModalOpen}
          onCancel={() => {
            setEditDeptModalOpen(false);
            setSelectedDept(null);
          }}
          initialData={selectedDept}
          onSuccess={() => {
            setEditDeptModalOpen(false);
            setSelectedDept(null);
            message.success('Department updated successfully');
            fetchDepartments();
          }}
        />
      </Card>
    </div>
  );
};

export default Settings;
