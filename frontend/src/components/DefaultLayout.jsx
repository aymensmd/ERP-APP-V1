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
  const siderWidth = collapsed ? 80 : 220;

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
          className="app-sider"
          width={220}
          collapsedWidth={80}
        >
          <div className="logo" />
          <Button
            type="text"
            size="large"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger-btn-custom"
          />
          <Sidebar onSelectMenuItem={setSelectedMenuItem} />
        </Sider>
        <Layout style={{
          marginLeft: siderWidth,
          paddingTop: 64,
          transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          position: 'relative',
          background: 'transparent'
        }}>
          <CustomHeader />
          <Content className="app-content">
            <div className="page-container" style={{ padding: 0 }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
