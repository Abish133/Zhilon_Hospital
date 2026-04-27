import { Result, Button } from 'antd';
import { HomeOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ErrorBoundaryPage = ({ error, resetErrorBoundary }) => {
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
          status="error"
          icon={<WarningOutlined style={{ color: '#ef4444' }} />}
          title={<span style={{ fontSize: 24, fontWeight: 600 }}>Oops! Something went wrong</span>}
          subTitle={
            <div style={{ marginTop: 16 }}>
              <p style={{ color: '#64748b', fontSize: 15, marginBottom: 8 }}>
                We encountered an unexpected error. This has been logged and we'll look into it.
              </p>
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 16,
                  textAlign: 'left'
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#991b1b', fontFamily: 'monospace' }}>
                    {error.toString()}
                  </p>
                </div>
              )}
            </div>
          }
          extra={[
            <Button
              key="home"
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
            </Button>,
            <Button
              key="retry"
              icon={<ReloadOutlined />}
              size="large"
              onClick={resetErrorBoundary}
            >
              Try Again
            </Button>
          ]}
        />
      </div>
    </div>
  );
};

export default ErrorBoundaryPage;
