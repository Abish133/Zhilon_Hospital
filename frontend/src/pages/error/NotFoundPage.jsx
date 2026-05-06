import { useEffect } from 'react';
import { Button, Space, Typography } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const previous = document.title;
    document.title = '404 — Page Not Found';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div style={styles.root}>
      <div style={styles.frame}>
        <div style={styles.eyebrow}>
          <span style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>ERROR · 404</Text>
        </div>

        <div style={styles.numberWrap} aria-hidden="true">
          <span style={{ ...styles.digit, ...styles.digitFilled }}>4</span>
          <span style={{ ...styles.digit, ...styles.digitOutlined }}>0</span>
          <span style={{ ...styles.digit, ...styles.digitFilled }}>4</span>
        </div>

        <svg
          viewBox="0 0 600 60"
          preserveAspectRatio="none"
          style={styles.pulse}
          aria-hidden="true"
        >
          <path
            d="M0 30 L120 30 L150 30 L168 10 L188 50 L208 18 L228 42 L246 30 L600 30"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>

        <h1 style={styles.title}>Page not found</h1>
        <Text style={styles.subtitle}>
          The page you&apos;re looking for has been moved, renamed, or never
          existed. Let&apos;s get you back on track.
        </Text>

        <Space size={10} style={{ marginTop: 28 }}>
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Space>

        <div style={styles.footer}>
          <span style={styles.footerLine} />
          <Text style={styles.footerText}>HOSPITAL · HMS</Text>
          <span style={styles.footerLine} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  root: {
    minHeight: 'calc(100vh - 56px)',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    background:
      'radial-gradient(circle at 20% 0%, #f5f5f5 0%, transparent 40%),' +
      'radial-gradient(circle at 80% 100%, #ededed 0%, transparent 45%),' +
      '#ffffff',
  },
  frame: {
    width: '100%',
    maxWidth: 640,
    background: '#ffffff',
    border: '1px solid #ededed',
    borderRadius: 12,
    padding: '56px 48px 40px',
    textAlign: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    position: 'relative',
    overflow: 'hidden',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 12px',
    border: '1px solid #ededed',
    borderRadius: 999,
    background: '#fafafa',
    marginBottom: 32,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#dc2626',
    boxShadow: '0 0 0 3px rgba(220,38,38,0.12)',
  },
  eyebrowText: {
    fontSize: 11,
    letterSpacing: '0.12em',
    fontWeight: 600,
    color: '#525252',
  },
  numberWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    lineHeight: 1,
  },
  digit: {
    fontFamily: "Inter, 'Segoe UI', sans-serif",
    fontSize: 'clamp(96px, 16vw, 168px)',
    fontWeight: 800,
    letterSpacing: '-0.06em',
    lineHeight: 1,
  },
  digitFilled: {
    color: '#0a0a0a',
  },
  digitOutlined: {
    color: 'transparent',
    WebkitTextStroke: '2px #0a0a0a',
  },
  pulse: {
    display: 'block',
    width: '70%',
    height: 36,
    margin: '8px auto 4px',
    opacity: 0.85,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0a0a0a',
    margin: '12px 0 10px',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    display: 'block',
    fontSize: 14,
    color: '#525252',
    maxWidth: 440,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 40,
    paddingTop: 24,
    borderTop: '1px dashed #ededed',
  },
  footerLine: {
    flex: '0 0 32px',
    height: 1,
    background: '#ededed',
  },
  footerText: {
    fontSize: 10,
    letterSpacing: '0.18em',
    fontWeight: 600,
    color: '#a3a3a3',
  },
};

export default NotFoundPage;
