// settingsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Divider, 
  Switch, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Popconfirm, 
  Avatar, 
  List,
  Row,
  Col,
  Space,
  Badge
} from 'antd';
import { 
  SettingOutlined, 
  LockOutlined, 
  BellOutlined, 
  UserOutlined, 
  ExportOutlined, 
  QuestionCircleOutlined, 
  LogoutOutlined, 
  MobileOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import axios from '../axios';
import AnyNamecrm from '../assets/AnyNamecrm.png';

const { Title, Text } = Typography;

const SettingsPage = () => {
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [isEmailModalVisible, setEmailModalVisible] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [is2FAEnabled, set2FAEnabled] = useState(false);
  const { theme, setTheme, user: contextUser, setUser, token } = useStateContext();
  const [form] = Form.useForm();

  const user = {
    name: contextUser?.name?.toString() || 'User Name',
    email: contextUser?.email?.toString() || 'user@example.com',
    role: contextUser?.role?.toString() || 'Employee',
    avatar: contextUser?.avatar || null
  };

  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222',
      textSecondary: '#555',
      border: '#f0f0f0',
      primary: '#277dfe',
      avatarBg: '#e6f7ff',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.65)',
      border: '#303030',
      primary: '#177ddc',
      avatarBg: '#111b26',
    }
  };

  const colors = themeStyles[theme];

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const response = await axios.get('/employees', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userId = localStorage.getItem('USER_ID');
        const currentUser = response.data.find(emp => String(emp.id) === String(userId));

        if (currentUser) {
          setUser({
            name: currentUser.name?.toString(),
            email: currentUser.email?.toString(),
            role: currentUser.role?.toString(),
            avatar: currentUser.avatar
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, [token, setUser]);

  const sessions = [
    { id: 1, device: 'Windows PC', location: 'Tunis, Tunisia', lastActive: 'Now', current: true },
    { id: 2, device: 'iPhone 14', location: 'Sousse, Tunisia', lastActive: '2 days ago', current: false },
  ];

  const handlePasswordOk = () => {
    form.validateFields(['currentPassword', 'newPassword', 'confirmPassword'])
      .then(() => {
        setPasswordModalVisible(false);
        message.success('Password changed successfully!');
        form.resetFields();
      })
      .catch(() => {});
  };

  const handleEmailOk = () => {
    form.validateFields(['email'])
      .then(() => {
        setEmailModalVisible(false);
        message.success('Email updated successfully!');
        form.resetFields();
      })
      .catch(() => {});
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    message.success(`Switched to ${newTheme} mode`);
  };

  return (
    <div style={{ 
      padding: '32px', 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f7',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    }}>
      <Card 
        style={{ 
          maxWidth: '100%', 
          margin: '0 auto', 
          borderRadius: '16px', 
          backgroundColor: colors.cardBg, 
          borderColor: colors.border,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: 'none'
        }}
        styles={{ body: { padding: '32px' } }}
      >
        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
          <Avatar size={80} src={user.avatar || AnyNamecrm} style={{ backgroundColor: colors.primary, color: '#fff', fontSize: 32 }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Title level={3} style={{ margin: 0, color: colors.textPrimary }}>{user.name}</Title>
            <Text type="secondary" style={{ color: colors.textSecondary }}>{user.email}</Text>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: colors.textSecondary }}>
                <UserOutlined style={{ marginRight: 8 }} />
                {typeof user.role === 'string' ? user.role : (user.role?.name || 'N/A')}
              </Text>
            </div>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* Left */}
          <Col xs={24} md={12}>
            <Card title={<Text strong style={{ color: colors.primary }}><UserOutlined style={{ marginRight: 8 }} />Account Settings</Text>} variant="outlined" style={{ backgroundColor: colors.cardBg }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button type="primary" block onClick={() => setPasswordModalVisible(true)} style={{ textAlign: 'left' }}>Change Password</Button>
                <Button block onClick={() => setEmailModalVisible(true)} style={{ textAlign: 'left' }}>Update Email</Button>
              </Space>
            </Card>
            <Card title={<Text strong style={{ color: colors.primary }}><MobileOutlined style={{ marginRight: 8 }} />Active Sessions</Text>} variant="outlined" style={{ marginTop: 24, backgroundColor: colors.cardBg }}>
              <List
                size="small"
                dataSource={sessions}
                renderItem={item => (
                  <List.Item
                    style={{ padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}
                    actions={item.current ? [<Badge status="success" text="Current" />] : [<Button size="small" type="link" icon={<LogoutOutlined />} danger>Logout</Button>]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<MobileOutlined />} style={{ background: colors.avatarBg, color: colors.primary }} />}
                      title={<Text style={{ color: colors.textPrimary }}>{item.device}</Text>}
                      description={<Text type="secondary">{item.location} • Last active: {item.lastActive}</Text>}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Right */}
          <Col xs={24} md={12}>
            <Card title={<Text strong style={{ color: colors.primary }}><SettingOutlined style={{ marginRight: 8 }} />Preferences</Text>} variant="outlined" style={{ backgroundColor: colors.cardBg }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textPrimary }}><SunOutlined style={{ marginRight: 8 }} />Theme</Text>
                  <Switch checked={theme === 'dark'} onChange={toggleTheme} checkedChildren={<MoonOutlined />} unCheckedChildren={<SunOutlined />} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textPrimary }}><BellOutlined style={{ marginRight: 8 }} />Email Notifications</Text>
                  <Switch checked={emailNotifications} onChange={setEmailNotifications} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textPrimary }}><MobileOutlined style={{ marginRight: 8 }} />SMS Notifications</Text>
                  <Switch checked={smsNotifications} onChange={setSmsNotifications} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textPrimary }}><LockOutlined style={{ marginRight: 8 }} />Two-Factor Authentication</Text>
                  <Switch checked={is2FAEnabled} onChange={set2FAEnabled} />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Modals */}
        <Modal
          title="Change Password"
          open={isPasswordModalVisible}
          onOk={handlePasswordOk}
          onCancel={() => setPasswordModalVisible(false)}
          okText="Save"
        >
          <Form form={form} layout="vertical">
            <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true, message: 'Please input your current password!' }]}> <Input.Password /> </Form.Item>
            <Form.Item name="newPassword" label="New Password" rules={[{ required: true, message: 'Please input your new password!' }]}> <Input.Password /> </Form.Item>
            <Form.Item name="confirmPassword" label="Confirm Password" rules={[{ required: true, message: 'Please confirm your new password!' }]}> <Input.Password /> </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Update Email"
          open={isEmailModalVisible}
          onOk={handleEmailOk}
          onCancel={() => setEmailModalVisible(false)}
          okText="Save"
        >
          <Form form={form} layout="vertical">
            <Form.Item name="email" label="New Email" rules={[{ required: true, message: 'Please input your new email!' }, { type: 'email', message: 'Please enter a valid email!' }]}> <Input /> </Form.Item>
          </Form>
        </Modal>

      </Card>
    </div>
  );
};

export default SettingsPage;
