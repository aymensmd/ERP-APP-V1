import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Avatar, 
  Tag, Badge, List, Empty, Spin, Statistic, Tooltip,
  Progress, Timeline, Divider
} from 'antd';
import { 
  UserOutlined, PlusOutlined, CalendarOutlined, 
  CheckCircleOutlined, ProjectOutlined,
  ShoppingOutlined, UserAddOutlined, WarningOutlined,
  ClockCircleOutlined, TeamOutlined, DollarOutlined,
  DashboardOutlined, BarChartOutlined,
  FileAddOutlined, BellOutlined, ArrowUpOutlined,
  ArrowDownOutlined, SyncOutlined, FileTextOutlined,
  TrophyOutlined, RiseOutlined, FallOutlined,
  CheckOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import './welcomePage.css';

const { Title, Text, Paragraph } = Typography;

const WelcomePage = () => {
  const { user, theme } = useStateContext();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState(null);
  const [urgentItems, setUrgentItems] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState(null);
  const [todaysSummary, setTodaysSummary] = useState(null);

  // Dynamic Theme Mapping
  const colors = useMemo(() => ({
    bg: theme === 'dark' ? '#141414' : '#f0f2f5',
    card: theme === 'dark' ? '#1f1f1f' : '#ffffff',
    border: theme === 'dark' ? '#303030' : '#f0f0f0',
    text: theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : '#262626',
    secondary: theme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : '#8c8c8c',
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
  }), [theme]);

  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    try {
      setLoading(true);
      const endpoints = [];
      const endpointMap = [];
      
      // Core endpoints (always fetched)
      endpoints.push(axios.get('/home/user-context').catch(() => ({ data: null })));
      endpointMap.push('userContext');
      
      endpoints.push(axios.get('/home/urgent-items').catch(() => ({ data: [] })));
      endpointMap.push('urgentItems');
      
      endpoints.push(axios.get('/home/quick-actions').catch(() => ({ data: [] })));
      endpointMap.push('quickActions');
      
      endpoints.push(axios.get('/notifications').catch(() => ({ data: [] })));
      endpointMap.push('notifications');
      
      // Permission-based endpoints
      if (hasPermission('dashboard.view')) {
        endpoints.push(axios.get('/home/stats').catch(() => ({ data: {} })));
        endpointMap.push('stats');
        
        endpoints.push(axios.get('/home/recent-activities').catch(() => ({ data: [] })));
        endpointMap.push('recentActivities');
        
        endpoints.push(axios.get('/home/todays-summary').catch(() => ({ data: null })));
        endpointMap.push('todaysSummary');
      }
      
      if (hasPermission('calendar.view')) {
        endpoints.push(axios.get('/home/upcoming-events').catch(() => ({ data: [] })));
        endpointMap.push('upcomingEvents');
      }
      
      if (hasPermission('reports.view') || hasPermission('team.view')) {
        endpoints.push(axios.get('/home/team-performance').catch(() => ({ data: null })));
        endpointMap.push('teamPerformance');
      }

      const results = await Promise.all(endpoints);
      
      // Map results to state
      results.forEach((result, idx) => {
        const key = endpointMap[idx];
        switch(key) {
          case 'userContext':
            setUserContext(result.data);
            break;
          case 'urgentItems':
            setUrgentItems(result.data || []);
            break;
          case 'quickActions':
            setQuickActions(result.data || []);
            break;
          case 'notifications':
            setNotifications(Array.isArray(result.data) ? result.data.slice(0, 8) : []);
            break;
          case 'stats':
            setStats(result.data || {});
            break;
          case 'recentActivities':
            setRecentActivities(result.data || []);
            break;
          case 'todaysSummary':
            setTodaysSummary(result.data);
            break;
          case 'upcomingEvents':
            setUpcomingEvents(result.data || []);
            break;
          case 'teamPerformance':
            setTeamPerformance(result.data);
            break;
        }
      });
      
    } catch (error) {
      console.error('Data Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Permission-based quick actions with fallback
  const defaultQuickActions = [
    { label: 'New Lead', icon: <UserAddOutlined />, path: '/leads/create', perm: 'leads.create', color: '#52c41a' },
    { label: 'New Task', icon: <FileAddOutlined />, path: '/tasks/create', perm: 'tasks.create', color: '#1890ff' },
    { label: 'New Project', icon: <ProjectOutlined />, path: '/projects/create', perm: 'projects.create', color: '#722ed1' },
    { label: 'New Invoice', icon: <DollarOutlined />, path: '/invoices/create', perm: 'invoices.create', color: '#fa8c16' },
    { label: 'Add Employee', icon: <TeamOutlined />, path: '/employees/create', perm: 'employees.create', color: '#13c2c2' },
    { label: 'New Ticket', icon: <FileTextOutlined />, path: '/tickets/create', perm: 'tickets.create', color: '#eb2f96' },
  ].filter(item => hasPermission(item.perm));

  // Module shortcuts with permission filtering
  const moduleShortcuts = [
    { label: 'HR', icon: <TeamOutlined />, path: '/users_setting', perm: 'employees.view', color: '#1890ff' },
    { label: 'Finance', icon: <DollarOutlined />, path: '/invoices', perm: 'invoices.view', color: '#52c41a' },
    { label: 'Sales', icon: <ShoppingOutlined />, path: '/leads', perm: 'leads.view', color: '#722ed1' },
    { label: 'Projects', icon: <ProjectOutlined />, path: '/projects', perm: 'projects.view', color: '#fa8c16' },
    { label: 'Reports', icon: <BarChartOutlined />, path: '/reports', perm: 'reports.view', color: '#13c2c2' },
    { label: 'Dashboard', icon: <DashboardOutlined />, path: '/dashboard', perm: 'dashboard.view', color: '#eb2f96' },
  ].filter(item => hasPermission(item.perm));

  // Build dynamic stats cards based on user permissions
  const getPermittedStats = () => {
    const statCards = [];
    
    if (hasPermission('projects.view') && stats.projects !== undefined) {
      statCards.push({
        title: 'Active Projects',
        value: stats.projects?.active || 0,
        prefix: <ProjectOutlined />,
        color: colors.success,
        trend: stats.projects?.trend,
        suffix: stats.projects?.total ? `/ ${stats.projects.total}` : null,
        description: 'In progress'
      });
    }
    
    if (hasPermission('tasks.view') && stats.tasks !== undefined) {
      statCards.push({
        title: 'Pending Tasks',
        value: stats.tasks?.pending || 0,
        prefix: <ClockCircleOutlined />,
        color: colors.warning,
        trend: stats.tasks?.trend,
        description: 'Require attention'
      });
    }
    
    if (hasPermission('leads.view') && stats.leads !== undefined) {
      statCards.push({
        title: 'New Leads',
        value: stats.leads?.new || 0,
        prefix: <ArrowUpOutlined />,
        color: colors.primary,
        trend: stats.leads?.trend,
        suffix: 'this week',
        description: 'Hot prospects'
      });
    }
    
    if (hasPermission('invoices.view') && stats.revenue !== undefined) {
      statCards.push({
        title: 'Revenue (MTD)',
        value: stats.revenue?.current || 0,
        prefix: '$',
        color: colors.success,
        trend: stats.revenue?.trend,
        precision: 0,
        description: 'Month to date'
      });
    }
    
    if (hasPermission('employees.view') && stats.employees !== undefined) {
      statCards.push({
        title: 'Team Members',
        value: stats.employees?.total || 0,
        prefix: <TeamOutlined />,
        color: '#722ed1',
        suffix: 'active',
        description: 'Company wide'
      });
    }
    
    if (hasPermission('tickets.view') && stats.tickets !== undefined) {
      statCards.push({
        title: 'Open Tickets',
        value: stats.tickets?.open || 0,
        prefix: <WarningOutlined />,
        color: colors.error,
        trend: stats.tickets?.trend,
        description: 'Support requests'
      });
    }
    
    return statCards;
  };

  const renderTrendIcon = (trend) => {
    if (!trend || trend === 0) return null;
    const isPositive = trend > 0;
    return (
      <Tooltip title={`${isPositive ? 'Increase' : 'Decrease'} from last period`}>
        <span style={{ 
          fontSize: 12, 
          color: isPositive ? colors.success : colors.error, 
          marginLeft: 8,
          fontWeight: 'bold'
        }}>
          {isPositive ? <RiseOutlined /> : <FallOutlined />}
          {Math.abs(trend)}%
        </span>
      </Tooltip>
    );
  };

  const getPriorityColor = (priority) => {
    const priorityMap = {
      critical: colors.error,
      high: colors.warning,
      medium: colors.primary,
      low: colors.success
    };
    return priorityMap[priority?.toLowerCase()] || colors.primary;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: colors.bg 
      }}>
        <Spin size="large" tip="Loading Dashboard..." />
      </div>
    );
  }

  const permittedStats = getPermittedStats();
  const displayQuickActions = quickActions.length > 0 ? quickActions : defaultQuickActions;

  return (
    <div style={{ 
      backgroundColor: colors.bg, 
      minHeight: '100vh', 
      padding: '24px' 
    }}>
      
      {/* HEADER SECTION */}
      <header style={{ 
        background: colors.card, 
        borderRadius: 12, 
        padding: '32px',
        marginBottom: 24,
        boxShadow: theme === 'dark' 
          ? '0 4px 16px rgba(0,0,0,0.5)' 
          : '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space size={24}>
              <Badge dot status="success" offset={[-8, 60]}>
                <Avatar 
                  size={80} 
                  src={userContext?.user?.avatar || user?.avatar} 
                  icon={<UserOutlined />} 
                  style={{ 
                    border: `4px solid ${colors.primary}`,
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                  }}
                />
              </Badge>
              <div>
                <Text style={{ fontSize: 16, color: colors.secondary, display: 'block', marginBottom: 4 }}>
                  {getGreeting()},
                </Text>
                <Title level={2} style={{ margin: '0 0 8px 0', color: colors.text }}>
                  {userContext?.user?.name || user?.name || 'Guest'}
                </Title>
                <Space split={<Divider type="vertical" />} wrap>
                  <Tag color="processing" style={{ fontSize: 13, padding: '4px 12px' }}>
                    {userContext?.role?.name || 'Member'}
                  </Tag>
                  {userContext?.department && (
                    <Tag color="default" style={{ fontSize: 13, padding: '4px 12px' }}>
                      {userContext.department}
                    </Tag>
                  )}
                  <Text type="secondary">
                    <CalendarOutlined /> {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </Text>
                </Space>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space size={12}>
              <Badge count={notifications.filter(n => !n.read).length} overflowCount={99}>
                <Button 
                  icon={<BellOutlined />} 
                  size="large" 
                  shape="circle" 
                  onClick={() => navigate('/notifications')}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
              </Badge>
              <Tooltip title="Refresh Dashboard">
                <Button 
                  icon={<SyncOutlined />} 
                  size="large" 
                  shape="circle" 
                  onClick={fetchHomePageData}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </header>

      {/* TODAY'S SUMMARY BANNER */}
      {hasPermission('dashboard.view') && todaysSummary && (
        <Card 
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, #096dd9 100%)`,
            marginBottom: 24,
            borderRadius: 12,
            border: 'none'
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={6}>
              <Space direction="vertical" size={4}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                  Today's Summary
                </Text>
                <Title level={3} style={{ color: '#fff', margin: 0 }}>
                  {todaysSummary.completedTasks || 0} / {todaysSummary.totalTasks || 0}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  Tasks Completed
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={18}>
              <Row gutter={[16, 16]}>
                {todaysSummary.metrics?.map((metric, idx) => (
                  <Col xs={12} sm={6} key={idx}>
                    <Space direction="vertical" size={2}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                        {metric.label}
                      </Text>
                      <Title level={4} style={{ color: '#fff', margin: 0 }}>
                        {metric.value}
                      </Title>
                    </Space>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Card>
      )}

      {/* STATS OVERVIEW - Permission Based */}
      {permittedStats.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {permittedStats.map((stat, idx) => (
            <Col xs={12} sm={8} lg={6} xl={4} key={idx}>
              <Card 
                bordered={false} 
                hoverable
                style={{ 
                  background: colors.card, 
                  borderRadius: 12,
                  boxShadow: theme === 'dark' 
                    ? '0 4px 12px rgba(0,0,0,0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Statistic 
                  title={
                    <Space direction="vertical" size={0}>
                      <Text style={{ fontSize: 13, color: colors.secondary }}>
                        {stat.title}
                      </Text>
                      {stat.description && (
                        <Text style={{ fontSize: 11, color: colors.secondary }}>
                          {stat.description}
                        </Text>
                      )}
                    </Space>
                  }
                  value={stat.value}
                  precision={stat.precision}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  valueStyle={{ 
                    color: stat.color, 
                    fontSize: 28,
                    fontWeight: 'bold'
                  }}
                />
                {renderTrendIcon(stat.trend)}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* QUICK ACTIONS */}
      {displayQuickActions.length > 0 && (
        <>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title level={4} style={{ color: colors.text, margin: 0 }}>
              <PlusOutlined style={{ marginRight: 8 }} />
              Quick Actions
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Create new items quickly
            </Text>
          </div>
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            {displayQuickActions.map((action, idx) => (
              <Col xs={12} sm={8} md={6} lg={4} key={idx}>
                <Card 
                  hoverable
                  onClick={() => navigate(action.path || action.url)}
                  style={{ 
                    background: colors.card, 
                    borderRadius: 12,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: `1px solid ${colors.border}`,
                    transition: 'all 0.3s ease',
                    height: '100%'
                  }}
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <div style={{ 
                    fontSize: 36, 
                    color: action.color || colors.primary,
                    marginBottom: 12,
                    transition: 'transform 0.3s ease'
                  }}>
                    {action.icon}
                  </div>
                  <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                    {action.label}
                  </Text>
                  {action.badge && (
                    <Badge 
                      count={action.badge} 
                      style={{ marginTop: 8 }}
                      showZero
                    />
                  )}
                  {action.description && (
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                      {action.description}
                    </Text>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* MAIN CONTENT GRID */}
      <Row gutter={[24, 24]}>
        {/* LEFT COLUMN - Main Content */}
        <Col xs={24} lg={16}>
          
          {/* PRIORITY TASKS */}
          {hasPermission('tasks.view') && (
            <Card 
              title={
                <Space>
                  <WarningOutlined style={{ color: colors.warning }} />
                  <span>Priority Tasks</span>
                  <Badge count={urgentItems.length} showZero style={{ backgroundColor: colors.error }} />
                </Space>
              }
              extra={
                <Button 
                  type="link" 
                  onClick={() => navigate('/tasks')}
                  icon={<ArrowUpOutlined />}
                >
                  View All Tasks
                </Button>
              }
              style={{ 
                background: colors.card, 
                marginBottom: 24, 
                borderRadius: 12,
                boxShadow: theme === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              {urgentItems.length === 0 ? (
                <Empty 
                  description={
                    <Space direction="vertical" size={4}>
                      <CheckCircleOutlined style={{ fontSize: 48, color: colors.success }} />
                      <Text strong>All caught up!</Text>
                      <Text type="secondary">No urgent tasks at the moment</Text>
                    </Space>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={urgentItems.slice(0, 6)}
                  renderItem={item => (
                    <List.Item 
                      style={{ 
                        cursor: 'pointer', 
                        padding: '16px 0',
                        borderBottom: `1px solid ${colors.border}`,
                        transition: 'background 0.2s ease'
                      }}
                      onClick={() => item.action_url && navigate(item.action_url)}
                      actions={[
                        <Tag 
                          color={
                            item.priority === 'critical' ? 'error' : 
                            item.priority === 'high' ? 'warning' : 
                            item.priority === 'medium' ? 'processing' : 'success'
                          }
                          style={{ fontWeight: 'bold', padding: '4px 12px' }}
                        >
                          {(item.priority || 'medium').toUpperCase()}
                        </Tag>,
                        item.module && <Tag>{item.module}</Tag>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            size={48}
                            icon={<ClockCircleOutlined />} 
                            style={{ 
                              backgroundColor: getPriorityColor(item.priority),
                              boxShadow: `0 2px 8px ${getPriorityColor(item.priority)}40`
                            }} 
                          />
                        }
                        title={
                          <Space>
                            <Text strong style={{ fontSize: 15 }}>{item.title}</Text>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Text type="secondary">{item.description}</Text>
                            <Space split={<Divider type="vertical" />} style={{ fontSize: 12 }}>
                              {item.due_date && (
                                <Text type="secondary">
                                  <CalendarOutlined /> Due: {item.due_date}
                                </Text>
                              )}
                              {item.assigned_to && (
                                <Text type="secondary">
                                  <UserOutlined /> {item.assigned_to}
                                </Text>
                              )}
                            </Space>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          )}

          {/* RECENT ACTIVITIES */}
          {hasPermission('dashboard.view') && recentActivities.length > 0 && (
            <Card 
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Recent Activities</span>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/activities')}>
                  View History
                </Button>
              }
              style={{ 
                background: colors.card, 
                marginBottom: 24, 
                borderRadius: 12,
                boxShadow: theme === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <Timeline
                items={recentActivities.slice(0, 8).map(activity => ({
                  color: 
                    activity.type === 'success' ? colors.success : 
                    activity.type === 'error' ? colors.error : 
                    activity.type === 'warning' ? colors.warning : colors.primary,
                  dot: activity.icon || null,
                  children: (
                    <div style={{ paddingBottom: 8 }}>
                      <Text strong style={{ fontSize: 14 }}>{activity.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {activity.description}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {activity.time || 'Just now'}
                      </Text>
                    </div>
                  )
                }))}
              />
            </Card>
          )}

          {/* TEAM PERFORMANCE */}
          {(hasPermission('reports.view') || hasPermission('team.view')) && teamPerformance && (
            <Card 
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <span>Team Performance Overview</span>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/reports/team')}>
                  Detailed Report
                </Button>
              }
              style={{ 
                background: colors.card, 
                borderRadius: 12,
                boxShadow: theme === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text type="secondary">Project Completion Rate</Text>
                    <Progress 
                      percent={teamPerformance.projectCompletion || 0} 
                      status="active"
                      strokeColor={{
                        '0%': colors.success,
                        '100%': '#95de64',
                      }}
                      strokeWidth={12}
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text type="secondary">Task Completion Rate</Text>
                    <Progress 
                      percent={teamPerformance.taskCompletion || 0} 
                      status="active"
                      strokeColor={{
                        '0%': colors.primary,
                        '100%': '#69c0ff',
                      }}
                      strokeWidth={12}
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text type="secondary">Client Satisfaction</Text>
                    <Progress 
                      percent={teamPerformance.clientSatisfaction || 0} 
                      status="active"
                      strokeColor={{
                        '0%': '#722ed1',
                        '100%': '#b37feb',
                      }}
                      strokeWidth={12}
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text type="secondary">Revenue Achievement</Text>
                    <Progress 
                      percent={teamPerformance.revenueTarget || 0} 
                      status="active"
                      strokeColor={{
                        '0%': colors.warning,
                        '100%': '#ffd666',
                      }}
                      strokeWidth={12}
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          )}
        </Col>

        {/* RIGHT COLUMN - Sidebar */}
        <Col xs={24} lg={8}>
          
          {/* NOTIFICATIONS */}
          <Card 
            title={
              <Space>
                <BellOutlined />
                <span>Recent Notifications</span>
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/notifications')}>
                View All
              </Button>
            }
            style={{ 
              background: colors.card, 
              marginBottom: 24, 
              borderRadius: 12,
              boxShadow: theme === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <List
              size="small"
              dataSource={notifications.slice(0, 6)}
              locale={{ emptyText: 'No notifications' }}
              renderItem={n => (
                <List.Item 
                  style={{ 
                    padding: '12px 0', 
                    cursor: 'pointer',
                    borderBottom: `1px solid ${colors.border}`
                  }}
                  onClick={() => n.url && navigate(n.url)}
                >
                  <Space align="start" style={{ width: '100%' }}>
                    <Badge 
                      status={
                        n.read ? 'default' : 
                        n.type === 'error' ? 'error' : 
                        n.type === 'warning' ? 'warning' : 'processing'
                      } 
                      style={{ marginTop: 4 }} 
                    />
                    <div style={{ flex: 1 }}>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: 13,
                          fontWeight: n.read ? 'normal' : 'bold'
                        }}
                      >
                        {n.title}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {n.description}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {n.time || 'Just now'}
                      </Text>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          {/* UPCOMING EVENTS */}
          {hasPermission('calendar.view') && upcomingEvents.length > 0 && (
            <Card 
              title={
                <Space>
                  <CalendarOutlined />
                  <span>Upcoming Events</span>
                </Space>
              }
              extra={
                <Button type="link" size="small" onClick={() => navigate('/calendar')}>
                  Calendar
                </Button>
              }
              style={{ 
                background: colors.card, 
                marginBottom: 24, 
                borderRadius: 12,
                boxShadow: theme === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <List
                size="small"
                dataSource={upcomingEvents.slice(0, 5)}
                renderItem={event => (
                  <List.Item 
                    style={{ 
                      padding: '12px 0',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${colors.border}`
                    }}
                    onClick={() => event.url && navigate(event.url)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<CalendarOutlined />} 
                          style={{ 
                            backgroundColor: event.color || colors.primary 
                          }} 
                        />
                      }
                      title={<Text strong style={{ fontSize: 13 }}>{event.title}</Text>}
                      description={
                        <Space direction="vertical" size={2}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {event.date} at {event.time}
                          </Text>
                          {event.location && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              📍 {event.location}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* MODULE SHORTCUTS */}
          {moduleShortcuts.length > 0 && (
            <Card 
              title="Quick Access Modules"
              style={{ 
                background: colors.card, 
                borderRadius: 12,
                boxShadow: theme === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <Row gutter={[12, 12]}>
                {moduleShortcuts.map((m, i) => (
                  <Col span={12} key={i}>
                    <Tooltip title={m.label}>
                      <Button 
                        block 
                        size="large"
                        onClick={() => navigate(m.path)}
                        style={{ 
                          height: 80,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          borderColor: colors.border,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ fontSize: 28, color: m.color }}>
                          {m.icon}
                        </div>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
                          {m.label}
                        </Text>
                      </Button>
                    </Tooltip>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default WelcomePage;