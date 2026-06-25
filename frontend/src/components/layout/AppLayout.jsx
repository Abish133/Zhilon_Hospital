import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, Drawer, Tooltip, Button, Input, List, Empty } from 'antd';
import {
  DashboardOutlined, UserOutlined, MedicineBoxOutlined, ExperimentOutlined,
  DollarOutlined, LogoutOutlined, MenuOutlined,
  TeamOutlined, BankOutlined, SettingOutlined, FileTextOutlined,
  CameraOutlined, ScissorOutlined, InboxOutlined, ToolOutlined, ClockCircleOutlined,
  SearchOutlined, DownOutlined, RightOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store';
import { ROLES } from '@utils/constants';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import NotificationBell from '@components/common/NotificationBell';

const { Content } = Layout;
const { Text } = Typography;

const HEADER_HEIGHT = 60;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // module key whose mega panel is open
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = useState(48); // measured (the nav bar can wrap to 2 rows)
  const showDrawer = isMobile || isTablet;

  // patient quick-search drawer (unchanged)
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
        { key: '/inventory/vendor-return', label: 'Vendor Return', roles: [ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT, ROLES.PHARMACIST] },
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
        { key: '/billing/counter', label: 'Counter Billing' },
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
        { key: '/hr/leave-requests', label: 'Leave Requests', roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.DOCTOR, ROLES.NURSE] },
        { key: '/hr/leave-balances', label: 'Leave Balances', roles: [ROLES.ADMIN, ROLES.HR] },
        { key: '/hr/expenses', label: 'Expenses', roles: [ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT] }
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

  // Which top-level module owns the current route (for active pill highlight)
  const routeModuleKey = useMemo(() => {
    const leaf = menuItems.find(m => m.key === location.pathname);
    if (leaf) return leaf.key;
    const group = menuItems.find(m => m.children?.some(c => c.key === location.pathname));
    return group?.key || null;
  }, [location.pathname, menuItems]);

  const openModule = useMemo(() => menuItems.find(m => m.key === openMenu) || null, [openMenu, menuItems]);

  // close the mega panel on Esc / route change
  useEffect(() => { setOpenMenu(null); }, [location.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpenMenu(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Track the nav bar height so the mega panel/backdrop sit right below it,
  // even when the pills wrap onto a second row.
  useEffect(() => {
    if (showDrawer || !navRef.current) return;
    const el = navRef.current;
    const update = () => setNavHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showDrawer, menuItems]);

  const goTo = useCallback((key) => {
    if (!key?.startsWith('/')) return;
    setOpenMenu(null);
    navigate(key);
    if (isMobile || isTablet) setDrawerVisible(false);
  }, [navigate, isMobile, isTablet]);

  const onPillClick = (item) => {
    if (item.children?.length) setOpenMenu(k => (k === item.key ? null : item.key));
    else goTo(item.key);
  };

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

  // ── Brand block ──
  const brand = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer' }} onClick={() => goTo('/dashboard')}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: '#0a0a0a', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        boxShadow: '0 2px 8px rgba(10,10,10,0.25)'
      }}>
        <MedicineBoxOutlined />
      </div>
      {!isMobile && (
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: '#0a0a0a' }}>HMS</div>
          {/* <div style={{ fontSize: 10.5, fontWeight: 500, color: '#a3a3a3', whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.hospital_name || ''}
          </div> */}
        </div>
      )}
    </div>
  );

  // ── Full-width black nav bar below the header (compact, single line) ──
  const navBar = (
    <div
      ref={navRef}
      className="hms-navbar"
      style={{
        position: 'sticky', top: HEADER_HEIGHT, zIndex: 99,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3,
        padding: '6px 14px', rowGap: 4
      }}
    >
      {menuItems.map(item => {
        const active = item.key === routeModuleKey;
        const isOpen = item.key === openMenu;
        const highlight = active || isOpen;
        return (
          <button
            key={item.key}
            onClick={() => onPillClick(item)}
            className="hms-navpill"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 11px',
              border: 'none', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13,
              fontWeight: active ? 700 : 500,
              letterSpacing: '-0.005em',
              background: active ? '#ffffff' : (isOpen ? 'rgba(255,255,255,0.16)' : 'transparent'),
              color: active ? '#0a0a0a' : (highlight ? '#ffffff' : 'rgba(255,255,255,0.74)'),
              boxShadow: active ? '0 2px 10px rgba(0,0,0,0.45)' : 'none'
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = isOpen ? 'rgba(255,255,255,0.16)' : 'transparent'; e.currentTarget.style.color = isOpen ? '#fff' : 'rgba(255,255,255,0.74)'; } }}
          >
            <span style={{ fontSize: 14, display: 'flex', opacity: active ? 1 : 0.85 }}>{item.icon}</span>
            {item.label}
            {item.children?.length > 0 && (
              <DownOutlined style={{ fontSize: 8.5, marginLeft: 1, transition: 'transform .2s ease', transform: isOpen ? 'rotate(180deg)' : 'none', opacity: active ? 0.55 : 0.6 }} />
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Mega panel for the open module ──
  const mega = openModule && !showDrawer && (
    <>
      <div
        className="hms-mega-backdrop"
        onClick={() => setOpenMenu(null)}
        style={{ position: 'fixed', inset: `${HEADER_HEIGHT + navHeight}px 0 0 0`, background: 'rgba(10,10,10,0.18)', zIndex: 97 }}
      />
      <div
        className="hms-mega"
        style={{
          position: 'fixed', top: HEADER_HEIGHT + navHeight, left: 0, right: 0, zIndex: 98,
          background: '#ffffff', borderBottom: '1px solid #ededed',
          boxShadow: '0 18px 40px rgba(10,10,10,0.12)'
        }}
      >
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px 28px 28px', display: 'flex', gap: 32 }}>
          {/* Left intro column */}
          <div className="hms-mega-intro" style={{ width: 220, flexShrink: 0, borderRight: '1px solid #f0f0f0', paddingRight: 28 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, background: '#0a0a0a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              boxShadow: '0 6px 16px -4px rgba(10,10,10,0.4)', marginBottom: 14
            }}>
              {openModule.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{openModule.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a', background: '#f0f0f0', borderRadius: 5, padding: '2px 7px' }}>
                {openModule.children.length} pages
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 14, lineHeight: 1.5 }}>
              Select a page to jump straight there.
            </div>
          </div>

          {/* Right card grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(212px, 1fr))', gap: 10, alignContent: 'start' }}>
            {openModule.children.map((c, i) => {
              const active = c.key === location.pathname;
              return (
                <button
                  key={c.key}
                  className={`hms-mega-cell hms-cell${active ? ' hms-cell-active' : ''}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => goTo(c.key)}
                >
                  <span className="hms-cell-bg" />
                  <span className="hms-cell-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="hms-cell-label">{c.label}</span>
                  <RightOutlined className="hms-cell-arrow" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  // ── Mobile / tablet drawer (classic vertical menu) ──
  const drawerMenu = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
          <MedicineBoxOutlined />
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>HMS</div>
          {/* <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{user?.hospital_name || 'Healthcare workspace'}</div> */}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <Menu
          theme="dark" mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={routeModuleKey ? [routeModuleKey] : []}
          items={menuItems}
          onClick={({ key }) => goTo(key)}
          style={{ background: 'transparent', borderInlineEnd: 'none', fontSize: 13 }}
        />
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* ── Top header bar ── */}
      <div className="hms-appheader" style={{
        height: HEADER_HEIGHT, background: '#ffffff', borderBottom: '1px solid #ededed',
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        {showDrawer && (
          <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} style={{ height: 38, width: 38 }} />
        )}
        {brand}
        <div style={{ flex: 1 }} />

        <Space size={6} style={{ flexShrink: 0 }}>
          <Tooltip title="Find patient">
            <Button type="text" icon={<SearchOutlined />} style={{ height: 38, width: 38 }} onClick={() => setSearchOpen(true)} />
          </Tooltip>
          <NotificationBell />
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight" trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px 4px 4px', borderRadius: 8, transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Badge dot color="#16a34a" offset={[-3, 28]}>
                <Avatar size={32}>{(user?.name || user?.username || 'U').toString().charAt(0).toUpperCase()}</Avatar>
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
      </div>

      {!showDrawer && navBar}
      {mega}

      {showDrawer && (
        <Drawer
          placement="left" onClose={() => setDrawerVisible(false)} open={drawerVisible}
          closable={false} width={260}
          styles={{ body: { padding: 0, background: '#0a0a0a' }, header: { display: 'none' } }}
        >
          {drawerMenu}
        </Drawer>
      )}

      <Content style={{ margin: isMobile ? 16 : isTablet ? 20 : 24, minHeight: 'calc(100vh - 60px - 48px)' }}>
        <div className="fade-in page-wrap">
          <Outlet />
        </div>
      </Content>

      {/* Patient quick-search drawer (unchanged) */}
      <Drawer
        title={<Space><SearchOutlined />Search Patients</Space>}
        placement="right" open={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
        width={isMobile ? '100%' : '50%'} destroyOnClose
        styles={{ header: { borderBottom: '1px solid #ededed' }, body: { padding: 20 } }}
      >
        <Input.Search
          placeholder="Search by name, UHID or mobile..."
          value={searchQuery}
          onChange={e => handleGlobalSearch(e.target.value)}
          onSearch={handleGlobalSearch}
          loading={searchLoading}
          autoFocus size="large" allowClear
        />
        <div style={{ marginTop: 12, color: '#737373', fontSize: 12 }}>
          {searchQuery.length < 2
            ? 'Type at least 2 characters to search.'
            : searchLoading ? 'Searching…' : `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'}`}
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
