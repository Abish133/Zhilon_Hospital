import { useState } from 'react';
import { Steps, Form, Input, Button, Select, Typography, Space, message } from 'antd';
import { MedicineBoxOutlined, BankOutlined, UserOutlined, CheckCircleOutlined, ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const InitialSetup = () => {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hospitalId, setHospitalId] = useState(null);
  const navigate = useNavigate();

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');

  const handleHospitalSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/hospitals/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: values.hospitalName,
          licenseNumber: values.licenseNumber,
          address: values.address,
          phone: values.phone,
          hospitalEmail: values.email,
          hospitalType: values.hospitalType,
          pharmacy_mode: values.pharmacy_mode || 'in_house'
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setHospitalId(result.data.id);
      message.success('Hospital registered');
      setCurrent(1);
    } catch (error) {
      message.error(error.message || 'Hospital registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          role: 'Admin',
          hospital_id: hospitalId
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      message.success('Admin account created');
      setCurrent(2);
    } catch (error) {
      message.error(error.message || 'User registration failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Hospital', icon: <BankOutlined /> },
    { title: 'Administrator', icon: <UserOutlined /> },
    { title: 'Ready', icon: <CheckCircleOutlined /> }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#ffffff' }}>
      {/* Left brand panel */}
      <div style={{
        flex: 1.1,
        background: '#0a0a0a',
        color: '#ffffff',
        padding: '48px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }} className="hms-auth-left">
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '22px 22px', opacity: 0.7, pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Space align="center" size={12}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#ffffff', color: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
            }}>
              <MedicineBoxOutlined />
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>HMS</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Workspace setup</div>
            </div>
          </Space>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
          <Title level={1} style={{ color: '#ffffff', fontSize: 40, lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Let's get your hospital set up.
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, display: 'block', marginTop: 14 }}>
            A few details now — and your team will be running OPD, IPD, Pharmacy, Lab and Billing in minutes.
          </Text>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {steps.map((s, i) => {
              const active = current === i;
              const done = current > i;
              return (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: done ? '#ffffff' : active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                    color: done ? '#0a0a0a' : '#ffffff',
                    border: active ? '1px solid rgba(255,255,255,0.35)' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0
                  }}>{done ? <CheckCircleOutlined /> : s.icon}</div>
                  <div>
                    <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, opacity: active || done ? 1 : 0.7 }}>Step {i + 1} · {s.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                      {i === 0 && 'Hospital identity and contact'}
                      {i === 1 && 'Admin credentials for first login'}
                      {i === 2 && 'Sign in and start using HMS'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          Need help? Contact support@hmspro.health
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#ffffff' }}>
        <div style={{ width: '100%', maxWidth: 480 }} className="fade-in">
          <Steps current={current} items={steps} size="small" style={{ marginBottom: 28 }} />

          {current === 0 && (
            <>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Hospital details</Title>
              <Text className="hms-muted">Tell us about your facility.</Text>
              <Form layout="vertical" onFinish={handleHospitalSubmit} requiredMark={false} style={{ marginTop: 20 }}>
                <Form.Item name="hospitalName" label="Hospital name" rules={[{ required: true, message: 'Required' }]}>
                  <Input size="large" placeholder="e.g. City General Hospital" />
                </Form.Item>
                <Form.Item name="hospitalType" label="Type" rules={[{ required: true, message: 'Required' }]}>
                  <Select size="large" placeholder="Select type" options={[
                    { label: 'General Hospital', value: 'general' },
                    { label: 'Specialty Hospital', value: 'specialty' },
                    { label: 'Clinic', value: 'clinic' }
                  ]} />
                </Form.Item>
                <Form.Item name="licenseNumber" label="License number" rules={[{ required: true, message: 'Required' }]}>
                  <Input size="large" placeholder="Medical license / registration no." />
                </Form.Item>
                <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Required' }]}>
                  <Input.TextArea rows={2} placeholder="Street, city, state" />
                </Form.Item>
                <Form.Item
                  name="pharmacy_mode"
                  label="Pharmacy model"
                  initialValue="in_house"
                  rules={[{ required: true, message: 'Required' }]}
                  tooltip="This decides how pharmacy & OT-consumable charges are handled. It is set once and cannot be changed later."
                  extra="Choose carefully — this is locked after registration."
                >
                  <Select size="large" options={[
                    { label: 'In-House Pharmacy — medicines billed to the hospital bill', value: 'in_house' },
                    { label: 'Self-Purchase Pharmacy — patient buys at the pharmacy counter', value: 'self_purchase' }
                  ]} />
                </Form.Item>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Required' }]}>
                    <Input size="large" placeholder="+91 ..." />
                  </Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
                    <Input size="large" placeholder="contact@hospital.com" />
                  </Form.Item>
                </div>
                <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<ArrowRightOutlined />} iconPosition="end" style={{ height: 44, fontWeight: 600, marginTop: 4 }}>
                  Continue
                </Button>
                <Button type="link" block style={{ marginTop: 8, color: '#525252' }} onClick={() => navigate('/login')}>
                  Already have an account? Sign in
                </Button>
              </Form>
            </>
          )}

          {current === 1 && (
            <>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Administrator account</Title>
              <Text className="hms-muted">This is the first user who will manage roles and users.</Text>
              <Form layout="vertical" onFinish={handleUserSubmit} requiredMark={false} style={{ marginTop: 20 }}>
                <Form.Item name="name" label="Full name" rules={[{ required: true, message: 'Required' }]}>
                  <Input size="large" placeholder="e.g. Dr. Anita Rao" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
                  <Input size="large" placeholder="admin@hospital.com" />
                </Form.Item>
                <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}>
                  <Input.Password size="large" placeholder="Minimum 8 characters" />
                </Form.Item>
                <Form.Item
                  name="confirm_password"
                  label="Confirm password"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Required' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Passwords do not match'));
                      }
                    })
                  ]}
                >
                  <Input.Password size="large" placeholder="Retype password" />
                </Form.Item>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => setCurrent(0)} style={{ height: 44 }}>Back</Button>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<ArrowRightOutlined />} iconPosition="end" style={{ height: 44, fontWeight: 600 }}>
                    Create account
                  </Button>
                </div>
              </Form>
            </>
          )}

          {current === 2 && (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: '#0a0a0a', color: '#ffffff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16
              }}>
                <CheckCircleOutlined />
              </div>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>You're all set</Title>
              <Text className="hms-muted">Sign in with your admin credentials to start configuring the workspace.</Text>
              <Button type="primary" size="large" block style={{ height: 44, fontWeight: 600, marginTop: 20 }} onClick={() => navigate('/login')} icon={<ArrowRightOutlined />} iconPosition="end">
                Go to sign in
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hms-auth-left { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default InitialSetup;
