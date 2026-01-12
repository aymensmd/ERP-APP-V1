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
  Badge,
  Tag
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
import { storage, STORAGE_KEYS } from '../utils/storage';
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
        const userId = storage.get(STORAGE_KEYS.USER_ID);
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

  const handlePasswordOk = async () => {
    try {
      const values = await form.validateFields(['currentPassword', 'newPassword', 'confirmPassword']);
      if (values.newPassword !== values.confirmPassword) {
        message.error('New passwords do not match');
        return;
      }

      await axios.put(`/employees/${contextUser.id}`, {
        old_password: values.currentPassword,
        password: values.newPassword,
        password_confirmation: values.confirmPassword
      });

      setPasswordModalVisible(false);
      message.success('Password changed successfully!');
      form.resetFields();
    } catch (err) {
      console.error('Password change error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to change password';
      message.error(msg);
    }
  };

  const handleEmailOk = async () => {
    try {
      const values = await form.validateFields(['email']);

      await axios.put(`/employees/${contextUser.id}`, {
        email: values.email
      });

      setEmailModalVisible(false);
      message.success('Email updated successfully!');
      setUser({ ...contextUser, email: values.email });
      form.resetFields();
    } catch (err) {
      console.error('Email update error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update email';
      message.error(msg);
    }
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
      background: 'var(--bg-dashboard)',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    }}>
      <Card className="glass-card" styles={{ body: { padding: '32px' } }}>
        <Title level={2} className="text-gradient" style={{ marginBottom: 32 }}>Settings</Title>
        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
          <Avatar size={100} src={user.avatar} style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.2)',
            fontSize: 40
          }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Title level={3} style={{ margin: 0, color: '#fff' }}>{user.name}</Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>{user.email}</Text>
            <div style={{ marginTop: 12 }}>
              <Tag color="blue" style={{ borderRadius: 12, padding: '2px 12px' }}>
                <UserOutlined style={{ marginRight: 8 }} />
                {typeof user.role === 'string' ? user.role : (user.role?.name || 'Employee')}
              </Tag>
            </div>
          </div>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} md={12}>
            <Card
              className="glass-card"
              title={<span style={{ color: '#fff' }}><UserOutlined style={{ marginRight: 8 }} />Account Security</span>}
              style={{ height: '100%', background: 'rgba(255,255,255,0.05)', border: 'none' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong style={{ color: '#fff', display: 'block' }}>Password</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Change your current account password</Text>
                  </div>
                  <Button type="primary" ghost onClick={() => setPasswordModalVisible(true)}>Change</Button>
                </div>

                <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong style={{ color: '#fff', display: 'block' }}>Email Address</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{user.email}</Text>
                  </div>
                  <Button type="primary" ghost onClick={() => setEmailModalVisible(true)}>Update</Button>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Right */}
          <Col xs={24} md={12}>
            <Card
              className="glass-card"
              title={<span style={{ color: '#fff' }}><SettingOutlined style={{ marginRight: 8 }} />App Preferences</span>}
              style={{ height: '100%', background: 'rgba(255,255,255,0.05)', border: 'none' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}><SunOutlined style={{ marginRight: 8 }} />Dark Mode Theme</Text>
                  <Switch checked={theme === 'dark'} onChange={toggleTheme} checkedChildren={<MoonOutlined />} unCheckedChildren={<SunOutlined />} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}><BellOutlined style={{ marginRight: 8 }} />Email Notifications</Text>
                  <Switch checked={emailNotifications} onChange={setEmailNotifications} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}><MobileOutlined style={{ marginRight: 8 }} />SMS Notifications</Text>
                  <Switch checked={smsNotifications} onChange={setSmsNotifications} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}><LockOutlined style={{ marginRight: 8 }} />Two-Factor Auth</Text>
                  <Switch checked={is2FAEnabled} onChange={set2FAEnabled} />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card className="glass-card" style={{ marginTop: 32 }} title={<span style={{ color: '#fff' }}><MobileOutlined style={{ marginRight: 8 }} />Active Sessions</span>}>
        <List
          dataSource={sessions}
          renderItem={item => (
            <List.Item
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              actions={item.current ? [<Badge status="success" text={<span style={{ color: '#fff' }}>Current</span>} />] : [<Button size="small" type="link" icon={<LogoutOutlined />} danger>End Session</Button>]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<MobileOutlined />} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }} />}
                title={<Text style={{ color: '#fff' }}>{item.device}</Text>}
                description={<Text style={{ color: 'rgba(255,255,255,0.5)' }}>{item.location} • Last active: {item.lastActive}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>

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
    </div>
  );
};

export default SettingsPage;
