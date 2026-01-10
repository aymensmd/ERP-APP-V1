import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Avatar, 
  Tag, Badge, List, Empty, Spin, Alert
} from 'antd';
import { 
  UserOutlined, PlusOutlined, CalendarOutlined, 
  FileTextOutlined, CheckCircleOutlined, ProjectOutlined,
  ShoppingOutlined, UserAddOutlined, WarningOutlined,
  ClockCircleOutlined, TeamOutlined, DollarOutlined,
  DashboardOutlined, ApartmentOutlined, BarChartOutlined,
  FileAddOutlined, MessageOutlined
} from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import './welcomePage.css';

const { Title, Text, Paragraph } = Typography;

const WelcomePage = () => {
  const { user, theme } = useStateContext();
  const { hasPermission, isAdmin, isManager } = usePermissions();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState(null);
  const [urgentItems, setUrgentItems] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Theme-aware colors
  const themeColors = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222',
      textSecondary: '#555',
      border: '#f0f0f0',
      primary: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.65)',
      border: '#303030',
      primary: '#177ddc',
      success: '#49aa19',
      warning: '#d89614',
      error: '#dc4446',
    }
  };

  const colors = themeColors[theme];

  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    try {
      setLoading(true);
      const [contextRes, urgentRes, actionsRes, notificationsRes] = await Promise.all([
        axios.get('/home/user-context').catch(() => ({ data: null })),
        axios.get('/home/urgent-items').catch(() => ({ data: [] })),
        axios.get('/home/quick-actions').catch(() => ({ data: [] })),
        axios.get('/notifications').catch(() => ({ data: [] }))
      ]);

      setUserContext(contextRes.data);
      setUrgentItems(urgentRes.data || []);
      setQuickActions(actionsRes.data || []);
      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data.slice(0, 5) : []);
    } catch (error) {
      console.error('Error fetching home page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (iconName) => {
    const icons = {
      'user-add': <UserAddOutlined />,
      'calendar': <CalendarOutlined />,
      'file-add': <FileAddOutlined />,
      'check-circle': <CheckCircleOutlined />,
      'project': <ProjectOutlined />,
      'plus-circle': <PlusOutlined />,
    };
    return icons[iconName] || <PlusOutlined />;
  };

  const getPriorityColor = (priority) => {
    const colors_map = {
      'critical': colors.error,
      'high': colors.warning,
      'medium': colors.primary,
    };
    return colors_map[priority] || colors.textSecondary;
  };

  const getModuleShortcuts = () => {
    const shortcuts = [];
    
    if (hasPermission('employees.view')) {
      shortcuts.push({ label: 'HR', icon: <TeamOutlined />, path: '/users_setting', permission: 'employees.view' });
    }
    if (hasPermission('invoices.view')) {
      shortcuts.push({ label: 'Finance', icon: <DollarOutlined />, path: '/invoices', permission: 'invoices.view' });
    }
    if (hasPermission('leads.view') || hasPermission('customers.view')) {
      shortcuts.push({ label: 'Sales', icon: <ShoppingOutlined />, path: '/leads', permission: 'leads.view' });
    }
    if (hasPermission('projects.view')) {
      shortcuts.push({ label: 'Projects', icon: <ProjectOutlined />, path: '/projects', permission: 'projects.view' });
    }
    if (hasPermission('reports.view')) {
      shortcuts.push({ label: 'Reports', icon: <BarChartOutlined />, path: '/reports', permission: 'reports.view' });
    }
    if (hasPermission('dashboard.view')) {
      shortcuts.push({ label: 'Dashboard', icon: <DashboardOutlined />, path: '/dashboard', permission: 'dashboard.view' });
    }

    return shortcuts;
  };

  const getRoleDisplayName = () => {
    if (!userContext) return 'Employee';
    const roleName = userContext.role?.name || 'Employee';
    return roleName;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div 
      className={`welcome-container ${theme}`} 
      style={{ 
        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f7',
        padding: '24px',
        minHeight: 'calc(100vh - 64px)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* A. User Context Section */}
      <Card
        style={{ 
          marginBottom: '24px',
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px'
        }}
      >
        <Row align="middle" gutter={[24, 16]}>
          <Col>
            <Badge dot status="success">
              <Avatar 
                size={64} 
                src={userContext?.user?.avatar || user?.avatar}
                icon={<UserOutlined />} 
                style={{ backgroundColor: colors.primary, color: '#fff' }}
              />
            </Badge>
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0, color: colors.textPrimary }}>
              Welcome, {userContext?.user?.name || user?.name || 'User'}
            </Title>
            <Space style={{ marginTop: '8px' }}>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {getRoleDisplayName()}
              </Tag>
              {userContext?.company && (
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  {userContext.company.name}
                </Text>
              )}
            </Space>
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                {userContext?.current_date ? new Date(userContext.current_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                {userContext?.current_time && ` • ${userContext.current_time}`}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* B. Quick Actions Section - Max 5 */}
      {quickActions.length > 0 && (
        <Card
          title={<Text strong style={{ color: colors.textPrimary }}>Quick Actions</Text>}
          style={{ 
            marginBottom: '24px',
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px'
          }}
        >
          <Row gutter={[16, 16]}>
            {quickActions.slice(0, 5).map((action) => (
              <Col xs={24} sm={12} md={8} lg={4} key={action.id}>
                <Button
                  type="primary"
                  icon={getActionIcon(action.icon)}
                  block
                  size="large"
                  onClick={() => navigate(action.url)}
                  style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>{action.label}</div>
                  {action.badge && (
                    <Badge count={action.badge} style={{ position: 'absolute', top: '-8px', right: '-8px' }} />
                  )}
                </Button>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Row gutter={[24, 24]}>
        {/* C. Today / Urgent Items Section */}
        <Col xs={24} lg={14}>
          <Card
            title={<Text strong style={{ color: colors.textPrimary }}>Today / Urgent Items</Text>}
            style={{ 
              marginBottom: '24px',
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              minHeight: '300px'
            }}
          >
            {urgentItems.length === 0 ? (
              <Empty 
                description="No urgent items" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={urgentItems}
                renderItem={(item) => (
                  <List.Item
                    style={{ 
                      padding: '16px',
                      borderBottom: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => navigate(item.action_url)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2a2a2a' : '#fafafa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            backgroundColor: getPriorityColor(item.priority),
                            color: '#fff'
                          }}
                        >
                          {item.priority === 'critical' ? <WarningOutlined /> : 
                           item.priority === 'high' ? <ClockCircleOutlined /> : 
                           <CheckCircleOutlined />}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong style={{ color: colors.textPrimary }}>{item.title}</Text>
                          <Tag color={item.priority === 'critical' ? 'red' : item.priority === 'high' ? 'orange' : 'blue'}>
                            {item.module}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '13px' }}>{item.description}</Text>
                          {item.deadline && (
                            <div style={{ marginTop: '4px' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Deadline: {new Date(item.deadline).toLocaleDateString()}
                              </Text>
                            </div>
                          )}
                        </div>
                      }
                    />
                    {item.count > 0 && (
                      <Badge count={item.count} style={{ backgroundColor: getPriorityColor(item.priority) }} />
                    )}
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* D. Module Shortcuts Section */}
          <Card
            title={<Text strong style={{ color: colors.textPrimary }}>Module Shortcuts</Text>}
            style={{ 
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px'
            }}
          >
            <Row gutter={[16, 16]}>
              {getModuleShortcuts().map((shortcut, index) => (
                <Col xs={12} sm={8} md={6} key={index}>
                  <Card
                    hoverable
                    onClick={() => navigate(shortcut.path)}
                    style={{
                      textAlign: 'center',
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '32px', color: colors.primary, marginBottom: '8px' }}>
                      {shortcut.icon}
                    </div>
                    <Text strong style={{ color: colors.textPrimary }}>{shortcut.label}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
            {getModuleShortcuts().length === 0 && (
              <Empty 
                description="No modules available" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            )}
          </Card>
        </Col>

        {/* E. Notifications Section (Compact) */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <Text strong style={{ color: colors.textPrimary }}>Notifications</Text>
                {notifications.length > 0 && (
                  <Badge count={notifications.length} />
                )}
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/notifications')} style={{ color: colors.primary }}>
                View All
              </Button>
            }
            style={{ 
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              height: '100%'
            }}
          >
            {notifications.length === 0 ? (
              <Empty 
                description="No notifications" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            ) : (
              <List
                size="small"
                dataSource={notifications}
                renderItem={(notification) => (
                  <List.Item
                    style={{ 
                      padding: '12px',
                      borderBottom: `1px solid ${colors.border}`,
                      cursor: 'pointer'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge status={notification.status === 'success' ? 'success' : 
                                      notification.status === 'error' ? 'error' : 'default'} />
                      }
                      title={
                        <Text strong style={{ fontSize: '13px', color: colors.textPrimary }}>
                          {notification.title}
                        </Text>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {notification.description}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WelcomePage;
