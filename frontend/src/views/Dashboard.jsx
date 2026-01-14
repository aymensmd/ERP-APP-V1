import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Typography, Card, Space, Progress, Badge, Avatar, Divider, Spin, Statistic, Tag, Button, Empty, DatePicker, Select, List, Alert } from 'antd';
import { 
  LineChartOutlined, 
  TeamOutlined, 
  DashboardOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ProjectOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  WarningOutlined,
  TrophyOutlined,
  CalendarOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import MainContent from '../pages/MainContent';
import SideContent from '../pages/SideContent';
import axios from '../axios';
import { useStateContext } from '../contexts/ContextProvider';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

const { RangePicker } = DatePicker;

export default function Dashboard() {
  const { theme } = useStateContext();
  const { hasPermission, hasAnyPermission, isManager } = usePermissions();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Filters
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Theme styles
  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      primary: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
      info: '#1890ff',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      border: '#303030',
      primary: '#177ddc',
      success: '#49aa19',
      warning: '#d89614',
      error: '#dc4446',
      info: '#177ddc',
    }
  };

  const colors = themeStyles[theme];

  useEffect(() => {
    fetchDashboardData();
    fetchDepartments();
    fetchProjects();
  }, [dateRange, selectedDepartment, selectedProject]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.date_from = dateRange[0].format('YYYY-MM-DD');
        params.date_to = dateRange[1].format('YYYY-MM-DD');
      }
      if (selectedDepartment) params.department_id = selectedDepartment;
      if (selectedProject) params.project_id = selectedProject;

      const [statsRes, activitiesRes, performersRes, urgentRes] = await Promise.all([
        axios.get('/dashboard/statistics', { params }),
        axios.get('/dashboard/activities', { params }),
        axios.get('/dashboard/performers', { params }),
        axios.get('/home/urgent-items').catch(() => ({ data: [] }))
      ]);

      setStatistics(statsRes.data);
      setActivities(activitiesRes.data || []);
      setPerformers(performersRes.data || []);
      
      // Extract approvals and exceptions from urgent items
      const urgentItems = urgentRes.data || [];
      setApprovals(urgentItems.filter(item => item.type === 'approval'));
      setExceptions(urgentItems.filter(item => item.type === 'overdue' || item.priority === 'critical'));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/departments');
      setDepartments(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/projects');
      setProjects(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getChangeColor = (change) => {
    if (change > 0) return colors.success;
    if (change < 0) return colors.error;
    return colors.textSecondary;
  };

  const renderMetricCard = (title, value, icon, change, changeLabel, color, onClick) => (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{ 
        height: '100%',
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        transition: 'all 0.3s',
        cursor: onClick ? 'pointer' : 'default'
      }}
      styles={{
        body: { padding: '20px' }
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ 
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: `${color}15`,
            color: color
          }}>
            {icon}
          </div>
          {change !== undefined && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              color: getChangeColor(change),
              fontSize: '12px',
              fontWeight: 500
            }}>
              {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <Text style={{ marginLeft: '4px', color: getChangeColor(change) }}>
                {Math.abs(change)}%
              </Text>
            </div>
          )}
        </div>
        <Statistic
          title={<Text style={{ color: colors.textSecondary, fontSize: '13px' }}>{title}</Text>}
          value={value}
          valueStyle={{ 
            color: colors.textPrimary, 
            fontSize: '24px', 
            fontWeight: 600,
            marginTop: '8px'
          }}
        />
        {changeLabel && (
          <Text type="secondary" style={{ fontSize: '12px' }}>{changeLabel}</Text>
        )}
      </Space>
    </Card>
  );

  if (loading || !statistics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const hrm = statistics?.hrm || {};
  const projectsData = statistics?.projects || {};
  const tasks = statistics?.tasks || {};
  const crm = statistics?.crm || {};
  const finance = statistics?.finance || {};

  // Determine user role type based on permissions
  const isHRManager = hasAnyPermission(['employees.view', 'vacations.approve']) || (isManager() && hasPermission('employees.view'));
  const isFinanceManager = hasAnyPermission(['invoices.view', 'invoices.create']) || (isManager() && hasPermission('invoices.view'));
  const isSalesManager = hasAnyPermission(['leads.view', 'customers.view']) || (isManager() && hasAnyPermission(['leads.view', 'customers.view']));

  // Get role-based KPIs (3-6 max)
  const getRoleBasedKPIs = () => {
    const kpis = [];

    // HR Manager KPIs
    if (isHRManager && hasPermission('employees.view')) {
      kpis.push({
        key: 'total_employees',
        title: 'Total Employees',
        value: hrm.employees?.total || 0,
        change: hrm.employees?.change,
        icon: <TeamOutlined style={{ fontSize: '24px' }} />,
        color: colors.primary,
        onClick: () => navigate('/users_setting'),
        permission: 'employees.view'
      });
      kpis.push({
        key: 'pending_leaves',
        title: 'Pending Leaves',
        value: hrm.vacations?.pending || 0,
        change: null,
        icon: <CalendarOutlined style={{ fontSize: '24px' }} />,
        color: colors.warning,
        onClick: () => navigate('/leaves'),
        permission: 'vacations.view'
      });
      kpis.push({
        key: 'active_leaves',
        title: 'On Leave',
        value: hrm.vacations?.active || 0,
        change: null,
        icon: <UserOutlined style={{ fontSize: '24px' }} />,
        color: colors.info,
        onClick: () => navigate('/leaves'),
        permission: 'vacations.view'
      });
    }

    // Finance Manager KPIs
    if (isFinanceManager && hasPermission('invoices.view')) {
      kpis.push({
        key: 'monthly_revenue',
        title: 'Monthly Revenue',
        value: formatCurrency(finance.revenue?.this_month || 0),
        change: finance.revenue?.change,
        icon: <DollarOutlined style={{ fontSize: '24px' }} />,
        color: colors.success,
        onClick: () => navigate('/invoices'),
        permission: 'invoices.view'
      });
      kpis.push({
        key: 'pending_invoices',
        title: 'Pending Invoices',
        value: finance.invoices?.pending || 0,
        change: null,
        icon: <FileTextOutlined style={{ fontSize: '24px' }} />,
        color: colors.warning,
        onClick: () => navigate('/invoices'),
        permission: 'invoices.view'
      });
      kpis.push({
        key: 'overdue_invoices',
        title: 'Overdue Invoices',
        value: finance.invoices?.overdue || 0,
        change: null,
        icon: <WarningOutlined style={{ fontSize: '24px' }} />,
        color: colors.error,
        onClick: () => navigate('/invoices?status=overdue'),
        permission: 'invoices.view'
      });
    }

    // Sales Manager KPIs
    if (isSalesManager && hasPermission('leads.view')) {
      kpis.push({
        key: 'total_leads',
        title: 'Total Leads',
        value: crm.leads?.total || 0,
        change: null,
        icon: <ShoppingOutlined style={{ fontSize: '24px' }} />,
        color: colors.info,
        onClick: () => navigate('/leads'),
        permission: 'leads.view'
      });
      kpis.push({
        key: 'total_customers',
        title: 'Total Customers',
        value: crm.customers?.total || 0,
        change: null,
        icon: <UserOutlined style={{ fontSize: '24px' }} />,
        color: colors.success,
        onClick: () => navigate('/customers'),
        permission: 'customers.view'
      });
    }

    // Project Manager KPIs (if has project permissions)
    if (hasPermission('projects.view')) {
      kpis.push({
        key: 'active_projects',
        title: 'Active Projects',
        value: projectsData.active || 0,
        change: projectsData.change,
        icon: <ProjectOutlined style={{ fontSize: '24px' }} />,
        color: colors.success,
        onClick: () => navigate('/projects'),
        permission: 'projects.view'
      });
    }

    // Task KPIs (if has kanban permissions)
    if (hasPermission('kanban.view')) {
      kpis.push({
        key: 'pending_tasks',
        title: 'Pending Tasks',
        value: tasks.pending || 0,
        change: tasks.change,
        icon: <ClockCircleOutlined style={{ fontSize: '24px' }} />,
        color: tasks.overdue > 0 ? colors.error : colors.warning,
        onClick: () => navigate('/kanban'),
        permission: 'kanban.view'
      });
    }

    // Filter KPIs by permission and limit to 6
    return kpis.filter(kpi => hasPermission(kpi.permission)).slice(0, 6);
  };

  return (
    <div className="dashboard-container" style={{ padding: '0' }}>
      {/* Dashboard Header with Filters */}
      <Card
        style={{ 
          marginBottom: '24px',
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px'
        }}
      >
        <Row align="middle" gutter={[16, 16]} justify="space-between">
          <Col flex="auto">
            <Title level={2} style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: colors.textPrimary }}>
              <DashboardOutlined style={{ marginRight: '12px', color: colors.primary }} />
              ERP Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: '13px', color: colors.textSecondary, display: 'block', marginTop: '4px' }}>
              Operational intelligence and decision support
            </Text>
          </Col>
          <Col>
            <Space wrap>
              {hasPermission('departments.view') && (
                <Select
                  placeholder="Department"
                  style={{ width: 150 }}
                  allowClear
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  options={departments.map(dept => ({ label: dept.name, value: dept.id }))}
                />
              )}
              {hasPermission('projects.view') && (
                <Select
                  placeholder="Project"
                  style={{ width: 150 }}
                  allowClear
                  value={selectedProject}
                  onChange={setSelectedProject}
                  options={projects.slice(0, 20).map(proj => ({ label: proj.title, value: proj.id }))}
                />
              )}
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [dayjs().subtract(30, 'days'), dayjs()])}
                format="YYYY-MM-DD"
              />
              {hasPermission('analytics.view') && (
                <Button 
                  type="primary" 
                  icon={<LineChartOutlined />}
                  onClick={() => navigate('/analytics')}
                >
                  Analytics
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* A. Role-Based KPI Cards (3-6 max) */}
      {getRoleBasedKPIs().length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {getRoleBasedKPIs().map((kpi) => (
            <Col xs={24} sm={12} md={8} lg={6} key={kpi.key}>
              {hasPermission(kpi.permission) && renderMetricCard(
                kpi.title,
                kpi.value,
                kpi.icon,
                kpi.change,
                kpi.change !== undefined ? 'vs last period' : null,
                kpi.color,
                kpi.onClick
              )}
            </Col>
          ))}
        </Row>
      )}

      {/* D. Approvals & Exceptions Section */}
      {(approvals.length > 0 || exceptions.length > 0) && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {approvals.length > 0 && (
            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <CheckCircleFilled style={{ color: colors.warning }} />
                    <Text strong style={{ color: colors.textPrimary }}>Pending Approvals</Text>
                  </Space>
                }
                extra={
                  <Badge count={approvals.length} />
                }
                style={{ 
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px'
                }}
              >
                <List
                  size="small"
                  dataSource={approvals.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item
                      style={{ cursor: 'pointer', padding: '12px' }}
                      onClick={() => navigate(item.action_url)}
                    >
                      <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: colors.warning }}><CheckCircleOutlined /></Avatar>}
                        title={<Text strong style={{ fontSize: '13px' }}>{item.title}</Text>}
                        description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.description}</Text>}
                      />
                      <Badge count={item.count} />
                    </List.Item>
                  )}
                />
                {approvals.length > 5 && (
                  <Button type="link" block onClick={() => navigate('/leaves')} style={{ marginTop: '8px' }}>
                    View All ({approvals.length})
                  </Button>
                )}
              </Card>
            </Col>
          )}
          {exceptions.length > 0 && (
            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: colors.error }} />
                    <Text strong style={{ color: colors.textPrimary }}>Exceptions & Alerts</Text>
                  </Space>
                }
                extra={
                  <Badge count={exceptions.length} style={{ backgroundColor: colors.error }} />
                }
                style={{ 
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px'
                }}
              >
                <List
                  size="small"
                  dataSource={exceptions.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item
                      style={{ cursor: 'pointer', padding: '12px' }}
                      onClick={() => navigate(item.action_url)}
                    >
                      <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: colors.error }}><WarningOutlined /></Avatar>}
                        title={<Text strong style={{ fontSize: '13px', color: colors.error }}>{item.title}</Text>}
                        description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.description}</Text>}
                      />
                      <Badge count={item.count} style={{ backgroundColor: colors.error }} />
                    </List.Item>
                  )}
                />
                {exceptions.length > 5 && (
                  <Alert
                    message={`${exceptions.length} exceptions require attention`}
                    type="error"
                    showIcon
                    style={{ marginTop: '8px' }}
                  />
                )}
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* C. Workload & Status Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {hasPermission('kanban.view') && (
          <Col xs={24} md={12}>
            <Card
              title={<Text strong style={{ color: colors.textPrimary }}>Tasks Status</Text>}
              style={{ 
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px'
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Pending Tasks</Text>
                    <Text strong>{tasks.pending || 0}</Text>
                  </div>
                  <Progress 
                    percent={tasks.total > 0 ? Math.round((tasks.pending / tasks.total) * 100) : 0} 
                    strokeColor={colors.warning}
                    showInfo={false}
                  />
                </div>
                {tasks.overdue > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text type="danger">Overdue Tasks</Text>
                      <Text strong type="danger">{tasks.overdue}</Text>
                    </div>
                    <Progress 
                      percent={tasks.total > 0 ? Math.round((tasks.overdue / tasks.total) * 100) : 0} 
                      strokeColor={colors.error}
                      showInfo={false}
                    />
                  </div>
                )}
                <Button type="link" block onClick={() => navigate('/kanban')}>
                  View All Tasks →
                </Button>
              </Space>
            </Card>
          </Col>
        )}
        {hasPermission('vacations.view') && (
          <Col xs={24} md={12}>
            <Card
              title={<Text strong style={{ color: colors.textPrimary }}>Leave Requests Status</Text>}
              style={{ 
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px'
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Pending Approvals</Text>
                    <Text strong>{hrm.vacations?.pending || 0}</Text>
                  </div>
                  <Progress 
                    percent={hrm.vacations?.pending > 0 ? 100 : 0} 
                    strokeColor={colors.warning}
                    showInfo={false}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Currently on Leave</Text>
                    <Text strong>{hrm.vacations?.active || 0}</Text>
                  </div>
                  <Progress 
                    percent={hrm.vacations?.active > 0 ? 100 : 0} 
                    strokeColor={colors.info}
                    showInfo={false}
                  />
                </div>
                <Button type="link" block onClick={() => navigate('/leaves')}>
                  Manage Leaves →
                </Button>
              </Space>
            </Card>
          </Col>
        )}
        {hasPermission('invoices.view') && (
          <Col xs={24} md={12}>
            <Card
              title={<Text strong style={{ color: colors.textPrimary }}>Invoice Status</Text>}
              style={{ 
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px'
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Pending Invoices</Text>
                    <Text strong>{finance.invoices?.pending || 0}</Text>
                  </div>
                  <Progress 
                    percent={finance.invoices?.pending > 0 ? 100 : 0} 
                    strokeColor={colors.warning}
                    showInfo={false}
                  />
                </div>
                {finance.invoices?.overdue > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text type="danger">Overdue Invoices</Text>
                      <Text strong type="danger">{finance.invoices.overdue}</Text>
                    </div>
                    <Progress 
                      percent={100} 
                      strokeColor={colors.error}
                      showInfo={false}
                    />
                  </div>
                )}
                <Button type="link" block onClick={() => navigate('/invoices')}>
                  View All Invoices →
                </Button>
              </Space>
            </Card>
          </Col>
        )}
      </Row>

      {/* B. Trends & Charts - Actionable */}
      {hasPermission('analytics.view') && (
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24}>
            <Card 
              className="main-content-card"
              title={
                <Space>
                  <LineChartOutlined style={{ color: colors.primary }} />
                  <Text strong style={{ color: colors.textPrimary }}>Performance Overview</Text>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/analytics')} style={{ color: colors.primary }}>
                  View Full Analytics
                </Button>
              }
              style={{ 
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px'
              }}
            >
              <MainContent />
            </Card>
          </Col>
        </Row>
      )}

      {/* Top Performers & Activities */}
      <Row gutter={[24, 24]} className="content-row">
        <Col xs={24} lg={16}>
          {hasPermission('analytics.view') && (
            <Card 
              className="main-content-card"
              title={
                <Space>
                  <TrophyOutlined style={{ color: colors.warning }} />
                  <Text strong style={{ color: colors.textPrimary }}>Top Performers</Text>
                </Space>
              }
              style={{ 
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px'
              }}
            >
              {performers.length === 0 ? (
                <Empty description="No performance data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Row gutter={[16, 16]}>
                  {performers.slice(0, 6).map(performer => (
                    <Col xs={24} sm={12} md={8} key={performer.id}>
                      <Card 
                        hoverable
                        style={{ 
                          height: '100%',
                          background: colors.cardBg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px'
                        }}
                        styles={{
                          body: { padding: '16px' }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <Avatar 
                            size={48} 
                            src={performer.avatar}
                            icon={<UserOutlined />} 
                            style={{ 
                              backgroundColor: colors.primary, 
                              marginRight: '12px',
                              border: `2px solid ${colors.border}`
                            }} 
                          />
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ display: 'block', color: colors.textPrimary }}>
                              {performer.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {performer.department?.name || 'N/A'}
                            </Text>
                          </div>
                        </div>
                        <Progress 
                          percent={performer.progress} 
                          status="active" 
                          strokeColor={{
                            '0%': colors.primary,
                            '100%': colors.success,
                          }}
                          format={percent => `${percent}%`}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          )}
        </Col>

        {/* Recent Activities - Permission Gated */}
        {hasPermission('audit-logs.view') && (
          <Col xs={24} lg={8}>
            <Card 
              className="side-content-card"
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: colors.primary }} />
                  <Text strong style={{ color: colors.textPrimary }}>Recent Activities</Text>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/activity-logs')} style={{ color: colors.primary }}>
                  View All
                </Button>
              }
              style={{ 
                height: '100%',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column'
              }}
              styles={{ 
                body: { 
                  flex: 1, 
                  overflow: 'auto', 
                  padding: '16px',
                  maxHeight: '800px'
                } 
              }}
            >
              {activities.length === 0 ? (
                <Empty description="No recent activities" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {activities.slice(0, 15).map((activity, index) => (
                    <div 
                      key={activity.id || index}
                      style={{ 
                        padding: '12px',
                        background: theme === 'dark' ? '#141414' : '#fafafa',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Badge 
                          status={
                            activity.status === 'success' || activity.status === 'approved' ? 'success' :
                            activity.status === 'error' || activity.status === 'rejected' ? 'error' :
                            activity.status === 'processing' ? 'processing' : 'default'
                          } 
                          style={{ marginTop: '4px' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <Text strong style={{ color: colors.textPrimary, fontSize: '13px' }}>
                              {activity.user}
                            </Text>
                            {activity.module && (
                              <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>
                                {activity.module}
                              </Tag>
                            )}
                          </div>
                          <Text style={{ 
                            color: colors.textSecondary, 
                            fontSize: '12px',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            {activity.action}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {activity.time}
                          </Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}
