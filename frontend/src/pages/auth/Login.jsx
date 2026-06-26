import { Form, Input, Button, Typography, Space, Checkbox, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, ArrowRightOutlined, MedicineBoxOutlined, SafetyOutlined, HeartOutlined, TeamOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store';
import AuthService from '@services/AuthService';
import SliderModal from '@components/common/SliderModal';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form] = Form.useForm();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotForm] = Form.useForm();

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      form.setFieldsValue({ username: savedUsername });
      setRememberMe(true);
    }
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await AuthService.login(values);
      const { data } = response;
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', values.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
      
      login(data.token, data);
      message.success('Welcome back');
      navigate('/dashboard');
    } catch (error) {
      message.error(error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    forgotForm.resetFields();
    // Pre-fill with whatever username/email is already typed in the login form.
    const typed = form.getFieldValue('username');
    if (typed && typed.includes('@')) {
      forgotForm.setFieldsValue({ email: typed });
    }
    setForgotOpen(true);
  };

  const handleForgotSubmit = async (values) => {
    setForgotLoading(true);
    try {
      const response = await AuthService.forgotPassword(values.email);
      message.success(response?.message || 'If an account exists for that email, a reset link has been sent.');
      setForgotOpen(false);
    } catch (error) {
      message.error(error?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const features = [
    { icon: <HeartOutlined />, title: 'Patient-first care', desc: 'OPD, IPD, Pharmacy, Lab, Radiology in one workspace.' },
    { icon: <SafetyOutlined />, title: 'Audit-grade security', desc: 'Role-based access with hospital-scoped data.' },
    { icon: <TeamOutlined />, title: 'Built for every role', desc: 'Doctors, nurses, pharmacists, accountants, HR.' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#ffffff' }}>
      {/* Left — brand panel (black) */}
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
        {/* subtle grid */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '22px 22px', opacity: 0.7, pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Space align="center" size={12}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#ffffff', color: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20
            }}>
              <MedicineBoxOutlined />
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>HMS</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Hospital Management System</div>
            </div>
          </Space>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
          <Title level={1} style={{ color: '#ffffff', fontSize: 40, lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Run your hospital with clarity.
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, display: 'block', marginTop: 14 }}>
            One compact, premium workspace for clinical, pharmacy, lab, billing and HR — with audit trail on every action.
          </Text>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0
                }}>{f.icon}</div>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 14 }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          © {new Date().getFullYear()} HMS. All rights reserved.
        </div>
      </div>

      {/* Right — sign-in form (white) */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          <div style={{ marginBottom: 28 }}>
            <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>Sign in</Title>
            <Text className="hms-muted" style={{ fontSize: 14 }}>Welcome back. Enter your credentials to continue.</Text>
          </div>

          <Form name="login" form={form} onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Username is required' }]}
            >
              <Input
                size="large"
                prefix={<UserOutlined style={{ color: '#a3a3a3' }} />}
                placeholder="your.username"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: '#a3a3a3' }} />}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>Remember me</Checkbox>
              <a
                onClick={openForgot}
                style={{ color: '#0a0a0a', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              style={{ height: 44, fontWeight: 600 }}
            >
              Sign in
            </Button>
          </Form>

          <Divider plain style={{ color: '#a3a3a3', fontSize: 12, margin: '24px 0' }}>New hospital?</Divider>

          <Button
            block
            size="large"
            onClick={() => navigate('/setup')}
            style={{ height: 44, fontWeight: 500 }}
          >
            Create a workspace
          </Button>

          <Text className="hms-muted" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 12 }}>
            Protected by hospital-scoped RBAC
          </Text>
        </div>
      </div>

      <SliderModal
        title="Reset your password"
        open={forgotOpen}
        onCancel={() => setForgotOpen(false)}
        onOk={() => forgotForm.submit()}
        okText="Send reset link"
        confirmLoading={forgotLoading}
        width={420}
      >
        <Text className="hms-muted" style={{ display: 'block', marginBottom: 18, fontSize: 14 }}>
          Enter the email address linked to your account and we'll send you a link to set a new password.
        </Text>
        <Form form={forgotForm} layout="vertical" requiredMark={false} onFinish={handleForgotSubmit}>
          <Form.Item
            name="email"
            label="Email address"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email address' }
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined style={{ color: '#a3a3a3' }} />}
              placeholder="you@hospital.com"
              autoComplete="email"
            />
          </Form.Item>
        </Form>
      </SliderModal>

      <style>{`
        @media (max-width: 900px) {
          .hms-auth-left { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
