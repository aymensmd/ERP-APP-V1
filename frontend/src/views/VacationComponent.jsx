import React, { useState, useEffect } from 'react';
import {
  Badge, Card, Space, Table, Row, List, Button, Drawer, Form, Select,
  message, Calendar, Statistic, Tag, Typography, Divider, Col, Descriptions,
  ConfigProvider, theme, App, Spin, Avatar, Tooltip
} from 'antd';
import {
  DownCircleTwoTone, UpCircleTwoTone, CalendarTwoTone, UserOutlined,
  InfoCircleOutlined, MailOutlined, TeamOutlined, CalendarOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';
import { useStateContext } from '../contexts/ContextProvider';

const { useToken } = theme;
const { Option } = Select;
const { Title, Text } = Typography;

// Set dayjs to default (English)
dayjs.locale('en');

function LiveClock({ fontSize = 32 }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Text style={{ fontSize, fontWeight: 700, color: 'var(--primary-color)' }}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </Text>
      <Text type="secondary" style={{ fontSize: fontSize / 2.5 }}>
        {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </Text>
    </div>
  );
}

const TOOL_CONFIG = {
  calendar: {
    icon: <CalendarOutlined style={{ fontSize: 28, color: '#4f46e5' }} />,
    title: 'Calendar',
    content: (
      <div className="glass-inner-card" style={{ padding: 8 }}>
        <Calendar fullscreen={false} headerRender={() => null} style={{ background: 'transparent' }} />
      </div>
    ),
  },
  watch: {
    icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
    title: 'Clock',
    content: <LiveClock fontSize={24} />,
  },
  weather: {
    icon: <span style={{ fontSize: 28 }}>☀️</span>,
    title: 'Weather',
    content: (
      <div style={{ textAlign: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>24°C</Title>
        <Text type="secondary">Sunny in Casablanca</Text>
      </div>
    ),
  },
  quote: {
    icon: <span style={{ fontSize: 28 }}>💡</span>,
    title: 'Quote',
    content: (
      <div style={{ padding: '0 12px', textAlign: 'center' }}>
        <Text italic style={{ fontSize: 13 }}>"The only way to do great work is to love what you do."</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 11 }}>— Steve Jobs</Text>
      </div>
    ),
  },
};

const ToolBoxItem = ({ tool, isExpanded, onExpand, onCollapse }) => {
  return (
    <div
      className={`glass-card tool-item ${isExpanded ? 'active' : ''}`}
      onClick={() => !isExpanded && onExpand(tool)}
      style={{
        width: isExpanded ? '100%' : 100,
        height: isExpanded ? 200 : 100,
        padding: isExpanded ? 20 : 12,
        cursor: isExpanded ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: isExpanded ? 10 : 1,
        overflow: 'hidden'
      }}
    >
      {isExpanded && (
        <Button
          type="text"
          icon={<CloseCircleOutlined />}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 11 }}
          onClick={(e) => { e.stopPropagation(); onCollapse(); }}
        />
      )}
      {!isExpanded ? (
        <>
          {TOOL_CONFIG[tool].icon}
          <Text strong style={{ marginTop: 8, fontSize: 12 }}>{TOOL_CONFIG[tool].title}</Text>
        </>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {TOOL_CONFIG[tool].content}
        </div>
      )}
    </div>
  );
};

