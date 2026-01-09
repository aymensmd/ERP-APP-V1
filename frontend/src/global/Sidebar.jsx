import React, { useState, useEffect } from 'react';
import {
  HomeOutlined,
  WindowsOutlined,
 
  UserOutlined,
  SettingOutlined,
  MessageOutlined,
  LogoutOutlined,
  ProjectOutlined,
  CalendarOutlined,
  BellOutlined,
  BarChartOutlined,
  PieChartOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FormOutlined,
  GiftOutlined,
  ApartmentOutlined,
  HistoryOutlined,
  UsergroupAddOutlined,
  CustomerServiceOutlined,
  BranchesOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Menu, Spin } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider';

function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

const Sidebar = () => {
  const { user, logout } = useStateContext();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const [current, setCurrent] = useState(location.pathname);

  useEffect(() => {
    setCurrent(location.pathname);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleMenuClick = (e) => {
    setCurrent(e.key);
    if (e.key === 'logout') {
      handleLogout();
    } else {
      navigate(e.key);
    }
  };

  const buildMenuItems = () => {
    const items = [
      getItem('Home', '/welcome', <HomeOutlined />),
      getItem('Dashboard', '/dashboard', <WindowsOutlined />),
      getItem('Profile', '/profile', <UserOutlined />),
      getItem('Settings', '/settings', <SettingOutlined />),
  // Future features
  getItem('Projects', '/projects', <ProjectOutlined />),
  getItem('Calendar', '/calendar', <CalendarOutlined />),
  getItem('Notifications', '/notifications', <BellOutlined />),
  getItem('Reports', '/reports', <BarChartOutlined />),
  getItem('Analytics', '/analytics', <PieChartOutlined />),
  getItem('Help Center', '/help', <QuestionCircleOutlined />),
  getItem('Knowledge Base', '/knowledge', <BookOutlined />),
  getItem('Time Tracking', '/timetracking', <ClockCircleOutlined />),
  getItem('Surveys', '/surveys', <FormOutlined />),
  getItem('Rewards', '/rewards', <GiftOutlined />),
  getItem('Workflow Builder', 'workflow-builder', <ApartmentOutlined />),
  getItem('Activity Logs', '/activity-logs', <HistoryOutlined />),
  getItem('Leads', '/leads', <CustomerServiceOutlined />),
  getItem('Customers', '/customers', <UsergroupAddOutlined />),
  getItem('Invoices', '/invoices', <FileTextOutlined />),
  getItem('Kanban Boards', '/kanban', <BranchesOutlined />),
  getItem('Org Chart', '/organizational-chart', <UsergroupAddOutlined />),
    ];

    // Check if user is admin (role_id === 1)
    const isAdmin = user?.role_id === 1;
    if (isAdmin) {
      items.push(
        getItem('HR Management', 'hr', <UsergroupAddOutlined />, [
          getItem('Employee Profiles', '/users_setting', <UserOutlined />),
          getItem('Onboarding', '/onboarding', <CheckCircleOutlined />),
          getItem('Shift Management', '/shifts', <ClockCircleOutlined />),
          getItem('Leave Management', '/leaves', <UserOutlined />),
        ])
      );
    }

    items.push(
      getItem('Chat', '/dash/chat', <MessageOutlined />),
      getItem('Logout', 'logout', loggingOut ? <Spin size="small" /> : <LogoutOutlined />)
    );

    return items;
  };

  return (
    <Menu
      onClick={handleMenuClick}
      selectedKeys={[current]}
      mode="inline"
      items={buildMenuItems()}
      style={{
        height: '100%',
        overflowY: 'auto',
        maxWidth: '100%',
        paddingTop: '64px', /* space for the trigger button / logo area */
        paddingLeft: '8px',
      
        paddingRight: '8px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
      className="responsive-sidebar"
    />
  );
};

export default Sidebar;