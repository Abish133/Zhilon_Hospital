import { useState, useEffect } from 'react';
import { Card, Descriptions, Avatar, Space, Form, Input, Tabs, message, Tag, Spin, Button } from 'antd';
import { LockOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuthStore } from '@store';
import AuthService from '@services/AuthService';

const Profile = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    AuthService.getProfile()
      .then(res => {
        if (!mounted) return;
        setProfile(res.data?.data || res.data);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const handleChangePassword = async (values) => {
    setSavingPassword(true);
    try {
      await AuthService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password
      });
      message.success('Password updated successfully');
      passwordForm.resetFields();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const initial = (profile?.name || profile?.username || 'U').toString().charAt(0).toUpperCase();

  if (loading && !profile) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Card>
        <Space size="large" align="start" style={{ width: '100%' }}>
          <Avatar size={100} style={{ background: '#0a0a0a', color: '#fff', fontSize: 36, fontWeight: 700 }}>
            {initial}
          </Avatar>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{profile?.name || profile?.username || 'User'}</h2>
            <p style={{ color: '#64748b', margin: '8px 0' }}>
              <MailOutlined style={{ marginRight: 6 }} />{profile?.email}
            </p>
            <Space wrap>
              <Tag color="blue" style={{ textTransform: 'capitalize' }}>{profile?.role}</Tag>
              {profile?.isActive !== false && <Tag color="green">Active</Tag>}
              {profile?.hospital?.hospitalName && <Tag>{profile.hospital.hospitalName}</Tag>}
            </Space>
          </div>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs items={[
          {
            key: '1',
            label: 'Personal Information',
            children: (
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Full Name">{profile?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="Email">{profile?.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="Role" contentStyle={{ textTransform: 'capitalize' }}>{profile?.role || '-'}</Descriptions.Item>
                <Descriptions.Item label="Employee ID">{profile?.employee_id || '-'}</Descriptions.Item>
                <Descriptions.Item label="Hospital">{profile?.hospital?.hospitalName || '-'}</Descriptions.Item>
                <Descriptions.Item label="Status">{profile?.isActive === false ? 'Inactive' : 'Active'}</Descriptions.Item>
                <Descriptions.Item label="Department">{profile?.employee?.department?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="Member Since">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</Descriptions.Item>
              </Descriptions>
            )
          },
          {
            key: '2',
            label: 'Change Password',
            children: (
              <Form form={passwordForm} layout="vertical" style={{ maxWidth: 500 }} onFinish={handleChangePassword}>
                <Form.Item label="Current Password" name="current_password" rules={[{ required: true, message: 'Current password is required' }]}>
                  <Input.Password prefix={<LockOutlined />} placeholder="Current password" />
                </Form.Item>
                <Form.Item label="New Password" name="new_password" rules={[{ required: true, message: 'New password is required' }, { min: 6, message: 'At least 6 characters' }]}>
                  <Input.Password prefix={<LockOutlined />} placeholder="New password" />
                </Form.Item>
                <Form.Item
                  label="Confirm Password"
                  name="confirm_password"
                  dependencies={['new_password']}
                  rules={[
                    { required: true, message: 'Please confirm the new password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Passwords do not match'));
                      }
                    })
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={savingPassword} icon={<SaveOutlined />}>Update Password</Button>
                </Form.Item>
              </Form>
            )
          }
        ]} />
      </Card>
    </div>
  );
};

export default Profile;
