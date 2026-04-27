import { Result, Button } from 'antd';
import { HomeOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: 600,
        width: '100%',
        background: 'white',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <Result
          status="403"
          icon={<LockOutlined style={{ color: '#f59e0b' }} />}
          title={<span style={{ fontSize: 24, fontWeight: 600 }}>Access Denied</span>}
          subTitle={
            <p style={{ color: '#64748b', fontSize: 15, marginTop: 16 }}>
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
          }
          extra={
            <Button
              type="primary"
              icon={<HomeOutlined />}
              size="large"
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #0a0a0a 100%)',
                border: 'none'
              }}
            >
              Go to Dashboard
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default UnauthorizedPage;
