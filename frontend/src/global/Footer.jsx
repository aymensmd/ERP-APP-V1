import React from 'react';
import { Layout, Typography, Space, Divider } from 'antd';
import { 
  GithubOutlined, 
  TwitterOutlined, 
  LinkedinOutlined,
  MailOutlined,
  GlobalOutlined 
} from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';

const { Footer } = Layout;
const { Text, Link } = Typography;

const AppFooter = () => {
  const { theme } = useStateContext();

  return (
    <Footer 
      style={{ 
        backgroundColor: theme === 'dark' ? '#1f1f1f' : '#f0f2f5',
        padding: '24px 50px',
        textAlign: 'center'
      }}
    >
      <Divider style={{ 
        borderColor: theme === 'dark' ? '#303030' : '#d9d9d9',
        marginBottom: 24 
      }} />
      
      <Space direction="vertical" size="middle">
        {/* Social Links */}
        <Space size="large">
          <Link href="https://github.com/yourprofile" target="_blank">
            <GithubOutlined style={{ fontSize: 24 }} />
          </Link>
          <Link href="https://twitter.com/yourprofile" target="_blank">
            <TwitterOutlined style={{ fontSize: 24 }} />
          </Link>
          <Link href="https://linkedin.com/in/yourprofile" target="_blank">
            <LinkedinOutlined style={{ fontSize: 24 }} />
          </Link>
          <Link href="mailto:contact@yourdomain.com">
            <MailOutlined style={{ fontSize: 24 }} />
          </Link>
          <Link href="https://yourwebsite.com" target="_blank">
            <GlobalOutlined style={{ fontSize: 24 }} />
          </Link>
        </Space>

        {/* Navigation Links */}
        <Space size="middle">
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/docs">Documentation</Link>
        </Space>

        {/* Copyright */}
        <Text type="secondary">
          © {new Date().getFullYear()} Your Company Name. All rights reserved.
        </Text>

        {/* Version Info */}
        <Text type="secondary" style={{ fontSize: 12 }}>
          v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
        </Text>
      </Space>
    </Footer>
  );
};

export default AppFooter;
