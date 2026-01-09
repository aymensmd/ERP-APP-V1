import React, { useState, useEffect, useRef } from 'react';
import { Typography, Card, Button, List, Tag, ConfigProvider, Space, Divider, Statistic, Row, Col, Spin, message, Popconfirm } from 'antd';
import { ClockCircleOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import axios from '../axios';

const { Title, Paragraph } = Typography;

const TimeTracking = () => {
  const { theme } = useStateContext();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [logs, setLogs] = useState([]);
  const timerRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

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

  useEffect(() => {
    fetchSessions();
    // Poll for active session updates every 5 seconds if running
    const interval = setInterval(() => {
      if (running || activeSession) {
        fetchSessions();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((new Date() - new Date(activeSession.start_time)) / 1000);
        setElapsed(elapsed);
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [activeSession]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/time-tracking/sessions');
      setLogs(response.data.sessions || []);
      setSummary(response.data.summary);
      if (response.data.active_session) {
        setActiveSession(response.data.active_session);
        setRunning(true);
        setElapsed(response.data.active_session.elapsed_seconds || 0);
      } else {
        setActiveSession(null);
        setRunning(false);
        setElapsed(0);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      message.error('Failed to load time tracking data');
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    try {
      const response = await axios.post('/time-tracking/sessions', { action: 'start' });
      message.success('Time tracking started');
      await fetchSessions();
    } catch (error) {
      console.error('Error starting session:', error);
      message.error(error.response?.data?.error || 'Failed to start time tracking');
    }
  };

  const stop = async () => {
    try {
      await axios.post('/time-tracking/sessions', { action: 'stop' });
      message.success('Time tracking stopped');
      await fetchSessions();
    } catch (error) {
      console.error('Error stopping session:', error);
      message.error('Failed to stop time tracking');
    }
  };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`/time-tracking/sessions/${id}`);
      message.success('Session deleted successfully');
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      message.error('Failed to delete session');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
            <ClockCircleOutlined style={{ color: colors.primary }} />
            Time Tracking
          </Title>
          <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: '16px' }}>
            Track your work hours and manage your time efficiently.
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={12}>
            <Card
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Current Session</span>}
                value={formatTime(elapsed)}
                prefix={<ClockCircleOutlined style={{ color: colors.primary }} />}
                valueStyle={{ color: colors.primary, fontSize: '32px', fontWeight: 600 }}
              />
              <Divider style={{ margin: '24px 0' }} />
              <Space size="large">
                <Button 
                  type={running ? 'default' : 'primary'}
                  size="large"
                  icon={running ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={running ? stop : start}
                  style={{ minWidth: '120px' }}
                  loading={loading}
                >
                  {running ? 'Stop' : 'Start'}
                </Button>
                {running && activeSession && (
                  <Tag color="processing" style={{ fontSize: '14px', padding: '4px 12px' }}>
                    Tracking since: {new Date(activeSession.start_time).toLocaleTimeString()}
                  </Tag>
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title={<span style={{ color: colors.textPrimary, fontWeight: 600 }}>Today's Summary</span>}
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Today's Total Hours</span>}
                value={summary?.today_total_hours || 0}
                precision={2}
                suffix="hrs"
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: '16px', color: colors.textSecondary }}>
                Sessions: {summary?.today_sessions_count || 0}
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          title={<span style={{ color: colors.textPrimary, fontWeight: 600 }}>Recent Logs</span>}
          style={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: colors.textSecondary 
            }}>
              No time logs yet. Start tracking to see your logs here.
            </div>
          ) : (
            <List
              dataSource={logs}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Delete this session?"
                      onConfirm={() => deleteSession(item.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        size="small"
                      />
                    </Popconfirm>
                  ]}
                  style={{
                    padding: '16px',
                    borderBottom: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    marginBottom: '8px',
                    background: theme === 'dark' ? '#2a2a2a' : '#fafafa'
                  }}
                >
                  <div style={{ width: '100%', color: colors.textPrimary }}>
                    <div style={{ marginBottom: '4px', fontWeight: 500 }}>
                      Session #{logs.length - index}
                    </div>
                    <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
                      {new Date(item.start_time).toLocaleString()} — {item.end_time ? new Date(item.end_time).toLocaleString() : 'In progress'}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <Tag color="blue">
                        Duration: {item.duration_formatted || formatTime(item.duration || 0)}
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default TimeTracking;
