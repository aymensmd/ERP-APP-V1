import React from 'react';
import { Card, Typography, ConfigProvider } from 'antd';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Paragraph } = Typography;

const PageContainer = ({ title, subtitle, children, style, extra, icon: Icon }) => {
  const { theme } = useStateContext();

  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      primary: '#1890ff',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.65)',
      border: '#303030',
      primary: '#177ddc',
    }
  };

  const colors = themeStyles[theme];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: colors.cardBg,
          colorText: colors.textPrimary,
          colorBorder: colors.border,
          colorPrimary: colors.primary,
        },
      }}
    >
      <div style={{ 
        padding: '32px', 
        minHeight: 'calc(100vh - 64px)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {(title || subtitle) && (
          <div style={{ marginBottom: '32px' }}>
            {title && (
              <Title level={2} style={{ 
                marginBottom: '8px', 
                color: colors.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {Icon && <Icon style={{ color: colors.primary }} />}
                {title}
              </Title>
            )}
            {subtitle && (
              <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: '16px' }}>
                {subtitle}
              </Paragraph>
            )}
          </div>
        )}
        <Card 
          style={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg,
            ...style
          }} 
          extra={extra}
        >
          {children}
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default PageContainer;
