import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Space, ConfigProvider, Spin, Tag, Divider, Tooltip as AntTooltip } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  ProjectOutlined,
  PieChartOutlined,
  DashboardOutlined,
  CalendarOutlined,
  RiseOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useStateContext } from '../contexts/ContextProvider';
import axios from '../axios';

const { Title, Paragraph, Text } = Typography;

const Analytics = () => {
  const { theme } = useStateContext();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

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

  if (loading || !analytics) {
    return (
      <div className="page-container glass-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Calculating insights..." />
      </div>
    );
  }

  // Sample data processing from analytics response
  const employeesByDept = analytics.employees?.by_department || [
    { name: 'Engineering', value: 45 },
    { name: 'Sales', value: 30 },
    { name: 'Marketing', value: 15 },
    { name: 'HR', value: 10 },
  ];

  const projectStatusData = [
    { name: 'Completed', value: analytics.projects?.completed || 0 },
    { name: 'In Progress', value: analytics.projects?.in_progress || 0 },
    { name: 'Not Started', value: analytics.projects?.not_started || 0 },
  ];

  const revenueData = [
    { name: 'Jan', revenue: 4000, expenses: 2400 },
    { name: 'Feb', revenue: 3000, expenses: 1398 },
    { name: 'Mar', revenue: 2000, expenses: 9800 },
    { name: 'Apr', revenue: 2780, expenses: 3908 },
    { name: 'May', revenue: 1890, expenses: 4800 },
    { name: 'Jun', revenue: 2390, expenses: 3800 },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card" style={{ padding: '8px 12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p className="label" style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0, fontSize: 13 }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <DashboardOutlined style={{ fontSize: 28, color: '#4f46e5' }} />
          <Title level={2} className="text-gradient" style={{ margin: 0 }}>Business Analytics</Title>
        </div>
        <Paragraph type="secondary">Real-time insights into your organizational performance and resource allocation.</Paragraph>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card clickable-card">
            <Statistic
              title={<Text type="secondary">Total Workforce</Text>}
              value={analytics.employees?.total || 0}
              prefix={<TeamOutlined style={{ color: '#4f46e5' }} />}
              valueStyle={{ color: '#4f46e5' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="success" icon={<ArrowUpOutlined />}>12% Increase</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card clickable-card">
            <Statistic
              title={<Text type="secondary">Active Projects</Text>}
              value={analytics.projects?.total || 0}
              prefix={<ProjectOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text strong>{analytics.projects?.completion_rate || 0}%</Text> <Text type="secondary">completed</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card clickable-card">
            <Statistic
              title={<Text type="secondary">Vacation Rate</Text>}
              value={analytics.vacations?.approval_rate || 0}
              suffix="%"
              prefix={<CalendarOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">{analytics.vacations?.pending || 0} pending approvals</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card clickable-card">
            <Statistic
              title={<Text type="secondary">Overall Performance</Text>}
              value={analytics.performance?.average_participation_rate || 0}
              precision={1}
              suffix="/ 10"
              prefix={<RiseOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="purple">Top 10% Industry</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card className="glass-card" title="Revenue vs Expenses Trend" extra={<Title level={5} style={{ margin: 0 }}>USD</Title>}>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="glass-card" title="Department Distribution">
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={employeesByDept}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {employeesByDept.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="glass-card" title="Project Status Overview">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="glass-card" title="Recent Performance Score">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Statistic
                value={analytics.performance?.average_participation_rate || 0}
                precision={2}
                valueStyle={{ fontSize: 48, fontWeight: 700, color: '#4f46e5' }}
                suffix={<span style={{ fontSize: 16, color: '#8c8c8c' }}>/ 10.0</span>}
              />
              <Divider>Breakdown</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Punctuality" value={9.2} precision={1} valueStyle={{ fontSize: 18 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="Engagement" value={8.5} precision={1} valueStyle={{ fontSize: 18 }} />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      <style>{`
        .clickable-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .clickable-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--glass-shadow-hover) !important;
          background: rgba(255, 255, 255, 0.7) !important;
        }
        .recharts-cartesian-grid-horizontal line {
          stroke: rgba(0,0,0,0.05);
        }
        .recharts-legend-item-text {
          font-size: 13px;
          color: #595959 !important;
        }
      `}</style>
    </div>
  );
};

export default Analytics;
