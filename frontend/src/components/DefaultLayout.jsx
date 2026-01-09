import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Button, Layout, ConfigProvider } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Sidebar from '../global/Sidebar';
import CustomHeader from '../global/CustomHeader';
import '../app.css';
import { theme as antdTheme } from 'antd';
import { useStateContext } from '../contexts/ContextProvider';
import crm from '../assets/crm.png';
const { Sider, Content } = Layout;

export default function DefaultLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState('users_setting');
  const { theme } = useStateContext();
  const siderWidth = collapsed ? 80 : 200;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <Layout 
        style={{ minHeight: '100vh' }}
        className={theme === 'dark' ? 'dark-theme' : ''}
      >
        <Sider
          theme={theme === 'dark' ? 'dark' : 'light'}
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="sider"
          style={{
            position: 'fixed',
            left: 0,
            top: 64,
            bottom: 0,
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
            zIndex: 999,
            boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="logo" />
          <Button
            type="text"
            size="large"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger-btn sidebar-top-trigger"
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1100,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              background: theme === 'dark' ? '#1f1f1f' : '#fff',
              color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : '#595959',
              border: `1px solid ${theme === 'dark' ? '#303030' : '#e8e8e8'}`,
              borderRadius: 8,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              fontSize: 16,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? '#303030' : '#f5f5f5';
              e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#1890ff';
              e.currentTarget.style.borderColor = theme === 'dark' ? '#434343' : '#1890ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? '#1f1f1f' : '#fff';
              e.currentTarget.style.color = theme === 'dark' ? 'rgba(255,255,255,0.85)' : '#595959';
              e.currentTarget.style.borderColor = theme === 'dark' ? '#303030' : '#e8e8e8';
            }}
          />
          <Sidebar onSelectMenuItem={setSelectedMenuItem} />
        </Sider>
        <Layout style={{ 
          marginLeft: siderWidth,
          paddingTop: 64,
          transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          position: 'relative'
        }}>
          <CustomHeader />
          <Content 
            style={{ 
              margin: '0',
              padding: '24px',
              background: theme === 'dark' ? '#0a0a0a' : '#f5f5f7', 
              minHeight: 'calc(100vh - 64px)',
              overflowX: 'hidden',
              marginTop: 0
            }}
            className="main-content-wrapper"
          >
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto',
              width: '100%'
            }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}