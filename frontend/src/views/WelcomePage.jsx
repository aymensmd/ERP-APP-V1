import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Divider, Avatar, 
  Carousel, Tag, Statistic, Progress, Badge 
} from 'antd';
import { 
  TeamOutlined, UserOutlined, DashboardOutlined, MessageOutlined, 
  SettingOutlined, CalendarOutlined, RocketOutlined, 
  TrophyOutlined, CheckCircleOutlined, StarOutlined,
  ArrowRightOutlined, NotificationOutlined, ProjectOutlined,
  FileTextOutlined, CloudUploadOutlined, VideoCameraOutlined, CustomerServiceOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import './welcomePage.css';
import logo from '../assets/AnyNamecrm.png';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const WelcomePage = () => {
  const { user, theme } = useStateContext();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [stats, setStats] = useState(null);

  // Theme-aware colors
  const themeColors = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222',
      textSecondary: '#555',
      border: '#f0f0f0',
      primary: '#1890ff',
      cardHover: '#fafafa',
      divider: '#e8e8e8'
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.65)',
      border: '#303030',
      primary: '#177ddc',
      cardHover: '#2a2a2a',
      divider: '#434343'
    }
  };

  const colors = themeColors[theme];

  useEffect(() => {
    setTimeout(() => {
      setStats({
        tasksCompleted: 87,
        projectsActive: 12,
        teamMembers: 24,
        messagesUnread: 3
      });
    }, 1000);
  }, []);

  const bannerMessages = [
    {
      title: "Streamline Your Workflow",
      content: "Our new dashboard helps you accomplish more in less time",
      color: colors.primary
    },
    {
      title: "Team Collaboration",
      content: "Connect with your team through our integrated messaging system",
      color: '#52c41a',
    
    },
    {
      title: "Performance Insights",
      content: "Track your progress with real-time analytics",
      color: '#722ed1'
    }
  ];

  const quickActions = [
    { icon: <DashboardOutlined />, title: 'Dashboard', path: '/dashboard' },
    { icon: <TeamOutlined />, title: 'Team', path: '/users_setting' },
    { icon: <MessageOutlined />, title: 'Messages', path: '/dash/chat' },
    { icon: <CalendarOutlined />, title: 'Calendar', path: '/calendar' },
    { icon: <ProjectOutlined />, title: 'Projects', path: '/projects' },
    { icon: <SettingOutlined />, title: 'Settings', path: '/settings' }
  ];

  const features = [
    {
      icon: <TrophyOutlined style={{ fontSize: 24 }} />,
      title: "Achievements",
      description: "Track your milestones and accomplishments",
      path: '/achievements'
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 24 }} />,
      title: "Task Management",
      description: "Organize and prioritize your work",
      path: '/tasks'
    },
    {
      icon: <StarOutlined style={{ fontSize: 24 }} />,
      title: "Performance",
      description: "Monitor your productivity metrics",
      path: '/performance'
    }
  ];

  const motivationalMessages = [
    "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    "The only limit to our realization of tomorrow is our doubts of today.",
    "Do what you can with all you have, wherever you are.",
    "Your work is going to fill a large part of your life, so do what you love."
  ];

  const [randomMessage] = useState(
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  const quickTools = [
    { icon: <FileTextOutlined />, label: 'HR Policies', path: '/hr-policies' },
    { icon: <CloudUploadOutlined />, label: 'Upload Documents', path: '/upload' },
    { icon: <VideoCameraOutlined />, label: 'Video Meetings', path: '/meetings' },
    { icon: <CustomerServiceOutlined />, label: 'Support', path: '/support' },
  ];

  const newsItems = [
    { title: 'New Feature: Time Tracking', date: '2025-09-20', desc: 'Track your work hours and productivity with our new time tracking tool.' },
    { title: 'Holiday Policy Update', date: '2025-09-10', desc: 'Check out the updated holiday and leave policies for 2025.' },
    { title: 'Wellness Webinar', date: '2025-09-05', desc: 'Join our upcoming wellness webinar for tips on work-life balance.' },
  ];

  const resourceLinks = [
    { icon: <InfoCircleOutlined />, label: 'Employee Handbook', url: '/handbook.pdf' },
    { icon: <FileTextOutlined />, label: 'Company News', url: '/news' },
    { icon: <CustomerServiceOutlined />, label: 'Contact HR', url: '/contact-hr' },
  ];

  return (
    <div 
      className={`welcome-container ${theme}`} 
      style={{ 
        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f7',
        padding: '32px',
        minHeight: 'calc(100vh - 64px)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* Animated Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
       <Carousel 
  autoplay 
  effect="fade" 
  beforeChange={(_, to) => setActiveSlide(to)}
  className="promo-banner"
>
  {bannerMessages.map((item, index) => (
    <div key={index} className="banner-slide" style={{ backgroundColor: item.color }}>
      <div className="banner-content">
        <Title 
          level={3} 
          style={{ 
            color: theme === 'dark' ? 'white' : 'rgba(0, 0, 0, 0.85)', // Black for light theme
            marginBottom: 8 ,
            
          }}
        >
          {item.title}
        </Title>
        <Text style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.65)' }}>
          {item.content}
        </Text>
        <Button 
          type={theme === 'dark' ? 'default' : 'primary'}
          shape="round" 
          style={{ 
            marginTop: 16,
           maxWidth: 150,
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : undefined,
            color: theme === 'dark' ? 'white' : undefined
          }}
          icon={<ArrowRightOutlined />}
        >
          Learn More
        </Button>
      </div>
    </div>
  ))}
</Carousel>
      </motion.div>

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Row gutter={[24, 24]} align="middle" style={{ marginTop: '32px' }}>
          <Col>
            <Badge dot status="success">
              <Avatar 
                size={64} 
                src={user?.avatar} 
                icon={<UserOutlined />} 
                style={{ backgroundColor: colors.primary, color: '#fff' }}
              />
            </Badge>
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ marginBottom: 0, color: colors.textPrimary }}>
              Welcome back, <span style={{ color: colors.primary }}>{user?.name || 'User'}</span>!
            </Title>
            <Text type="secondary" style={{ color: colors.textSecondary }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </Col>
          <Col>
            <Tag icon={<NotificationOutlined />} color="processing">
              Latest Update: v2.1.0
            </Tag>
          </Col>
        </Row>

        {/* Motivational Quote */}
        <Card 
          variant="outlined" 
          style={{ 
            margin: '32px 0',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            background: theme === 'dark' ? 'rgba(24, 144, 255, 0.1)' : '#f6faff',
            borderLeft: `4px solid ${colors.primary}`,
            border: `1px solid ${colors.border}`
          }}
        >
          <Paragraph style={{ fontSize: 16, margin: 0, fontStyle: 'italic', color: colors.textPrimary }}>
            "{randomMessage}"
          </Paragraph>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          {[
            { title: 'Tasks Completed', value: stats?.tasksCompleted, icon: <CheckCircleOutlined />, extra: '87% of monthly goal' },
            { title: 'Active Projects', value: stats?.projectsActive, icon: <ProjectOutlined />, extra: '3 nearing deadline' },
            { title: 'Team Members', value: stats?.teamMembers, icon: <TeamOutlined />, extra: '2 new this week' },
            { title: 'Unread Messages', value: stats?.messagesUnread, icon: <MessageOutlined />, extra: <Button type="link" size="small">View Messages</Button> }
          ].map((stat, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card 
                hoverable
                variant="outlined"
                style={{ 
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Statistic
                  title={<Text style={{ color: colors.textSecondary }}>{stat.title}</Text>}
                  value={stat.value || 0}
                  prefix={stat.icon}
                  valueRender={val => <CountUp end={val} duration={1} />}
                  valueStyle={{ color: colors.textPrimary }}
                />
                {stat.extra && typeof stat.extra === 'string' ? (
                  <Text type="secondary" style={{ color: colors.textSecondary }}>{stat.extra}</Text>
                ) : stat.extra}
              </Card>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card 
          title={<Text style={{ color: colors.textPrimary, fontWeight: 600 }}>Quick Access</Text>}
          extra={<Button type="link" style={{ color: colors.primary }}>See all</Button>}
          variant="outlined"
          style={{ 
            marginBottom: '32px',
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
          styles={{ 
            header: { borderBottom: `1px solid ${colors.border}` }
          }}
        >
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <motion.div whileHover={{ y: -5 }}>
                  <Card 
                    hoverable
                    variant="outlined"
                    className="quick-action-card"
                    onClick={() => window.location.pathname = action.path}
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    styles={{ body: { textAlign: 'center', padding: '20px' } }}
                  >
                    <div style={{ 
                      fontSize: 32,
                      color: colors.primary,
                      marginBottom: 16,
                      transition: 'all 0.3s'
                    }}>
                      {action.icon}
                    </div>
                    <Title level={5} style={{ margin: 0, color: colors.textPrimary }}>{action.title}</Title>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Card>
      </motion.div>

      {/* Features and Recent Activity */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Card 
              title={<Text style={{ color: colors.textPrimary, fontWeight: 600 }}>Key Features</Text>}
              variant="outlined"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}
              styles={{ 
                header: { borderBottom: `1px solid ${colors.border}` }
              }}
            >
              <div className="feature-grid">
                {features.map((feature, index) => (
                  <Card 
                    key={index} 
                    size="small" 
                    hoverable
                    variant="outlined"
                    className="feature-card"
                    onClick={() => feature.path && navigate(feature.path)}
                    style={{
                      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fafafa',
                      borderColor: colors.border,
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      cursor: feature.path ? 'pointer' : 'default',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}> 
                      <div style={{ fontSize: 24, color: colors.primary }}>{feature.icon}</div>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ color: colors.textPrimary }}>{feature.title}</Text>
                        <br />
                        <Text type="secondary" style={{ color: colors.textSecondary }}>{feature.description}</Text>
                      </div>
                      <div>
                        <Button type="text" icon={<ArrowRightOutlined />} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} md={12}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Card 
              title={<Text style={{ color: colors.textPrimary, fontWeight: 600 }}>Recent Activity</Text>}
              extra={<Button type="link" style={{ color: colors.primary }}>View All</Button>}
              variant="outlined"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}
              styles={{ 
                header: { borderBottom: `1px solid ${colors.border}` }
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {[1, 2, 3].map((item) => (
                  <Card 
                    key={item} 
                    size="small" 
                    hoverable
                    variant="outlined"
                    style={{
                      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fafafa',
                      borderColor: colors.border,
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Row align="middle">
                      <Col flex="none" style={{ marginRight: 12 }}>
                        <Avatar size="small" icon={<UserOutlined />} />
                      </Col>
                      <Col flex="auto">
                        <Text strong style={{ color: colors.textPrimary }}>Project {item} updated</Text>
                        <br />
                        <Text type="secondary" style={{ color: colors.textSecondary }}>2 hours ago by Team Member</Text>
                      </Col>
                      <Col flex="none">
                        <Tag color="processing">Update</Tag>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* App Introduction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        <Card 
          title={<Text style={{ color: colors.textPrimary }}>About Our Platform</Text>}
          style={{ 
            marginTop: 24,
            backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
            borderColor: colors.border
          }}
          headStyle={{ borderColor: colors.border }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={12}>
              <Title level={4} style={{ marginBottom: 16, color: colors.textPrimary }}>
                Your Productivity Powerhouse
              </Title>
              <Paragraph style={{ color: colors.textPrimary }}>
                Our platform is designed to streamline your workflow, enhance collaboration, 
                and provide actionable insights to boost your productivity.
              </Paragraph>
              <Paragraph style={{ color: colors.textPrimary }}>
                With intuitive tools and real-time analytics, you can focus on what matters most - 
                achieving your goals and driving results.
              </Paragraph>
              <Button type="primary" icon={<RocketOutlined />}>
                Take the Tour
              </Button>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ 
                height: 250,
                background: theme === 'dark' ? 'rgba(24, 144, 255, 0.05)' : 'rgba(24, 144, 255, 0.1)',
                borderRadius: 8,
                border: `1px dashed ${colors.primary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.primary
              }}>
                <Text>Platform Screenshot</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ padding: '64px 0 32px 0', textAlign: 'center' }}
      >
  <img src={logo} alt="Company Logo" style={{ width: 100, maxWidth: '40%', height: 'auto', marginBottom: 16}} />
        <Title level={1} style={{ color: '#277dfe', fontWeight: 700, marginBottom: 0 }}>
          Empowering Teams, <span style={{ color: '#52c41a' }}>Transforming Work</span>
        </Title>
        <Paragraph style={{ fontSize: 20, maxWidth: 600, margin: '16px auto 32px', color: '#555' }}>
          At <b>AnyName</b>, our mission is to streamline HR processes, foster collaboration, and drive business success through innovative digital solutions.
        </Paragraph>
        <Button type="primary" size="large" style={{ fontWeight: 600, boxShadow: '0 2px 8px #277dfe33' }} onClick={() => navigate('/dashboard')}>
          Get Started
        </Button>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        style={{ maxWidth: 900, margin: '40px auto 0', background: '#e6f7ff', borderRadius: 16, boxShadow: '0 2px 16px #0001', padding: 32, textAlign: 'center' }}
      >
        <Title level={3} style={{ color: '#277dfe', marginBottom: 16 }}>Ready to Transform Your HR Experience?</Title>
        <Paragraph style={{ fontSize: 17, color: '#555', marginBottom: 24 }}>
          Join hundreds of organizations who trust <b>AnyName</b> to power their HR operations and employee engagement.
        </Paragraph>
        <Button type="primary" size="large" style={{ fontWeight: 600, boxShadow: '0 2px 8px #277dfe33' }} onClick={() => navigate('/demo_request')}>
          Request a Demo
        </Button>
      </motion.section>

      {/* Quick Tools Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        style={{ 
          maxWidth: 1200, 
          margin: '40px auto 0', 
          background: colors.cardBg, 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
          padding: '32px',
          border: `1px solid ${colors.border}`
        }}
      >
        <Title level={3} style={{ color: colors.primary, marginBottom: 24, fontWeight: 600 }}>Quick Tools</Title>
        <Row gutter={[16, 16]}>
          {quickTools.map(tool => (
            <Col xs={12} sm={6} key={tool.label}>
              <Card 
                hoverable 
                variant="outlined"
                style={{ 
                  textAlign: 'center', 
                  borderRadius: '16px', 
                  minHeight: 120,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  background: colors.cardBg,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                styles={{ body: { textAlign: 'center' } }}
                onClick={() => navigate(tool.path)}
              >
                <div style={{ fontSize: 32, marginBottom: 8, color: colors.primary }}>{tool.icon}</div>
                <Text style={{ color: colors.textPrimary }}>{tool.label}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.section>

      {/* News Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        style={{ 
          maxWidth: 1200, 
          margin: '40px auto 0', 
          background: theme === 'dark' ? 'rgba(24, 144, 255, 0.1)' : '#f0f5ff', 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
          padding: '32px',
          border: `1px solid ${colors.border}`
        }}
      >
        <Title level={3} style={{ color: colors.primary, marginBottom: 24, fontWeight: 600 }}>Latest News & Updates</Title>
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {newsItems.map(item => (
            <li key={item.title} style={{ marginBottom: 18 }}>
              <Text strong>{item.title}</Text> <Text type="secondary" style={{ marginLeft: 8 }}>{item.date}</Text>
              <Paragraph style={{ margin: 0 }}>{item.desc}</Paragraph>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Resources Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        style={{ 
          maxWidth: 1200, 
          margin: '40px auto 32px', 
          background: colors.cardBg, 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
          padding: '32px',
          border: `1px solid ${colors.border}`
        }}
      >
        <Title level={3} style={{ color: '#52c41a', marginBottom: 24, fontWeight: 600 }}>Resources</Title>
        <Row gutter={[16, 16]}>
          {resourceLinks.map(link => (
            <Col xs={24} sm={8} key={link.label}>
              <Card 
                hoverable 
                variant="outlined"
                style={{ 
                  textAlign: 'center', 
                  borderRadius: '16px', 
                  minHeight: 100,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  background: colors.cardBg,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                styles={{ body: { textAlign: 'center' } }}
                onClick={() => window.open(link.url, '_blank')}
              >
                <div style={{ fontSize: 28, marginBottom: 8, color: '#52c41a' }}>{link.icon}</div>
                <Text style={{ color: colors.textPrimary }}>{link.label}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.section>
    </div>
  );
};

export default WelcomePage;