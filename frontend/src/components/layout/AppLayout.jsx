import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, Drawer, Tooltip, Button, Input, List, Empty } from 'antd';
import {
  DashboardOutlined, UserOutlined, MedicineBoxOutlined, ExperimentOutlined,
  DollarOutlined, LogoutOutlined, MenuOutlined,
  TeamOutlined, BankOutlined, SettingOutlined, FileTextOutlined,
  CameraOutlined, ScissorOutlined, InboxOutlined, ToolOutlined, ClockCircleOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@store';
import { ROLES } from '@utils/constants';
import { useState, useEffect, useMemo } from 'react';
import NotificationBell from '@components/common/NotificationBell';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SIDEBAR_WIDTH = 244;
const SIDEBAR_COLLAPSED = 72;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
      if (w >= 1024 && drawerVisible) setDrawerVisible(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [drawerVisible]);

  const rawMenu = useMemo(() => ([
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/attendance/mark', icon: <ClockCircleOutlined />, label: 'Attendance' },
    { key: '/patients', icon: <UserOutlined />, label: 'Patients', roles: [ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN] },
    {
      key: 'opd-menu', icon: <MedicineBoxOutlined />, label: 'OPD',
      roles: [ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN],
      children: [
        { key: '/opd', label: 'Dashboard' },
        { key: '/opd/board', label: "Today's Board" },
        { key: '/opd/appointments', label: 'Appointments' },
        { key: '/opd/visits', label: 'Visits', roles: [ROLES.RECEPTIONIST, ROLES.NURSE] },
        { key: '/opd/queue', label: 'Queue' },
        { key: '/opd/prescriptions', label: 'Prescriptions', roles: [ROLES.DOCTOR, ROLES.PHARMACIST] },
        { key: '/opd/billing', label: 'Billing Collection', roles: [ROLES.RECEPTIONIST, ROLES.ACCOUNTANT, ROLES.ADMIN] }
      ]
    },
    {
      key: 'ipd-menu', icon: <BankOutlined />, label: 'IPD',
      roles: [ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN],
      children: [
        { key: '/ipd/wards', label: 'Wards', roles: [ROLES.ADMIN, ROLES.NURSE] },
        { key: '/beds/management', label: 'Beds', roles: [ROLES.ADMIN, ROLES.NURSE, ROLES.RECEPTIONIST] },
        { key: '/ipd', label: 'Admissions' },
        { key: '/ipd/nurse-assignments', label: 'Assign Nurse', roles: [ROLES.ADMIN, ROLES.NURSE] },
        { key: '/ipd/nursing-checklist', label: 'Nursing Checklist', roles: [ROLES.ADMIN, ROLES.NURSE] },
        { key: '/ipd/vitals', label: 'Vitals', roles: [ROLES.NURSE, ROLES.DOCTOR] },
        { key: '/ipd/medications', label: 'Medications', roles: [ROLES.DOCTOR, ROLES.NURSE] }
      ]
    },
    {
      key: 'pharmacy-menu', icon: <MedicineBoxOutlined />, label: 'Pharmacy',
      roles: [ROLES.PHARMACIST, ROLES.ADMIN],
      children: [
        { key: '/pharmacy', label: 'Dashboard' },
        { key: '/pharmacy/dispense', label: 'Dispense (OPD)' },
        { key: '/pharmacy/ipd', label: 'IPD Pharmacy' },
        { key: '/pharmacy/sales', label: 'Sales' },
        { key: '/pharmacy/medicines', label: 'Medicines' },
        { key: '/pharmacy/batches', label: 'Batches' },
        { key: '/pharmacy/medicine-categories', label: 'Categories' },
        { key: '/pharmacy/billing', label: 'Billing Collection', roles: [ROLES.PHARMACIST, ROLES.ACCOUNTANT, ROLES.ADMIN] }
      ]
    },
    {
      key: 'lab-menu', icon: <ExperimentOutlined />, label: 'Laboratory',
      roles: [ROLES.LAB_TECH, ROLES.ADMIN],
      children: [
        { key: '/lab', label: 'Lab Orders' },
        { key: '/lab/test-master', label: 'Test Master', roles: [ROLES.ADMIN] },
        { key: '/lab/billing', label: 'Billing Collection', roles: [ROLES.LAB_TECH, ROLES.ACCOUNTANT, ROLES.ADMIN] }
      ]
    },
    {
      key: 'radiology-menu', icon: <CameraOutlined />, label: 'Radiology',
      roles: [ROLES.RADIOLOGIST, ROLES.ADMIN],
      children: [
        { key: '/radiology', label: 'Orders' },
        { key: '/radiology/scheduling', label: 'Scheduling' },
        { key: '/radiology/test-master', label: 'Test Master', roles: [ROLES.ADMIN] }
      ]
    },
    {
      key: 'ot-menu', icon: <ScissorOutlined />, label: 'OT',
      roles: [ROLES.DOCTOR, ROLES.ADMIN],
      children: [
        { key: '/ot', label: 'OT Management' },
        { key: '/ot/rooms', label: 'OT Rooms', roles: [ROLES.ADMIN] }
      ]
    },
    {
      key: 'inventory-menu', icon: <InboxOutlined />, label: 'Inventory',
      roles: [ROLES.ADMIN, ROLES.HR, ROLES.PHARMACIST],
      children: [
        { key: '/inventory', label: 'Dashboard' },
        { key: '/inventory/vendors', label: 'Vendors', roles: [ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT] },
        { key: '/inventory/categories', label: 'Categories' },
        { key: '/inventory/purchase-orders', label: 'Purchase Orders' },
        { key: '/inventory/goods-receipt', label: 'Goods Receipt (GRN)' },
        { key: '/inventory/issue-return', label: 'Issue & Return' },
      ]
    },
    {
      key: 'equipment-menu', icon: <ToolOutlined />, label: 'Equipment',
      roles: [ROLES.ADMIN, ROLES.HR],
      children: [
        { key: '/equipment', label: 'Equipment List' },
        { key: '/equipment/dashboard', label: 'Dashboard' },
        { key: '/equipment/maintenance', label: 'Maintenance' },
        { key: '/equipment/preventive-maintenance', label: 'Preventive' },
        { key: '/equipment/maintenance-history', label: 'History' },
        { key: '/equipment/calibration', label: 'Calibration', roles: [ROLES.ADMIN] }
      ]
    },
    {
      key: 'billing-menu', icon: <DollarOutlined />, label: 'Billing',
      roles: [ROLES.ACCOUNTANT, ROLES.RECEPTIONIST, ROLES.ADMIN],
      children: [
        { key: '/billing', label: 'Bills' },
        { key: '/billing/advance', label: 'Advance Payment' },
        { key: '/billing/refunds', label: 'Refunds' },
        { key: '/billing/insurance', label: 'Insurance Claims', roles: [ROLES.ACCOUNTANT, ROLES.ADMIN] },
        { key: '/admin/charges', label: 'Charge Master', roles: [ROLES.ADMIN] },
        { key: '/admin/packages', label: 'Packages', roles: [ROLES.ADMIN] }
      ]
    },
    {
      key: 'hr-menu', icon: <TeamOutlined />, label: 'HR',
      roles: [ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT, ROLES.EMPLOYEE, ROLES.DOCTOR, ROLES.NURSE],
      children: [
        { key: '/employees', label: 'Employees', roles: [ROLES.ADMIN, ROLES.HR] },
        { key: '/admin/attendance', label: 'Attendance', roles: [ROLES.ADMIN, ROLES.HR] },
        { key: '/hr/payroll', label: 'Payroll', roles: [ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT] },
        { key: '/hr/salary-structure', label: 'Salary Structure', roles: [ROLES.ADMIN, ROLES.HR] },
        { key: '/hr/shifts', label: 'Shifts', roles: [ROLES.ADMIN, ROLES.HR] },
        { key: '/hr/roster', label: 'Roster', roles: [ROLES.ADMIN, ROLES.HR] },
        { key: '/hr/leave-requests', label: 'Leave Requests', roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.DOCTOR, ROLES.NURSE] }
      ]
    },
    {
      key: 'doctors-menu', icon: <UserOutlined />, label: 'Doctors',
      roles: [ROLES.ADMIN, ROLES.HR, ROLES.DOCTOR],
      children: [
        { key: '/admin/doctors', label: 'Doctors', roles: [ROLES.ADMIN, ROLES.HR] },
        { key: '/admin/schedules', label: 'Schedules', roles: [ROLES.ADMIN, ROLES.HR, ROLES.DOCTOR] },
        { key: '/admin/doctor-qualifications', label: 'Qualifications', roles: [ROLES.ADMIN, ROLES.HR] },
        { key: '/admin/doctor-leaves', label: 'Leaves', roles: [ROLES.ADMIN, ROLES.HR, ROLES.DOCTOR] }
      ]
    },
    {
      key: 'reports-menu', icon: <FileTextOutlined />, label: 'Reports',
      roles: [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.HR],
      children: [
        { key: '/reports', label: 'Standard' },
        { key: '/reports/detailed', label: 'Detailed' },
        { key: '/reports/advanced', label: 'Advanced' }
      ]
    },
    { key: '/admin/audit-logs', icon: <FileTextOutlined />, label: 'Audit Logs', roles: [ROLES.ADMIN] },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings', roles: [ROLES.ADMIN] }
  ]), []);

  const menuItems = useMemo(() => {
    const userRole = (user?.role || '').toLowerCase();
    const isAdmin = userRole === ROLES.ADMIN.toLowerCase();
    return rawMenu
      .filter(item => isAdmin || !item.roles || item.roles.some(r => r.toLowerCase() === userRole))
      .map(item => {
        if (!item.children) return item;
        const children = item.children.filter(c => isAdmin || !c.roles || c.roles.some(r => r.toLowerCase() === userRole));
        return { ...item, children };
      })
      .filter(item => !item.children || item.children.length > 0);
  }, [rawMenu, user]);

  // Expand the parent menu when landing on a child path
  const openKeys = useMemo(() => {
    const parent = menuItems.find(m => m.children?.some(c => c.key === location.pathname));
    return parent ? [parent.key] : [];
  }, [location.pathname, menuItems]);

  const [userOpenKeys, setUserOpenKeys] = useState(openKeys);
  useEffect(() => { setUserOpenKeys(openKeys); }, [openKeys]);

  const userMenuItems = [
    { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
    { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Log out', icon: <LogoutOutlined />, danger: true }
  ];

  const handleUserMenu = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login'); }
    else if (key === 'profile') navigate('/profile');
    else if (key === 'settings') navigate('/settings');
  };


  const handleGlobalSearch = async (q) => {
    setSearchQuery(q);
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const { default: apiClient } = await import('@services/apiClient');
      const res = await apiClient.get(`/patients?search=${encodeURIComponent(q)}&pageSize=8`);
      const patients = res.data?.data?.data || res.data?.data || [];
      setSearchResults(patients.slice(0, 8));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSelect = (uhid) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/patients/${uhid}`);
  };

  const handleNav = ({ key }) => {
    if (!key.startsWith('/')) return;
    navigate(key);
    if (isMobile || isTablet) setDrawerVisible(false);
  };

  const showDrawer = isMobile || isTablet;
  const railMode = !showDrawer && sidebarCollapsed;

  const pageTitle = useMemo(() => {
    const all = menuItems.flatMap(m => [m, ...(m.children || [])]);
    return all.find(x => x.key === location.pathname)?.label || 'Dashboard';
  }, [location.pathname, menuItems]);

  const brand = (
    <div style={{
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: railMode ? 0 : '0 16px',
      justifyContent: railMode ? 'center' : 'flex-start',
      borderBottom: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: railMode
          ? 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))'
          : '#ffffff',
        border: railMode ? '1px solid rgba(255,255,255,0.14)' : 'none',
        boxShadow: railMode ? 'none' : '0 2px 8px rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
        color: railMode ? '#ffffff' : '#0a0a0a'
      }}>
        <MedicineBoxOutlined />
      </div>
      {!railMode && (
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>HMS</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 500 }}>{user?.hospital_name || 'Healthcare workspace'}</div>
        </div>
      )}
    </div>
  );

  const sidebar = (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a'
    }}>
      {brand}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={railMode ? [] : userOpenKeys}
          onOpenChange={(keys) => setUserOpenKeys(keys)}
          items={menuItems}
          onClick={handleNav}
          inlineCollapsed={railMode}
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
            fontSize: 13
          }}
        />
      </div>
      <div style={{
        padding: railMode ? '12px 8px' : 12,
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="topRight" trigger={['click']}>
          <Tooltip title={railMode ? (user?.name || user?.username || 'User') : ''} placement="right">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: railMode ? '6px' : '8px 10px',
            borderRadius: 10,
            justifyContent: railMode ? 'center' : 'flex-start',
            transition: 'all 0.2s ease',
            border: railMode ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = railMode ? 'transparent' : 'rgba(255,255,255,0.1)';
            }}
          >
            <Avatar size={railMode ? 36 : 32} style={{
              background: railMode
                ? 'linear-gradient(135deg, #ffffff, #d4d4d4)'
                : '#ffffff',
              color: '#0a0a0a',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.6)'
            }}>
              {(user?.name || user?.username || 'U').toString().charAt(0).toUpperCase()}
            </Avatar>
            {!railMode && (
              <div style={{ lineHeight: 1.2, overflow: 'hidden' }}>
                <div style={{
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)'
                }}>
                  {user?.name || user?.username || 'User'}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: 11,
                  textTransform: 'capitalize'
                }}>
                  {user?.role || 'Role'}
                </div>
              </div>
            )}
          </div>
          </Tooltip>
        </Dropdown>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {!showDrawer && (
        <Sider
          trigger={null}
          collapsible
          collapsed={sidebarCollapsed}
          collapsedWidth={SIDEBAR_COLLAPSED}
          width={SIDEBAR_WIDTH}
          style={{
            background: '#0a0a0a',
            position: 'fixed',
            left: 0, top: 0, bottom: 0,
            zIndex: 100,
            overflow: 'hidden',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)',
            transition: 'all .2s ease'
          }}
        >
          {sidebar}
        </Sider>
      )}

      {showDrawer && (
        <Drawer
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          closable={false}
          width={SIDEBAR_WIDTH}
          styles={{
            body: {
              padding: 0,
              background: '#0a0a0a'
            },
            header: { display: 'none' }
          }}
        >
          {sidebar}
        </Drawer>
      )}

      <Layout style={{
        marginLeft: showDrawer ? 0 : (sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH),
        transition: 'margin-left .2s ease',
        background: '#f5f5f5'
      }}>
        <Header style={{
          height: 56,
          padding: '0 20px',
          background: '#ffffff',
          borderBottom: '1px solid #ededed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <Space size={10}>
            <Tooltip title={showDrawer ? 'Menu' : (sidebarCollapsed ? 'Expand' : 'Collapse')}>
              <Button
                type="text"
                icon={showDrawer ? <MenuOutlined /> : (sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
                onClick={() => showDrawer ? setDrawerVisible(true) : toggleSidebar()}
                style={{ height: 36, width: 36 }}
              />
            </Tooltip>
            <Text strong style={{ fontSize: 15, color: '#0a0a0a' }}>{pageTitle}</Text>
          </Space>

          <Space size={8}>
            <Tooltip title="Search">
              <Button type="text" icon={<SearchOutlined />} style={{ height: 36, width: 36 }} onClick={() => setSearchOpen(true)} />
            </Tooltip>
            <NotificationBell />
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight" trigger={['click']}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '4px 8px 4px 4px', borderRadius: 8, transition: 'background .15s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Badge dot color="#16a34a" offset={[-3, 28]}>
                  <Avatar size={30}>{(user?.name || user?.username || 'U').toString().charAt(0).toUpperCase()}</Avatar>
                </Badge>
                {!isMobile && (
                  <div style={{ lineHeight: 1.15 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>{user?.name || user?.username || 'User'}</div>
                    <div style={{ fontSize: 11, color: '#737373', textTransform: 'capitalize' }}>{user?.role || 'Role'}</div>
                  </div>
                )}
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{
          margin: isMobile ? 16 : isTablet ? 20 : 24,
          minHeight: 'calc(100vh - 56px - 48px)'
        }}>
          <div className="fade-in page-wrap">
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Drawer
        title={<Space><SearchOutlined />Search Patients</Space>}
        placement="right"
        open={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
        width={isMobile ? '100%' : '50%'}
        destroyOnClose
        styles={{
          header: { borderBottom: '1px solid #ededed' },
          body: { padding: 20 }
        }}
      >
        <Input.Search
          placeholder="Search by name, UHID or mobile..."
          value={searchQuery}
          onChange={e => handleGlobalSearch(e.target.value)}
          onSearch={handleGlobalSearch}
          loading={searchLoading}
          autoFocus
          size="large"
          allowClear
        />
        <div style={{ marginTop: 12, color: '#737373', fontSize: 12 }}>
          {searchQuery.length < 2
            ? 'Type at least 2 characters to search.'
            : searchLoading
              ? 'Searching…'
              : `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'}`}
        </div>
        {searchResults.length > 0 ? (
          <List
            style={{ marginTop: 8 }}
            dataSource={searchResults}
            renderItem={item => (
              <List.Item
                style={{ cursor: 'pointer', padding: '10px 12px', borderRadius: 8, transition: 'background .15s' }}
                onClick={() => handleSearchSelect(item.uhid)}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ background: '#0a0a0a' }} />}
                  title={<span style={{ fontWeight: 600 }}>{`${item.first_name} ${item.last_name}`} <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{item.uhid}</Text></span>}
                  description={[item.mobile_number, item.gender, item.age ? `${item.age} yrs` : null].filter(Boolean).join(' · ')}
                />
              </List.Item>
            )}
          />
        ) : (
          searchQuery.length >= 2 && !searchLoading && (
            <Empty style={{ marginTop: 24 }} description="No patients found" />
          )
        )}
      </Drawer>
    </Layout>
  );
};

export default AppLayout;
