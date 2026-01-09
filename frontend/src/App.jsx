import React, { useState, useEffect } from 'react';
import { Layout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import CustomHeader from './global/CustomHeader';
import Sidebar from './global/Sidebar';
import './app.css';
import { Outlet } from 'react-router-dom';
import { useStateContext } from './contexts/ContextProvider';
import { ConfigProvider, theme as antdTheme } from 'antd';
import WelcomePage from './views/WelcomePage';
const { Header, Content, Footer, Sider } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(true);
  const { theme } = useStateContext();

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >

      
      <Layout style={{ minHeight: '100vh' }} className={theme === 'dark' ? 'dark-theme' : ''}>
       
          <Content className="content-container">
            <div className="content-wrapper">
              <Outlet /> {/* This will render the matched child route */}
            </div>
          </Content>
          

         
        </Layout>
    
    </ConfigProvider>
  );
};

export default App;