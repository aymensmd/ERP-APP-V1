import React, { useState } from 'react';
import { Layout, Menu, ConfigProvider } from 'antd';
import { 
  TeamOutlined, 
  CalendarOutlined, 
  TableOutlined
} from '@ant-design/icons';
import EmployeViewComponent from './EmployeViewComponent';
import UserTable from './UserTable';
import EventsComponent from './EventsComponent';
import { Outlet } from 'react-router-dom';
import VacationComponent from './VacationComponent';
import { useStateContext } from '../contexts/ContextProvider';

const { Header, Content } = Layout;

function UserSettingView({ onSelectMenuItem }) {
  const { theme } = useStateContext();
  const [current, setCurrent] = useState('1');

  // Theme styles
  const themeStyles = {
    light: {
      primary: '#1890ff',
      bgContainer: '#f5f5f5',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      headerBg: '#1890ff',
      white: '#ffffff',
    },
    dark: {
      primary: '#177ddc',
      bgContainer: '#141414',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      border: '#303030',
      headerBg: '#1f1f1f',
      white: 'rgba(255, 255, 255, 0.85)',
    }
  };

  const colors = themeStyles[theme];

  const handleMenuClick = (e) => {
    setCurrent(e.key);
    if (onSelectMenuItem) onSelectMenuItem(e.key);
  };

  const renderContent = (key) => {
    switch (key) {
      case '1':
        return <EmployeViewComponent />;
      case '2':
        return <VacationComponent />;
      case '3':
        return <EventsComponent />;
      default:
        return null;
    }
  };

  const menuItems = [
    {
      key: '1',
      icon: <TeamOutlined style={{ fontSize: 18 }} />,
      label: 'Employee Management',
    },
    {
      key: '2',
      icon: <CalendarOutlined style={{ fontSize: 18 }} />,
      label: 'Leave Management',
    },
    {
      key: '3',
      icon: <TableOutlined style={{ fontSize: 18 }} />,
      label: 'Events',
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: colors.primary,
          colorBgContainer: colors.bgContainer,
          colorText: colors.textPrimary,
          colorBorder: colors.border,
        },
      }}
    >
      <Layout style={{ 
        background: colors.bgContainer, 
        minHeight: '100vh',
        transition: 'all 0.2s'
      }}>
        {/* Header */}
        <Header 
          style={{ 
            display: 'flex',
            alignItems: 'center', 
            background: colors.headerBg, 
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
            borderRadius: '0 0 8px 8px',
            marginBottom: 12,
            padding: '0 16px',
            height: 56,
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}
        >
          <Menu
            onClick={handleMenuClick}
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            selectedKeys={[current]}
            style={{ 
              flex: 1, 
              minWidth: 0, 
              background: 'transparent', 
              fontWeight: 600, 
              fontSize: 15, 
              border: 'none',
              lineHeight: '56px'
            }}
            items={menuItems.map(item => ({
              ...item,
              label: <span style={{ color: colors.white }}>{item.label}</span>
            }))}
          />
        </Header>

        {/* Content Area */}
        <Content
          style={{
            padding: '16px',
            margin: 0,
            minHeight: 'calc(100vh - 68px)',
            background: colors.bgContainer,
          }}
        >
          <div style={{
            background: colors.bgContainer,
            borderRadius: '8px',
            padding: '16px',
            minHeight: 'calc(100vh - 100px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${colors.border}`,
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%'
          }}>
            <Outlet />
            {renderContent(current)}
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default UserSettingView;