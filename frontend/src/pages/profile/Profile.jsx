import { Card, Descriptions, Avatar, Button, Space, Form, Input, Tabs } from 'antd';
import { UserOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@store';

const Profile = () => {
  const { user } = useAuthStore();

  return (
    <div>
      <Card>
        <Space size="large" align="start">
          <Avatar size={100} icon={<UserOutlined />} style={{ background: '#6366f1' }} />
          <div>
            <h2 style={{ margin: 0 }}>{user?.username}</h2>
            <p style={{ color: '#64748b', margin: '8px 0' }}>{user?.role}</p>
            <Button icon={<EditOutlined />} type="primary">Edit Profile</Button>
          </div>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs items={[
          {
            key: '1',
            label: 'Personal Information',
            children: (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Username">{user?.username}</Descriptions.Item>
                <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                <Descriptions.Item label="Role">{user?.role}</Descriptions.Item>
                <Descriptions.Item label="Employee ID">{user?.employee_id}</Descriptions.Item>
                <Descriptions.Item label="Status">Active</Descriptions.Item>
                <Descriptions.Item label="Last Login">2025-01-20 10:30 AM</Descriptions.Item>
              </Descriptions>
            )
          },
          {
            key: '2',
            label: 'Change Password',
            children: (
              <Form layout="vertical" style={{ maxWidth: 500 }}>
                <Form.Item label="Current Password" name="current_password" rules={[{ required: true }]}>
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item label="New Password" name="new_password" rules={[{ required: true }]}>
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item label="Confirm Password" name="confirm_password" rules={[{ required: true }]}>
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary">Update Password</Button>
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
