import { Typography, Breadcrumb, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Standard page header used across every module page.
 * Keeps a consistent B&W look: title, subtitle, auto breadcrumb, and optional extras.
 */
const PageHeader = ({ title, subTitle, extra, breadcrumb, children }) => {
  const location = useLocation();

  const auto = (() => {
    if (breadcrumb) return breadcrumb;
    const segs = location.pathname.split('/').filter(Boolean);
    if (!segs.length) return null;
    const items = [{ title: <Link to="/dashboard"><HomeOutlined /></Link> }];
    let acc = '';
    segs.forEach((s, i) => {
      acc += `/${s}`;
      const label = s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      items.push({
        title: i === segs.length - 1 ? label : <Link to={acc}>{label}</Link>
      });
    });
    return items;
  })();

  return (
    <div style={{ marginBottom: 18 }}>
      {auto && auto.length > 1 && (
        <Breadcrumb items={auto} style={{ marginBottom: 10, fontSize: 12 }} />
      )}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {title}
          </Title>
          {subTitle && (
            <Text className="hms-muted" style={{ fontSize: 13 }}>{subTitle}</Text>
          )}
        </div>
        {extra && <Space wrap>{extra}</Space>}
      </div>
      {children && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
};

export default PageHeader;
