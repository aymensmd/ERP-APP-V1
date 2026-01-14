import React from 'react';
import { Typography, Card, Calendar as AntCalendar, Badge, ConfigProvider } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Paragraph } = Typography;

const getListData = (value) => {
  const listData = [];
  if (value.date() === 8) {
    listData.push({ type: 'warning', content: 'Team sync meeting 10:00' });
  }
  if (value.date() === 10) {
    listData.push({ type: 'success', content: 'Project deadline' });
  }
  if (value.date() === 15) {
    listData.push({ type: 'error', content: 'Office closed (Holiday)' });
  }
  return listData;
}

const dateCellRender = (value) => {
  const listData = getListData(value);
  return (
    <ul className="events" style={{ paddingLeft: 8, margin: 0 }}>
      {listData.map((item, idx) => (
        <li key={idx} style={{ listStyle: 'none', marginBottom: 4 }}>
          <Badge status={item.type} text={item.content} />
        </li>
      ))}
    </ul>
  );
}

const Calendar = () => {
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
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ 
            marginBottom: '8px', 
            color: colors.textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CalendarOutlined style={{ color: colors.primary }} />
            Calendar
          </Title>
          <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: '16px' }}>
            View and manage your events, meetings, and deadlines.
          </Paragraph>
        </div>
        <Card 
          style={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg
          }}
        >
          <AntCalendar
            fullscreen={false}
            dateCellRender={dateCellRender}
            style={{ background: 'transparent' }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default Calendar;
