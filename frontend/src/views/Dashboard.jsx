import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Typography, Card, Space, Progress, Badge, Avatar, Divider, Spin } from 'antd';
import { 
  LineChartOutlined, 
  TeamOutlined, 
  DashboardOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import MainContent from '../pages/MainContent';
import SideContent from '../pages/SideContent';
import axios from '../axios';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [performers, setPerformers] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, activitiesRes, performersRes] = await Promise.all([
          axios.get('/dashboard/statistics'),
          axios.get('/dashboard/activities'),
          axios.get('/dashboard/performers')
        ]);

        setStatistics(statsRes.data);
        setActivities(activitiesRes.data || []);
        setPerformers(performersRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !statistics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const employeesData = statistics.employees || { count: 0, change: 0 };
  const projectsData = statistics.projects || { count: 0, change: 0 };
  const tasksData = statistics.tasks || { count: 0, change: 0 };
  const revenueData = statistics.revenue || { amount: 0, change: 0 };

  return (
    <div className="dashboard-container" style={{ padding: '0' }}>
      {/* Dashboard Header */}
      <div className="dashboard-header" style={{ marginBottom: '32px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} className="dashboard-title" style={{ marginBottom: '8px', fontSize: '28px', fontWeight: 700 }}>
              <DashboardOutlined className="dashboard-icon" style={{ marginRight: '12px', color: '#1890ff' }} />
              Dashboard Overview
            </Title>
            <Text type="secondary" className="dashboard-subtitle" style={{ fontSize: '14px' }}>
              Last updated: {new Date().toLocaleString()}
            </Text>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <Row gutter={[24, 24]} className="metrics-row" style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="metric-card employee-card" style={{ height: '100%' }}>
            <div className="metric-content" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="metric-icon-wrapper" style={{ 
                backgroundColor: '#e6f7ff',
                padding: '16px',
                borderRadius: '8px',
                marginRight: '16px'
              }}>
                <TeamOutlined className="metric-icon" style={{ color: '#1890ff', fontSize: '24px' }} />
              </div>
              <div className="metric-text">
                <Text className="metric-label" style={{ color: '#8c8c8c', fontSize: '14px' }}>Total Employees</Text>
                <Title level={3} className="metric-value" style={{ margin: '4px 0' }}>{employeesData.count}</Title>
                <div className="metric-trend" style={{ 
                  color: employeesData.change >= 0 ? '#52c41a' : '#f5222d',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {employeesData.change >= 0 ? 
                    <ArrowUpOutlined className="trend-icon" /> : 
                    <ArrowDownOutlined className="trend-icon" />}
                  <Text className="trend-text" style={{ marginLeft: '4px', fontSize: '12px' }}>
                    {Math.abs(employeesData.change)}% from last month
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="metric-card project-card" style={{ height: '100%' }}>
            <div className="metric-content" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="metric-icon-wrapper" style={{ 
                backgroundColor: '#f6ffed',
                padding: '16px',
                borderRadius: '8px',
                marginRight: '16px'
              }}>
                <CheckCircleOutlined className="metric-icon" style={{ color: '#52c41a', fontSize: '24px' }} />
              </div>
              <div className="metric-text">
                <Text className="metric-label" style={{ color: '#8c8c8c', fontSize: '14px' }}>Projects Completed</Text>
                <Title level={3} className="metric-value" style={{ margin: '4px 0' }}>{projectsData.count}</Title>
                <div className="metric-trend" style={{ 
                  color: projectsData.change >= 0 ? '#52c41a' : '#f5222d',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {projectsData.change >= 0 ? 
                    <ArrowUpOutlined className="trend-icon" /> : 
                    <ArrowDownOutlined className="trend-icon" />}
                  <Text className="trend-text" style={{ marginLeft: '4px', fontSize: '12px' }}>
                    {Math.abs(projectsData.change)}% from last month
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="metric-card task-card" style={{ height: '100%' }}>
            <div className="metric-content" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="metric-icon-wrapper" style={{ 
                backgroundColor: '#fff7e6',
                padding: '16px',
                borderRadius: '8px',
                marginRight: '16px'
              }}>
                <ClockCircleOutlined className="metric-icon" style={{ color: '#faad14', fontSize: '24px' }} />
              </div>
              <div className="metric-text">
                <Text className="metric-label" style={{ color: '#8c8c8c', fontSize: '14px' }}>Pending Tasks</Text>
                <Title level={3} className="metric-value" style={{ margin: '4px 0' }}>{tasksData.count}</Title>
                <div className="metric-trend" style={{ 
                  color: tasksData.change >= 0 ? '#52c41a' : '#f5222d',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {tasksData.change >= 0 ? 
                    <ArrowUpOutlined className="trend-icon" /> : 
                    <ArrowDownOutlined className="trend-icon" />}
                  <Text className="trend-text" style={{ marginLeft: '4px', fontSize: '12px' }}>
                    {Math.abs(tasksData.change)}% from last month
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="metric-card revenue-card" style={{ height: '100%' }}>
            <div className="metric-content" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="metric-icon-wrapper" style={{ 
                backgroundColor: '#f6f0ff',
                padding: '16px',
                borderRadius: '8px',
                marginRight: '16px'
              }}>
                <DollarOutlined className="metric-icon" style={{ color: '#722ed1', fontSize: '24px' }} />
              </div>
              <div className="metric-text">
                <Text className="metric-label" style={{ color: '#8c8c8c', fontSize: '14px' }}>Revenue</Text>
                <Title level={3} className="metric-value" style={{ margin: '4px 0' }}>
                  ${revenueData.amount.toLocaleString()}
                </Title>
                <div className="metric-trend" style={{ 
                  color: revenueData.change >= 0 ? '#52c41a' : '#f5222d',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {revenueData.change >= 0 ? 
                    <ArrowUpOutlined className="trend-icon" /> : 
                    <ArrowDownOutlined className="trend-icon" />}
                  <Text className="trend-text" style={{ marginLeft: '4px', fontSize: '12px' }}>
                    {Math.abs(revenueData.change)}% from last month
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Area */}
      <Row gutter={[24, 24]} className="content-row">
        <Col xs={24} lg={16}>
          <Card 
            className="main-content-card"
            title={<span className="content-card-title" style={{ fontWeight: '500' }}>Performance Overview</span>}
            extra={<Text type="secondary" className="content-card-extra">Last 30 days</Text>}
            style={{ marginBottom: '16px' }}
          >
            <MainContent />
            
            <Divider className="content-divider" style={{ margin: '24px 0' }} />
            
            <Title level={5} className="top-performers-title" style={{ marginBottom: '16px' }}>Top Performers</Title>
            {performers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>
                No performance data available
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {performers.map(performer => (
                  <Col xs={24} sm={8} key={performer.id}>
                    <Card className="performer-card" style={{ height: '100%' }}>
                      <div className="performer-info" style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <Avatar 
                          size="large" 
                          src={performer.avatar}
                          icon={<UserOutlined />} 
                          className="performer-avatar" 
                          style={{ backgroundColor: '#1890ff', marginRight: '12px' }} 
                        />
                        <div className="performer-details">
                          <Text strong className="performer-name" style={{ display: 'block' }}>{performer.name}</Text>
                          <Text type="secondary" className="performer-department" style={{ fontSize: '12px' }}>
                            {typeof performer.department === 'string' 
                              ? performer.department 
                              : (performer.department?.name || 'N/A')}
                          </Text>
                        </div>
                      </div>
                      <Progress 
                        percent={performer.progress} 
                        status="active" 
                        className="performer-progress"
                        strokeColor={{
                          '0%': '#277dfe',
                          '100%': '#52c41a',
                        }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            className="side-content-card"
            title={<span className="content-card-title" style={{ fontWeight: '500' }}>Recent Activities</span>}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, overflow: 'auto', padding: 0 } }}
          >
            <SideContent />
            
            <div className="recent-activities" style={{ padding: '16px' }}>
              {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>
                  No recent activities
                </div>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="activity-item" style={{ 
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div className="activity-header" style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <Badge status={activity.status} className="activity-badge" style={{ marginRight: '8px' }} />
                      <Text strong className="activity-user" style={{ marginRight: '8px' }}>{activity.user}</Text>
                      <Text type="secondary" className="activity-action">{activity.action}</Text>
                    </div>
                    <Text type="secondary" className="activity-time" style={{ fontSize: '12px' }}>
                      {activity.time}
                    </Text>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}