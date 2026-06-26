import { Form, Input, Button, Typography, Result, message } from 'antd';
import { LockOutlined, ArrowRightOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthService from '@services/AuthService';
import { useState } from 'react';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await AuthService.resetPassword(token, values.password);
      message.success(response?.message || 'Password reset successfully.');
      setDone(true);
    } catch (error) {
      message.error(error?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#0a0a0a', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>
            <MedicineBoxOutlined />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>HMS</div>
            <div style={{ fontSize: 12, color: '#a3a3a3' }}>Hospital Management System</div>
          </div>
        </div>

        {!token ? (
          <Result
            status="warning"
            title="Invalid reset link"
            subTitle="This link is missing its token. Please request a new password reset."
            extra={<Button type="primary" onClick={() => navigate('/login')}>Back to sign in</Button>}
          />
        ) : done ? (
          <Result
            status="success"
            title="Password updated"
            subTitle="Your password has been reset. You can now sign in with your new password."
            extra={<Button type="primary" onClick={() => navigate('/login')}>Go to sign in</Button>}
          />
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>Set a new password</Title>
              <Text className="hms-muted" style={{ fontSize: 14 }}>Choose a strong password you don't use elsewhere.</Text>
            </div>

            <Form name="reset-password" form={form} onFinish={onFinish} layout="vertical" requiredMark={false}>
              <Form.Item
                name="password"
                label="New password"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined style={{ color: '#a3a3a3' }} />}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="Confirm new password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm the new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords that you entered do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined style={{ color: '#a3a3a3' }} />}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Form.Item>

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
                Reset password
              </Button>
            </Form>

            <Button
              type="link"
              block
              onClick={() => navigate('/login')}
              style={{ marginTop: 16, color: '#0a0a0a' }}
            >
              Back to sign in
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
