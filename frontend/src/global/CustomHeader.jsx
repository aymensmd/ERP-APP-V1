import { 
  BellOutlined, 
  UserOutlined, 
  SunOutlined, 
  MoonOutlined,
  QuestionCircleOutlined, 
  MailOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ProfileOutlined,
  BankOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { 
  Avatar, 
  Flex, 
  Dropdown, 
  Card, 
  Button, 
  Badge, 
  List, 
  Modal, 
  Divider, 
  Typography, 
  Space, 
  Tooltip,
  Switch,
  Select
} from 'antd';
import React, { useEffect, useState } from 'react';
import AnyNamecrm from '../assets/AnyNamecrm.png';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider';
import { useCompany } from '../contexts/CompanyContext';
import axios from '../axios';

const { Title, Text } = Typography;

const CustomHeader = () => {
  const { user, token, theme, setTheme, logout } = useStateContext();
  const { currentCompany, companies, switchCompany, loading: companyLoading } = useCompany();
  const navigate = useNavigate();
  const [eventNotifications, setEventNotifications] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [popupEvent, setPopupEvent] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const themeConfig = {
    light: {
      headerBg: '#ffffff',
      textPrimary: '#000000',
      textSecondary: '#595959',
      cardBg: '#ffffff',
      border: '#f0f0f0',
      primary: '#1890ff',
      avatarBg: '#f0f9ff',
      hoverBg: '#f5f5f5',
    },
    dark: {
      headerBg: '#141414',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      cardBg: '#1f1f1f',
      border: '#303030',
      primary: '#177ddc',
      avatarBg: '#111b26',
      hoverBg: '#1d1d1d',
    }
  };

  const currentTheme = themeConfig[theme];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('/events');
        // Handle Laravel API response format
        const events = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setEventNotifications(events.slice(0, 5));
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    if (token) {
      fetchEvents();
    }
  }, [token]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const UserMenu = () => (
    <Card 
      style={{ 
        width: 280,
        padding: 0,

        borderRadius: 8,
        backgroundColor: currentTheme.cardBg,
        borderColor: currentTheme.border,
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.16)'
      }}
    >
      <Flex vertical gap={16} style={{ padding: 24 }}>
        <Flex align="center" gap={16}>
          <Avatar 
            size={64} 
            src={user?.avatar}
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: currentTheme.primary,
              color: '#fff',
              fontSize: 24,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Flex vertical>
            <Title level={5} style={{ margin: 0, color: currentTheme.textPrimary }}>
              {user?.name || 'User Name'}
            </Title>
            <Text type="secondary" style={{ color: currentTheme.textSecondary }}>
              {user?.role?.name || 'Employee'}
            </Text>
          </Flex>
        </Flex>

        <Divider style={{ margin: 0, borderColor: currentTheme.border }} />

        <Flex vertical gap={4}>
          <Button 
            type="text" 
            icon={<DashboardOutlined />}
            block 
            style={{ 
              textAlign: 'left',
              height: 40,
              color: currentTheme.textPrimary,
            }}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>

          <Button 
            type="text" 
            icon={<ProfileOutlined />}
            block 
            style={{ 
              textAlign: 'left',
              height: 40,
              color: currentTheme.textPrimary,
            }}
            onClick={() => navigate('/profile')}
          >
            My Profile
          </Button>

          <Button 
            type="text" 
            icon={<SettingOutlined />}
            block 
            style={{ 
              textAlign: 'left',
              height: 40,
              color: currentTheme.textPrimary,
            }}
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
        </Flex>

        <Divider style={{ margin: 0, borderColor: currentTheme.border }} />

        <Button 
          type="text" 
          icon={<LogoutOutlined />}
          block 
          danger
          style={{ height: 40, textAlign: 'left' }}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </Flex>
    </Card>
  );

  const NotificationMenu = () => (
    <Card
      style={{
        width: 360,
        borderRadius: 8,
        backgroundColor: currentTheme.cardBg,
        borderColor: currentTheme.border,
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.16)',
        padding: 0
      }}
    >
      <Flex justify="space-between" align="center" style={{ 
        padding: '16px', 
        borderBottom: `1px solid ${currentTheme.border}` 
      }}>
        <Text strong style={{ color: currentTheme.textPrimary, fontSize: 16 }}>
          Notifications
        </Text>
        <Badge count={eventNotifications.length} size="small" />
      </Flex>

      {loadingEvents ? (
        <Flex justify="center" style={{ padding: 24 }}>
          <Text type="secondary">Loading notifications...</Text>
        </Flex>
      ) : eventNotifications.length === 0 ? (
        <Flex justify="center" style={{ padding: 24 }}>
          <Text type="secondary">No new notifications</Text>
        </Flex>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={eventNotifications}
          style={{ maxHeight: 400, overflowY: 'auto' }}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${currentTheme.border}`,
                cursor: 'pointer',
                transition: 'background 0.3s',
                ':hover': {
                  backgroundColor: currentTheme.hoverBg
                }
              }}
              onClick={() => {
                setPopupEvent(item);
                setPopupVisible(true);
              }}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot color={item.status === 'urgent' ? 'red' : 'blue'}>
                    <Avatar 
                      size={40} 
                      style={{ 
                        backgroundColor: currentTheme.avatarBg,
                        color: currentTheme.primary
                      }}
                    >
                      {item.title?.charAt(0) || '!'}
                    </Avatar>
                  </Badge>
                }
                title={
                  <Flex justify="space-between">
                    <Text strong style={{ color: currentTheme.textPrimary }}>
                      {item.title || 'Notification'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Flex>
                }
                description={
                  <Text 
                    style={{ 
                      color: currentTheme.textSecondary,
                      fontSize: 13,
                    }}
                    ellipsis={{ rows: 2 }}
                  >
                    {item.description || 'No description provided'}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );

  return (
    <>
      <Flex
        align="center"
        style={{
          height: 64,
          padding: '0 32px',
          lineHeight: '64px',
          backgroundColor: currentTheme.headerBg,
          borderBottom: `1px solid ${currentTheme.border}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Left Section - Logo & Company Switcher */}
        <Flex align="center" gap={24}>
          <Flex align="center">
            <img 
              src={AnyNamecrm} 
              alt="Company Logo" 
              style={{ 
                height: 32,
                marginRight: 12,
                filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none'
              }} 
            />
            <h1 style={{ 
              margin: 0, 
              color: currentTheme.textPrimary, 
              fontSize: 20,
              fontWeight: '600',
              filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none'
            }}>
              AnyName CRM
            </h1>
          </Flex>

          {/* Company Switcher */}
          {companies.length > 0 && (
            <Select
              value={currentCompany?.id}
              onChange={(companyId) => switchCompany(companyId)}
              loading={companyLoading}
              style={{ 
                minWidth: 200,
                color: currentTheme.textPrimary
              }}
              suffixIcon={<SwapOutlined style={{ color: currentTheme.textSecondary }} />}
              options={companies.map(company => ({
                label: (
                  <Flex align="center" gap={8}>
                    <BankOutlined />
                    <span>{company.name}</span>
                  </Flex>
                ),
                value: company.id
              }))}
              popupMatchSelectWidth={false}
              dropdownStyle={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.border,
              }}
            />
          )}
        </Flex>

        {/* Right Section - Actions */}
        <Flex align="center" gap={16} style={{ marginLeft: 'auto' }}>
          <Tooltip title="Help Center">
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              onClick={() => setIsHelpModalOpen(true)}
              style={{
                color: currentTheme.textPrimary,
                fontSize: 18,
                width: 40,
                height: 40
              }}
            />
          </Tooltip>

          <Tooltip title="Messages">
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<MailOutlined />}
                onClick={() => navigate('/messages')}
                style={{
                  color: currentTheme.textPrimary,
                  fontSize: 18,
                  width: 40,
                  height: 40
                }}
              />
            </Badge>
          </Tooltip>

          <Dropdown
            popupRender={() => <NotificationMenu />}
            trigger={['click']}
            placement="bottomRight"
            styles={{ root: { zIndex: 1050 } }}
          >
            <Badge count={eventNotifications.length} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{
                  color: currentTheme.textPrimary,
                  fontSize: 18,
                  width: 40,
                  height: 40
                }}
              />
            </Badge>
          </Dropdown>

          <Tooltip title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            <Switch
              checked={theme === 'dark'}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              style={{
                backgroundColor: theme === 'dark' ? currentTheme.primary : '#d9d9d9'
              }}
            />
          </Tooltip>

          <Dropdown
            popupRender={() => <UserMenu />}
            trigger={['click']}
            placement="bottomRight"
            styles={{ root: { zIndex: 1050 } }}
          >
            <Avatar
              size={36}
              src={user?.avatar}
              icon={<UserOutlined />}
              style={{
                backgroundColor: currentTheme.avatarBg,
                color: currentTheme.primary,
                cursor: 'pointer',
                border: `2px solid ${currentTheme.primary}`
              }}
            />
          </Dropdown>
        </Flex>
      </Flex>

      {/* Help Modal */}
      <Modal
        title="Help Center"
        open={isHelpModalOpen}
        onCancel={() => setIsHelpModalOpen(false)}
        footer={null}
        width={600}
        styles={{ 
          body: { 
            padding: 24,
            backgroundColor: currentTheme.cardBg,
          }
        }}
      >
        <Flex vertical gap={24}>
          <Flex vertical gap={8}>
            <Text strong style={{ color: currentTheme.textPrimary }}>
              Need help with something?
            </Text>
            <Text style={{ color: currentTheme.textSecondary }}>
              Browse our documentation or contact our support team for assistance.
            </Text>
          </Flex>

          <Divider style={{ margin: 0, borderColor: currentTheme.border }} />

          <Flex vertical gap={16}>
            <Button 
              type="primary" 
              block
              onClick={() => window.open('https://help.comunikcrm.com/docs', '_blank')}
            >
              View Documentation
            </Button>
            <Button 
              block
              onClick={() => window.open('mailto:support@comunikcrm.com')}
            >
              Contact Support
            </Button>
          </Flex>
        </Flex>
      </Modal>

      {/* Notification Detail Modal */}
      <Modal
        title={popupEvent?.title || 'Notification Details'}
        open={popupVisible}
        onCancel={() => setPopupVisible(false)}
        footer={null}
        width={600}
        styles={{ 
          body: { 
            padding: 24,
            backgroundColor: currentTheme.cardBg,
          }
        }}
      >
        {popupEvent && (
          <Flex vertical gap={16}>
            <Flex justify="space-between">
              <Text strong style={{ color: currentTheme.textPrimary }}>
                Date & Time:
              </Text>
              <Text style={{ color: currentTheme.textSecondary }}>
                {new Date(popupEvent.start_date).toLocaleString()}
              </Text>
            </Flex>

            {popupEvent.description && (
              <Flex vertical gap={8}>
                <Text strong style={{ color: currentTheme.textPrimary }}>
                  Details:
                </Text>
                <Text style={{ color: currentTheme.textSecondary }}>
                  {popupEvent.description}
                </Text>
              </Flex>
            )}

            <Divider style={{ borderColor: currentTheme.border }} />

            <Flex vertical gap={8}>
              <Text strong style={{ color: currentTheme.textPrimary }}>
                Participants:
              </Text>
              {popupEvent.users?.length > 0 ? (
                <Flex gap={8} wrap="wrap">
                  {popupEvent.users.map(user => (
                    <Flex 
                      key={user.id} 
                      align="center"
                      style={{
                        padding: '4px 12px',
                        backgroundColor: currentTheme.avatarBg,
                        borderRadius: 20,
                        border: `1px solid ${currentTheme.border}`
                      }}
                    >
                      <Avatar 
                        size={24} 
                        src={user.avatar}
                        style={{ 
                          marginRight: 8,
                          backgroundColor: currentTheme.primary,
                          color: '#fff'
                        }}
                      >
                        {user.name?.charAt(0)}
                      </Avatar>
                      <Text style={{ color: currentTheme.textPrimary, fontSize: 12 }}>
                        {user.name}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              ) : (
                <Text style={{ color: currentTheme.textSecondary }}>
                  No participants assigned
                </Text>
              )}
            </Flex>
          </Flex>
        )}
      </Modal>
    </>
  );
};

export default CustomHeader;