const VacationComponent = () => {
  const { user: currentUser } = useStateContext();
  const [userData, setUserData] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [expandedTool, setExpandedTool] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/employees');
      const employees = Array.isArray(response.data) ? response.data : [];

      const formatted = employees.map(user => ({
        ...user,
        key: user.id,
        vacationRequests: Array.isArray(user.vacations) ? user.vacations.map(v => ({
          ...v,
          key: v.id,
          user_id: user.id
        })) : []
      }));
      setUserData(formatted);
    } catch (error) {
      message.error('Failed to fetch employee vacations');
    } finally {
      setLoading(false);
    }
  };

  const onUpdateStatus = async (values) => {
    try {
      await axios.put(`/vacations/${selectedVacation.id}`, {
        ...selectedVacation,
        status: values.status
      });
      message.success('Vacation status updated');
      setDrawerVisible(false);
      fetchUserData();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#4f46e5' }} />
          <div>
            <Text strong>{record.name}</Text>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => (
        <Tag color="blue" style={{ borderRadius: 6 }}>{typeof dept === 'string' ? dept : dept?.name || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Pending Requests',
      key: 'pending',
      align: 'center',
      render: (_, record) => {
        const count = record.vacationRequests.filter(v => v.status === 'En attente' || v.status === 'pending').length;
        return count > 0 ? (
          <Badge count={count} offset={[10, 0]}>
            <Tag color="warning" icon={<ClockCircleOutlined />}>Pending</Tag>
          </Badge>
        ) : <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Total Requests',
      key: 'total',
      align: 'center',
      render: (_, record) => (
        <Text strong>{record.vacationRequests.length}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Button
          type="text"
          icon={expandedRowKeys.includes(record.key) ? <UpCircleTwoTone /> : <DownCircleTwoTone />}
          onClick={() => setExpandedRowKeys(prev => prev.includes(record.key) ? prev.filter(k => k !== record.key) : [...prev, record.key])}
        >
          {expandedRowKeys.includes(record.key) ? 'Hide' : 'View Requests'}
        </Button>
      ),
    },
  ];

  const expandedRowRender = (record) => {
    const subColumns = [
      {
        title: 'Period',
        key: 'period',
        render: (_, v) => (
          <Space>
            <CalendarOutlined style={{ color: '#4f46e5' }} />
            <Text>{dayjs(v.start_date).format('MMM DD')} - {dayjs(v.end_date).format('MMM DD, YYYY')}</Text>
            <Tag color="cyan">{dayjs(v.end_date).diff(dayjs(v.start_date), 'day') + 1} Days</Tag>
          </Space>
        ),
      },
      {
        title: 'Reason',
        dataIndex: 'reason',
        key: 'reason',
        render: (reason) => <Text type="secondary">{reason || 'No reason provided'}</Text>,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          let color = 'default';
          let icon = <ClockCircleOutlined />;
          if (status === 'Approuvé' || status === 'approved') { color = 'success'; icon = <CheckCircleOutlined />; }
          if (status === 'Refusé' || status === 'rejected') { color = 'error'; icon = <CloseCircleOutlined />; }
          return <Tag color={color} icon={icon} style={{ borderRadius: 4, textTransform: 'capitalize' }}>{status}</Tag>;
        },
      },
      {
        title: 'Action',
        key: 'action',
        align: 'right',
        render: (_, v) => {
          const isPending = v.status === 'En attente' || v.status === 'pending';
          const isNotSelf = currentUser?.id !== record.id;
          return isPending && isNotSelf ? (
            <Button
              size="small"
              type="primary"
              style={{ borderRadius: 4 }}
              onClick={() => {
                setSelectedVacation(v);
                setSelectedUser(record);
                form.setFieldsValue({ status: v.status });
                setDrawerVisible(true);
              }}
            >
              Manage
            </Button>
          ) : null;
        },
      },
    ];

    return (
      <Table
        columns={subColumns}
        dataSource={record.vacationRequests}
        pagination={false}
        size="small"
        className="glass-inner-table"
        style={{ margin: '8px 0' }}
      />
    );
  };

  const stats = {
    total: userData.length,
    requests: userData.flatMap(u => u.vacationRequests).length,
    pending: userData.flatMap(u => u.vacationRequests).filter(v => v.status === 'En attente' || v.status === 'pending').length,
    approved: userData.flatMap(u => u.vacationRequests).filter(v => v.status === 'Approuvé' || v.status === 'approved').length,
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} className="text-gradient" style={{ marginBottom: 4 }}>Vacations & Time-Off</Title>
          <Text type="secondary">Review and manage employee leave requests and attendance.</Text>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['calendar', 'watch', 'weather', 'quote'].map(tool => (
            <ToolBoxItem
              key={tool}
              tool={tool}
              isExpanded={expandedTool === tool}
              onExpand={setExpandedTool}
              onCollapse={() => setExpandedTool(null)}
            />
          ))}
        </div>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <Card className="glass-card" onClick={fetchUserData}>
            <Statistic title="Employees" value={stats.total} prefix={<TeamOutlined style={{ color: '#4f46e5' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Total Requests" value={stats.requests} prefix={<CalendarOutlined style={{ color: '#10b981' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic
              title="Pending Approval"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: stats.pending > 0 ? '#f59e0b' : 'inherit' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Approved this Month" value={stats.approved} prefix={<CheckCircleOutlined style={{ color: '#8b5cf6' }} />} />
          </Card>
        </Col>
      </Row>

      <Card className="glass-card" bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '24px 24px 0 24px' }}>
          <Title level={4} style={{ margin: 0 }}>Employee Vacation List</Title>
          <Divider style={{ margin: '16px 0 0 0' }} />
        </div>
        <Table
          columns={columns}
          dataSource={userData}
          loading={loading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpand: (expanded, record) => setExpandedRowKeys(prev => expanded ? [...prev, record.key] : prev.filter(k => k !== record.key)),
            showExpandColumn: false,
          }}
          className="premium-table"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Drawer
        title="Manage Vacation Request"
        placement="right"
        width={400}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="premium-modal"
      >
        {selectedUser && selectedVacation && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card className="glass-inner-card">
              <Space>
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#4f46e5' }} />
                <div>
                  <Title level={5} style={{ margin: 0 }}>{selectedUser.name}</Title>
                  <Text type="secondary">{selectedUser.department}</Text>
                </div>
              </Space>
            </Card>

            <Descriptions column={1} bordered size="small" className="glass-inner-card">
              <Descriptions.Item label="Period">
                {dayjs(selectedVacation.start_date).format('MMM DD')} - {dayjs(selectedVacation.end_date).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {dayjs(selectedVacation.end_date).diff(dayjs(selectedVacation.start_date), 'day') + 1} Days
              </Descriptions.Item>
              <Descriptions.Item label="Reason">
                {selectedVacation.reason || 'None'}
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={onUpdateStatus}>
              <Form.Item name="status" label="Update Status" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="Approuvé">Approve</Option>
                  <Option value="Refusé">Reject</Option>
                  <Option value="En attente">Keep Pending</Option>
                </Select>
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" style={{ background: 'var(--primary-gradient)', border: 'none' }}>
                Save Changes
              </Button>
            </Form>

            <Alert
              message="Policy Reminder"
              description="Vacation approvals should follow department guidelines and ensure team availability."
              type="info"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
          </Space>
        )}
      </Drawer>

      <style>{`
        .tool-item {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .tool-item:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.6);
        }
        .tool-item.active {
          width: 300px !important;
          background: rgba(255, 255, 255, 0.8);
        }
        .glass-inner-table .ant-table { background: transparent !important; }
        .glass-inner-table .ant-table-thead > tr > th { background: rgba(0,0,0,0.01) !important; font-size: 11px !important; }
        .premium-table .ant-table-row-level-0 { cursor: pointer; }
      `}</style>
    </div>
  );
};

export default VacationComponent;