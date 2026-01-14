import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Space, ConfigProvider, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TeamOutlined, ProjectOutlined, PieChartOutlined } from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import axios from '../axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart as RCPieChart, Pie, Cell } from 'recharts';

const { Title, Paragraph, Text } = Typography;

const Analytics = () => {
  const { theme } = useStateContext();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/analytics');
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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

  if (loading || !analytics) {
    return (
      <div style={{ 
        padding: '32px', 
        minHeight: 'calc(100vh - 64px)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  const employees = analytics.employees || {};
  const projects = analytics.projects || {};
  const vacations = analytics.vacations || {};
  const performance = analytics.performance || {};

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
            <PieChartOutlined style={{ color: colors.primary }} />
            Analytics
          </Title>
          <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: '16px' }}>
            Visualize and analyze your HR and business data here.
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Total Employees</span>}
                value={employees.total || 0}
                prefix={<TeamOutlined style={{ color: colors.primary }} />}
                valueStyle={{ color: employees.trend === 'up' ? '#3f8600' : '#cf1322' }}
                suffix={employees.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {employees.change_percentage >= 0 ? '+' : ''}{employees.change_percentage || 0}% from last period
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Total Projects</span>}
                value={projects.total || 0}
                prefix={<ProjectOutlined style={{ color: colors.primary }} />}
                valueStyle={{ color: colors.primary }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: colors.textSecondary }}>
                <Text>{projects.completed || 0} completed</Text>
                {' | '}
                <Text>{projects.in_progress || 0} in progress</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Project Completion Rate</span>}
                value={projects.completion_rate || 0}
                valueStyle={{ color: colors.primary }}
                suffix="%"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Vacation Approval Rate</span>}
                value={vacations.approval_rate || 0}
                valueStyle={{ color: '#faad14' }}
                suffix="%"
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: colors.textSecondary }}>
                {vacations.total || 0} total requests
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card
              title={<span style={{ color: colors.textPrimary, fontWeight: 600 }}>Performance Metrics</span>}
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Statistic
                  title="Average Events Per Employee"
                  value={performance.average_events_per_employee || 0}
                  precision={2}
                  valueStyle={{ color: colors.primary }}
                />
                <Statistic
                  title="Average Participation Rate"
                  value={performance.average_participation_rate || 0}
                  precision={2}
                  valueStyle={{ color: colors.primary }}
                />
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title={<span style={{ color: colors.textPrimary, fontWeight: 600 }}>Vacation Statistics</span>}
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary }}>Total Requests:</Text>
                  <Text strong style={{ color: colors.textPrimary }}>{vacations.total || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary }}>Approved:</Text>
                  <Text strong style={{ color: '#52c41a' }}>{vacations.approved || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary }}>Pending:</Text>
                  <Text strong style={{ color: '#faad14' }}>{vacations.pending || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary }}>Rejected:</Text>
                  <Text strong style={{ color: '#ff4d4f' }}>{vacations.rejected || 0}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card 
          title={<span style={{ color: colors.textPrimary, fontWeight: 600 }}>Data Visualization</span>}
          style={{ 
            marginTop: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Completed', value: projects.completed || 0 },
                        { name: 'In Progress', value: projects.in_progress || 0 },
                        { name: 'Planned', value: projects.planned || 0 },
                      ]}
                      margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="name" stroke={colors.textSecondary} />
                      <YAxis stroke={colors.textSecondary} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill={colors.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RCPieChart>
                      <Pie
                        data={[
                          { name: 'Approved', value: vacations.approved || 0 },
                          { name: 'Pending', value: vacations.pending || 0 },
                          { name: 'Rejected', value: vacations.rejected || 0 },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                      >
                        <Cell fill={colors.success} />
                        <Cell fill={colors.warning} />
                        <Cell fill={colors.error} />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RCPieChart>
                  </ResponsiveContainer>
                </div>
              </Col>
            </Row>
          </Space>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default Analytics;
