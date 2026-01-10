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
import { usePermissions } from '../hooks/usePermissions';

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
  const { hasPermission, hasAnyPermission, isAdmin, isManager } = usePermissions();
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
    const items = [];
    
    // Always visible items
    if (hasPermission('dashboard.view')) {
      items.push(getItem('Home', '/welcome', <HomeOutlined />));
      items.push(getItem('Dashboard', '/dashboard', <WindowsOutlined />));
    }
    
    items.push(getItem('Profile', '/profile', <UserOutlined />));
    
    if (hasPermission('settings.view')) {
      items.push(getItem('Settings', '/settings', <SettingOutlined />));
    }

    // Projects
    if (hasPermission('projects.view')) {
      items.push(getItem('Projects', '/projects', <ProjectOutlined />));
    }

    // Calendar/Events
    if (hasPermission('events.view')) {
      items.push(getItem('Calendar', '/calendar', <CalendarOutlined />));
    }

    // Reports
    if (hasPermission('reports.view')) {
      items.push(getItem('Reports', '/reports', <BarChartOutlined />));
    }

    // Analytics
    if (hasPermission('analytics.view')) {
      items.push(getItem('Analytics', '/analytics', <PieChartOutlined />));
    }

    // Time Tracking
    if (hasPermission('time-tracking.view')) {
      items.push(getItem('Time Tracking', '/timetracking', <ClockCircleOutlined />));
    }

    // Activity Logs (Admin only typically)
    if (hasPermission('audit-logs.view')) {
      items.push(getItem('Activity Logs', '/activity-logs', <HistoryOutlined />));
    }

    // CRM - Leads
    if (hasPermission('leads.view')) {
      items.push(getItem('Leads', '/leads', <CustomerServiceOutlined />));
    }

    // CRM - Customers
    if (hasPermission('customers.view')) {
      items.push(getItem('Customers', '/customers', <UsergroupAddOutlined />));
    }

    // CRM - Invoices
    if (hasPermission('invoices.view')) {
      items.push(getItem('Invoices', '/invoices', <FileTextOutlined />));
    }

    // Kanban Boards
    if (hasPermission('kanban.view')) {
      items.push(getItem('Kanban Boards', '/kanban', <BranchesOutlined />));
    }

    // Organizational Chart
    if (hasPermission('org-chart.view')) {
      items.push(getItem('Org Chart', '/organizational-chart', <UsergroupAddOutlined />));
    }

    // HR Management Section (Admin/Manager)
    const hrSubItems = [];
    
    // Employee Profiles - Admin and Manager only
    if ((isAdmin() || isManager()) && hasPermission('employees.view')) {
      hrSubItems.push(getItem('Employee Profiles', '/users_setting', <UserOutlined />));
    }
    
    if (hasPermission('onboarding.view')) {
      hrSubItems.push(getItem('Onboarding', '/onboarding', <CheckCircleOutlined />));
    }
    
    if (hasPermission('shifts.view')) {
      hrSubItems.push(getItem('Shift Management', '/shifts', <ClockCircleOutlined />));
    }
    
    if (hasPermission('vacations.view')) {
      hrSubItems.push(getItem('Leave Management', '/leaves', <UserOutlined />));
    }

    if (hrSubItems.length > 0) {
      items.push(getItem('HR Management', 'hr', <UsergroupAddOutlined />, hrSubItems));
    }

    // Other items (always visible or with basic checks)
    items.push(getItem('Chat', '/dash/chat', <MessageOutlined />));
    
    // Help & Knowledge Base (can be visible to all)
    items.push(getItem('Help Center', '/help', <QuestionCircleOutlined />));
    items.push(getItem('Knowledge Base', '/knowledge', <BookOutlined />));
    
    // Future features (can add permission checks later)
    // items.push(getItem('Notifications', '/notifications', <BellOutlined />));
    // items.push(getItem('Surveys', '/surveys', <FormOutlined />));
    // items.push(getItem('Rewards', '/rewards', <GiftOutlined />));
    // items.push(getItem('Workflow Builder', 'workflow-builder', <ApartmentOutlined />));
    
    items.push(getItem('Logout', 'logout', loggingOut ? <Spin size="small" /> : <LogoutOutlined />));

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