import React, { useState, useEffect } from 'react';
import { Card, Avatar, Form, Input, Typography, Button, Row, Col, Menu, List, Spin, Empty, Modal, Upload, message, ConfigProvider, Tooltip, Tag, Divider, Space } from 'antd';
import {
  InfoCircleOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  HeartOutlined,
  CalendarTwoTone,
  EditOutlined,
  InboxOutlined,
  FilePdfOutlined,
  PlusOutlined
} from '@ant-design/icons';
import axios from '../axios';
import { useStateContext } from '../contexts/ContextProvider';
import EmployeeProfileTabs from '../components/EmployeeProfileTabs';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { theme, user: contextUser, setUser } = useStateContext();
  const [activeTab, setActiveTab] = useState('information');
  const [eventHistory, setEventHistory] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [profileStats, setProfileStats] = useState({ totalEvents: 0, ongoingEvents: 0 });
  const [quote, setQuote] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editableQuote, setEditableQuote] = useState(quote);
  const [loadingUser, setLoadingUser] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [vacations, setVacations] = useState([]);
  const [loadingVacations, setLoadingVacations] = useState(false);

  // Theme configuration
  const themeStyles = {
    light: {
      primary: '#1890ff',
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      avatarBg: '#1890ff',
      infoBg: '#f0f5ff',
      historyBg: '#fffbe6',
      successBg: '#f6ffed',
      warningBg: '#fff7e6',
      errorBg: '#fff1f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    dark: {
      primary: '#177ddc',
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      border: '#303030',
      avatarBg: '#177ddc',
      infoBg: '#111b26',
      historyBg: '#2b2118',
      successBg: '#162312',
      warningBg: '#2b1d11',
      errorBg: '#2a1215',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }
  };

  const colors = themeStyles[theme];

  const uploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      setUploadedFile(file);
      message.success(`${file.name} file selected.`);
      return false;
    },
  };

  const handleMenuClick = (e) => {
    setActiveTab(e.key);
  };

  useEffect(() => {
    const fetchUserEvents = async (userId) => {
      setLoadingEvents(true);
      try {
        const response = await axios.get('/events');
        const userEvents = response.data.filter(event => {
          const users = event.users || event.participants || [];
          return users.some(u => u.id === userId);
        });
        setEventHistory(userEvents);
      } catch (error) {
        setEventHistory([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    const fetchUserVacations = async (userId) => {
      setLoadingVacations(true);
      try {
        const response = await axios.get(`/vacations?user_id=${userId}`);
        setVacations(response.data);
      } catch (error) {
        setVacations([]);
      } finally {
        setLoadingVacations(false);
      }
    };

    if (contextUser?.id) {
      fetchUserEvents(contextUser.id);
      fetchUserVacations(contextUser.id);
    }
    setQuote('Success is not the key to happiness. Happiness is the key to success.');
  }, [contextUser]);

  useEffect(() => {
    setEditableQuote(quote);
  }, [quote]);

  useEffect(() => {
    const totalEvents = eventHistory.length;
    const ongoingEvents = eventHistory.filter(e => !e.end_date || new Date(e.end_date) >= new Date()).length;
    setProfileStats({ totalEvents, ongoingEvents });
  }, [eventHistory]);

  const handleEditProfile = () => {
    setEditForm({
      name: contextUser?.name || '',
      phone_number: contextUser?.phone_number || '',
      address: contextUser?.adress || contextUser?.address || '',
      social_situation: contextUser?.social_situation || '',
      sos_number: contextUser?.sos_number || '',
      quote: quote
    });
    setIsModalVisible(true);
  };

  const [editForm, setEditForm] = useState({
    name: '',
    phone_number: '',
    address: '',
    social_situation: '',
    sos_number: '',
    quote: ''
  });

  const handleSaveProfile = async () => {
    setLoadingUser(true);
    try {
      await axios.put(`/employees/${contextUser.id}`, {
        name: editForm.name,
        phone_number: editForm.phone_number,
        address: editForm.address,
        social_situation: editForm.social_situation,
        sos_number: editForm.sos_number
      });

      setQuote(editForm.quote);
      setUser({
        ...contextUser,
        name: editForm.name,
        phone_number: editForm.phone_number,
        adress: editForm.address,
        social_situation: editForm.social_situation,
        sos_number: editForm.sos_number
      });

      message.success('Profile updated successfully');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Update profile error:', error);
      message.error('Failed to update profile');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleCancelEdit = () => {
    setIsModalVisible(false);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: colors.cardBg,
          colorText: colors.textPrimary,
          colorTextHeading: colors.textPrimary,
          colorBorder: colors.border,
          colorPrimary: colors.primary,
        },
      }}
    >
      <div style={{
        padding: '32px',
        minHeight: 'calc(100vh - 64px)',
        position: 'relative',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        background: 'var(--bg-dashboard)'
      }}>
        {/* Upload Button */}
        <div style={{ position: 'absolute', top: 24, right: 32, zIndex: 10 }}>
          <Button
            type="primary"
            shape="circle"
            icon={<PlusOutlined style={{ fontSize: 22 }} />}
            size="large"
            onClick={() => setIsUploadModalVisible(true)}
            title="Upload Resume/File"
          />
        </div>

        {/* Upload Modal */}
        <Modal
          title="Resume / File Upload"
          open={isUploadModalVisible}
          onCancel={() => setIsUploadModalVisible(false)}
          footer={null}
          centered
          styles={{
            body: {
              background: colors.cardBg,
            }
          }}
        >
          <Card
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              boxShadow: colors.boxShadow,
              textAlign: 'center',
              maxWidth: 320,
              margin: '0 auto'
            }}
            styles={{ body: { padding: 12 } }}
          >
            <div style={{ marginBottom: 2 }}>
              <FilePdfOutlined style={{ fontSize: 16, color: colors.primary }} />
            </div>
            <Title level={5} style={{ color: colors.primary, marginBottom: 0, fontSize: 12 }}>
              Resume / File Upload
            </Title>
            <Text type="secondary" style={{ fontSize: 10 }}>
              {uploadedFile ? (
                <span>Uploaded: <b>{uploadedFile.name}</b></span>
              ) : (
                'No file uploaded yet.'
              )}
            </Text>
            <div style={{ marginTop: 6 }}>
              <Upload.Dragger
                {...uploadProps}
                style={{
                  background: theme === 'dark' ? '#1a1a1a' : '#f0f5ff',
                  borderRadius: 6,
                  minHeight: 48,
                  padding: 4
                }}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 2 }}>
                  <InboxOutlined style={{ color: colors.primary, fontSize: 14 }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 10, marginBottom: 1, color: colors.textPrimary }}>
                  Click or drag file
                </p>
                <p className="ant-upload-hint" style={{ fontSize: 9, color: colors.textSecondary }}>
                  PDF, DOC, DOCX, or image files.
                </p>
              </Upload.Dragger>
            </div>
          </Card>
        </Modal>

        {loadingUser ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Spin size="large" tip="Loading profile..." />
          </div>
        ) : (
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Card className="glass-card" styles={{ body: { padding: '24px' } }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      size={120}
                      src={contextUser?.avatar}
                      className="glass-card"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '3px solid rgba(255,255,255,0.2)',
                        padding: 4
                      }}
                    >
                      {contextUser?.name ? contextUser.name.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                  </div>
                  <Title level={2} className="text-gradient" style={{ marginTop: 16, marginBottom: 4 }}>
                    {contextUser?.name || 'User Name'}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                    {typeof contextUser?.role === 'string' ? contextUser.role : (contextUser?.role?.name || 'Employee')}
                  </Text>
                  <Tag color="blue" style={{ marginTop: 8, borderRadius: 12 }}>
                    {typeof contextUser?.department === 'string'
                      ? contextUser.department
                      : (contextUser?.department?.name || 'Department')}
                  </Tag>
                </div>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEditProfile}
                  style={{ marginBottom: 20, borderRadius: 8, fontWeight: 600 }}
                  block
                >
                  Edit Profile
                </Button>

                <Card size="small" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', marginBottom: 12 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                      <CalendarTwoTone /> <b style={{ marginLeft: 8 }}>Joined:</b> {contextUser?.created_at ? new Date(contextUser.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                      <ClockCircleOutlined /> <b style={{ marginLeft: 8 }}>Last Login:</b> {contextUser?.last_login ? new Date(contextUser.last_login).toLocaleString() : 'N/A'}
                    </div>
                  </Space>
                </Card>

                <Card size="small" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', marginBottom: 12 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                      <HistoryOutlined /> <b style={{ marginLeft: 8 }}>Total Events:</b> {profileStats.totalEvents}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                      <ClockCircleOutlined /> <b style={{ marginLeft: 8 }}>Ongoing:</b> {profileStats.ongoingEvents}
                    </div>
                  </Space>
                </Card>

                <Card size="small" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', marginTop: 10 }}>
                  <Text italic style={{ color: '#d4af37' }}>
                    "{quote}"
                  </Text>
                </Card>
              </Card>
              <Modal
                title={<span className="text-gradient">Edit Profile</span>}
                open={isModalVisible}
                onOk={handleSaveProfile}
                onCancel={handleCancelEdit}
                okText="Save Changes"
                cancelText="Cancel"
                className="glass-modal"
                width={600}
                confirmLoading={loadingUser}
              >
                <Form layout="vertical" style={{ marginTop: 20 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Full Name</span>}>
                        <Input
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Phone Number</span>}>
                        <Input
                          value={editForm.phone_number}
                          onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Address</span>}>
                    <Input
                      value={editForm.address}
                      onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                    />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Social Situation</span>}>
                        <Input
                          value={editForm.social_situation}
                          onChange={e => setEditForm({ ...editForm, social_situation: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>SOS Number</span>}>
                        <Input
                          value={editForm.sos_number}
                          onChange={e => setEditForm({ ...editForm, sos_number: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Motivation Quote</span>}>
                    <Input.TextArea
                      value={editForm.quote}
                      onChange={e => setEditForm({ ...editForm, quote: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                      rows={2}
                      maxLength={120}
                    />
                  </Form.Item>
                </Form>
              </Modal>
            </Col>
            <Col xs={24} md={16}>
              <Card className="glass-card" style={{ marginBottom: 20 }}>
                <Menu
                  onClick={handleMenuClick}
                  selectedKeys={[activeTab]}
                  mode="horizontal"
                  style={{ background: 'transparent', borderBottom: 'none' }}
                  className="profile-menu"
                >
                  <Menu.Item key="information" icon={<InfoCircleOutlined />} style={{ color: '#fff' }}>
                    Information
                  </Menu.Item>
                  <Menu.Item key="history" icon={<HistoryOutlined />} style={{ color: '#fff' }}>
                    History
                  </Menu.Item>
                  <Menu.Item key="documents" icon={<FilePdfOutlined />} style={{ color: '#fff' }}>
                    Documents & Skills
                  </Menu.Item>
                </Menu>
              </Card>
              {activeTab === 'information' && (
                <Card className="glass-card" style={{ padding: '32px' }}>
                  <Title level={4} style={{ marginBottom: 32, color: '#fff' }}>
                    <InfoCircleOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                    Personal Information
                  </Title>

                  <Row gutter={[32, 32]}>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size={1}>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>FULL NAME</Text>
                        <Text strong style={{ color: '#fff', fontSize: 16 }}>{contextUser?.name || 'N/A'}</Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size={1}>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>DEPARTMENT</Text>
                        <Text strong style={{ color: '#fff', fontSize: 16 }}>
                          {typeof contextUser?.department === 'string' ? contextUser.department : (contextUser?.department?.name || 'N/A')}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size={1}>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>PHONE NUMBER</Text>
                        <Text strong style={{ color: '#fff', fontSize: 16 }}>{contextUser?.phone_number || 'N/A'}</Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size={1}>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>EMAIL ADDRESS</Text>
                        <Text strong style={{ color: '#fff', fontSize: 16 }}>{contextUser?.email || 'N/A'}</Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size={1}>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>ADDRESS</Text>
                        <Text strong style={{ color: '#fff', fontSize: 16 }}>{contextUser?.adress || contextUser?.address || 'N/A'}</Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size={1}>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>SOCIAL SITUATION</Text>
                        <Text strong style={{ color: '#fff', fontSize: 16 }}>{contextUser?.social_situation || 'N/A'}</Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size={1}>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>SOS NUMBER</Text>
                        <Text strong style={{ color: '#fff', fontSize: 16 }}>{contextUser?.sos_number || 'N/A'}</Text>
                      </Space>
                    </Col>
                  </Row>

                  <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '32px 0' }} />

                  <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Skills & Interests</Title>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Teamwork', 'Communication', 'Problem Solving', 'Creativity'].map(skill => (
                      <Tag key={skill} color="blue" style={{ borderRadius: 6, padding: '4px 12px', background: 'rgba(24,144,255,0.1)', border: '1px solid rgba(24,144,255,0.2)' }}>
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </Card>
              )}
              {activeTab === 'history' && (
                <Card className="glass-card" style={{ padding: '24px' }}>
                  <Title level={4} style={{ marginBottom: 24, color: '#fff' }}>
                    <HistoryOutlined style={{ marginRight: 12, color: '#faad14' }} />
                    Activity & Events
                  </Title>

                  {loadingEvents ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
                  ) : eventHistory.length === 0 ? (
                    <Empty description={<span style={{ color: 'rgba(255,255,255,0.45)' }}>No events assigned</span>} />
                  ) : (
                    <List
                      dataSource={eventHistory}
                      renderItem={item => (
                        <Card
                          className="glass-card"
                          style={{ marginBottom: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                          styles={{ body: { padding: 20 } }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Space direction="vertical" size={4}>
                              <Text strong style={{ color: '#fff', fontSize: 16 }}>{item.title}</Text>
                              <Space style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                                <CalendarTwoTone /> {item.start_date}
                                <span>•</span>
                                <Tag color={item.end_date && new Date(item.end_date) < new Date() ? 'error' : 'success'} style={{ borderRadius: 4 }}>
                                  {item.end_date && new Date(item.end_date) < new Date() ? 'Ended' : 'Ongoing'}
                                </Tag>
                              </Space>
                            </Space>
                          </div>

                          <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.05)' }} />

                          <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                            {item.description}
                          </Text>

                          <div style={{ marginTop: 16 }}>
                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, display: 'block', marginBottom: 8 }}>PARTICIPANTS</Text>
                            <Avatar.Group maxCount={5}>
                              {(item.users || item.participants || []).map(u => (
                                <Tooltip title={u.name || u.email} key={u.id || u.email}>
                                  <Avatar src={u.avatar} style={{ background: 'rgba(255,255,255,0.1)' }}>
                                    {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || '?'}
                                  </Avatar>
                                </Tooltip>
                              ))}
                            </Avatar.Group>
                          </div>
                        </Card>
                      )}
                    />
                  )}

                  <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '32px 0' }} />

                  <Title level={4} style={{ marginBottom: 24, color: '#fff' }}>
                    <CalendarTwoTone style={{ marginRight: 12 }} />
                    Vacations
                  </Title>

                  {loadingVacations ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
                  ) : vacations.length === 0 ? (
                    <Empty description={<span style={{ color: 'rgba(255,255,255,0.45)' }}>No vacations found</span>} />
                  ) : (
                    <List
                      dataSource={vacations}
                      renderItem={vac => (
                        <Card
                          className="glass-card"
                          style={{ marginBottom: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                          styles={{ body: { padding: 16 } }}
                        >
                          <Row justify="space-between" align="middle">
                            <Col>
                              <Space direction="vertical" size={0}>
                                <Text strong style={{ color: '#fff' }}>{vac.reason || 'Vacation'}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                                  {vac.start_date} to {vac.end_date}
                                </Text>
                              </Space>
                            </Col>
                            <Col>
                              <Tag color={vac.status === 'approved' ? 'success' : (vac.status === 'pending' ? 'warning' : 'error')}>
                                {vac.status?.toUpperCase()}
                              </Tag>
                            </Col>
                          </Row>
                        </Card>
                      )}
                    />
                  )}
                </Card>
              )}
              {activeTab === 'documents' && (
                <Card className="glass-card" style={{ padding: '24px' }}>
                  <Title level={4} style={{ marginBottom: 24, color: '#fff' }}>
                    <FilePdfOutlined style={{ marginRight: 12, color: '#ff4d4f' }} />
                    Documents & Skills
                  </Title>

                  <EmployeeProfileTabs userId={contextUser?.id} isOwnProfile={true} />
                </Card>
              )}
            </Col>
          </Row>
        )}
      </div>
    </ConfigProvider>
  );
};

export default ProfilePage;
