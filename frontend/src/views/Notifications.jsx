import React, { useState, useEffect } from 'react';
import { Typography, Card, List, Button, Tag, Space, Badge, ConfigProvider, Spin, message } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import axios from '../axios';

const { Title, Paragraph } = Typography;

const Notifications = () => {
  const { theme } = useStateContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readItems, setReadItems] = useState(new Set());

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/notifications');
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unread = items.filter(i => !readItems.has(i.id)).length;

  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      primary: '#1890ff',
      readBg: '#fafafa',
      unreadBg: '#fff',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.65)',
      border: '#303030',
      primary: '#177ddc',
      readBg: '#2a2a2a',
      unreadBg: '#1f1f1f',
    }
  };

  const colors = themeStyles[theme];

  const markAllRead = async () => {
    try {
      await axios.put('/notifications/read-all');
      setReadItems(new Set(items.map(i => i.id)));
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('Failed to mark all as read');
    }
  };

  const toggleRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setReadItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

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
            <BellOutlined style={{ color: colors.primary }} />
            Notifications
            <Badge count={unread} style={{ backgroundColor: '#52c41a' }} />
          </Title>
          <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: '16px' }}>
            All your system and HR notifications will appear here.
          </Paragraph>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Card 
          style={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg
          }}
        >
          <Space style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              onClick={markAllRead}
              disabled={unread === 0}
            >
              Mark all read
            </Button>
          </Space>
          <List
            dataSource={items}
            renderItem={item => {
              const isRead = readItems.has(item.id);
              return (
                <List.Item 
                  actions={[
                    <Button 
                      type="link" 
                      onClick={() => toggleRead(item.id)}
                      style={{ color: colors.primary }}
                    >
                      {isRead ? 'Mark unread' : 'Mark read'}
                    </Button>
                  ]}
                  style={{ 
                    background: isRead ? colors.readBg : colors.unreadBg,
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    border: `1px solid ${colors.border}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <List.Item.Meta
                    title={
                      <span style={{ color: colors.textPrimary }}>
                        {item.title} 
                        {isRead ? (
                          <Tag color="default" style={{ marginLeft: 8 }}>Read</Tag>
                        ) : (
                          <Tag color="processing" style={{ marginLeft: 8 }}>New</Tag>
                        )}
                      </span>
                    }
                    description={
                      <span style={{ color: colors.textSecondary }}>
                        {item.description || item.desc || 'No description'}
                      </span>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
        )}
      </div>
    </ConfigProvider>
  );
};

export default Notifications;
