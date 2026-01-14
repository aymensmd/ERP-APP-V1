import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Button, Row, Col, Menu, List, Spin, Empty, Modal, Upload, message, ConfigProvider } from 'antd';
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
  const { theme, user: contextUser } = useStateContext();
  const [activeTab, setActiveTab] = useState('information');
  const [eventHistory, setEventHistory] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [profileStats, setProfileStats] = useState({ totalEvents: 0, ongoingEvents: 0 });
  const [quote, setQuote] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editableQuote, setEditableQuote] = useState(quote);
  // Removed unused loadingUser state
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
    } catch {
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
    } catch {
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
    setIsModalVisible(true);
  };

  const handleSaveProfile = () => {
    setQuote(editableQuote);
    setIsModalVisible(false);
  };

  const handleCancelEdit = () => {
    setEditableQuote(quote);
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
        width: '100%'
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

        
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Card style={{ 
                padding: '24px', 
                background: colors.cardBg,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: 'none'
              }}>
                <Card 
                  style={{ 
                    marginBottom: 24, 
                    background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}05 100%)`, 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Avatar
                      size={80}
                      src={contextUser?.avatar}
                      style={{ 
                        backgroundColor: colors.avatarBg, 
                        fontSize: '32px', 
                        transition: 'background 0.3s' 
                      }}
                    >
                      {contextUser?.name ? contextUser.name.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Title level={2} style={{ margin: 0, fontSize: '2.2em', color: colors.textPrimary }}>
                          {contextUser?.name || 'Name not provided'}
                        </Title>
                      </div>
                      <Text type="secondary" style={{ color: colors.textSecondary }}>
                        {typeof contextUser?.department === 'string' 
                          ? contextUser.department 
                          : (contextUser?.department?.name || 'Department not provided')}
                      </Text>
                    </div>
                  </div>
                </Card>
                <div style={{ margin: '18px 0 8px 0', display: 'flex', gap: 8 }}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEditProfile}
                    style={{ fontWeight: 600, letterSpacing: 1 }}
                    block
                  >
                    Edit Profile
                  </Button>
                </div>
                <Card 
                  size="small" 
                  style={{ 
                    background: colors.successBg, 
                    border: 'none', 
                    marginBottom: 10 
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ color: colors.textPrimary }}>
                      <CalendarTwoTone /> <b>Joined:</b> {contextUser?.created_at ? new Date(contextUser.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                    <span style={{ color: colors.textPrimary }}>
                      <ClockCircleOutlined /> <b>Last Login:</b> {contextUser?.last_login ? new Date(contextUser.last_login).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </Card>
                <Card 
                  size="small" 
                  style={{ 
                    background: colors.infoBg, 
                    border: 'none' 
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ color: colors.textPrimary }}>
                      <HistoryOutlined /> <b>Total Events:</b> {profileStats.totalEvents}
                    </span>
                    <span style={{ color: colors.textPrimary }}>
                      <ClockCircleOutlined /> <b>Ongoing:</b> {profileStats.ongoingEvents}
                    </span>
                  </div>
                </Card>
                <Card 
                  size="small" 
                  style={{ 
                    background: colors.warningBg, 
                    border: 'none', 
                    marginTop: 10 
                  }}
                >
                  <Text italic style={{ color: colors.textPrimary }}>
                    "{quote}"
                  </Text>
                </Card>
              </Card>
              <Modal
                title="Edit Motivation Message"
                open={isModalVisible}
                onOk={handleSaveProfile}
                onCancel={handleCancelEdit}
                okText="Save"
                cancelText="Cancel"
                styles={{
                  body: {
                    background: colors.cardBg,
                  }
                }}
              >
                <label style={{ fontWeight: 500, color: colors.textPrimary }}>
                  Motivation Message:
                  <input
                    type="text"
                    value={editableQuote}
                    onChange={e => setEditableQuote(e.target.value)}
                    style={{ 
                      marginLeft: 10, 
                      width: '80%',
                      background: colors.cardBg,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.border}`,
                      padding: '4px 8px'
                    }}
                    maxLength={120}
                  />
                </label>
              </Modal>
            </Col>
            <Col xs={24} md={16}>
              <Card 
                style={{ 
                  padding: '20px', 
                  marginBottom: '20px',
                  background: colors.cardBg
                }}
              >
                <Menu 
                  onClick={handleMenuClick} 
                  selectedKeys={[activeTab]} 
                  mode="horizontal"
                  style={{ background: colors.cardBg }}
                >
                  <Menu.Item key="information" icon={<InfoCircleOutlined />}>
                    Information
                  </Menu.Item>
                  <Menu.Item key="history" icon={<HistoryOutlined />}>
                    History
                  </Menu.Item>
                  <Menu.Item key="documents" icon={<FilePdfOutlined />}>
                    Documents & Skills
                  </Menu.Item>
                </Menu>
              </Card>
              {activeTab === 'information' && (
                <Card 
                  style={{ 
                    padding: '32px', 
                    background: colors.infoBg, 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <Title 
                    level={5} 
                    style={{ 
                      marginBottom: '20px', 
                      color: colors.primary, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8 
                    }}
                  >
                    <InfoCircleOutlined style={{ color: colors.primary }} /> Personal Information
                  </Title>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px 32px',
                    marginBottom: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <UserOutlined style={{ color: colors.primary, fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: colors.primary }}>Name:</Text>
                        <div style={{ color: colors.textPrimary }}>{contextUser?.name || 'Name not provided'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <InfoCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: colors.primary }}>Department:</Text>
                        <div style={{ color: colors.textPrimary }}>
                          {typeof contextUser?.department === 'string' 
                            ? contextUser.department 
                            : (contextUser?.department?.name || 'Department not provided')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <PhoneOutlined style={{ color: '#faad14', fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: colors.primary }}>Phone:</Text>
                        <div style={{ color: colors.textPrimary }}>{contextUser?.phone_number || 'Phone not provided'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <HomeOutlined style={{ color: '#13c2c2', fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: colors.primary }}>Address:</Text>
                        <div style={{ color: colors.textPrimary }}>{contextUser?.adress || 'Address not provided'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MailOutlined style={{ color: '#722ed1', fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: colors.primary }}>Email:</Text>
                        <div style={{ color: colors.textPrimary }}>{contextUser?.email || 'Email not provided'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <SafetyCertificateOutlined style={{ color: '#eb2f96', fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: colors.primary }}>SOS Number:</Text>
                        <div style={{ color: colors.textPrimary }}>{contextUser?.sos_number || 'SOS Number not provided'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <HeartOutlined style={{ color: '#cf1322', fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: colors.primary }}>Social Situation:</Text>
                        <div style={{ color: colors.textPrimary }}>{contextUser?.social_situation || 'Social Situation not provided'}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <Title level={5} style={{ color: colors.primary, marginBottom: 6 }}>Skills & Interests</Title>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ background: '#e6f7ff', color: colors.primary, borderRadius: 6, padding: '2px 10px', fontSize: 13 }}>Teamwork</span>
                      <span style={{ background: '#fff1b8', color: '#faad14', borderRadius: 6, padding: '2px 10px', fontSize: 13 }}>Communication</span>
                      <span style={{ background: '#ffd6e7', color: '#eb2f96', borderRadius: 6, padding: '2px 10px', fontSize: 13 }}>Problem Solving</span>
                      <span style={{ background: '#f6ffed', color: '#389e0d', borderRadius: 6, padding: '2px 10px', fontSize: 13 }}>Creativity</span>
                    </div>
                  </div>
                </Card>
              )}
              {activeTab === 'history' && (
                <Card 
                  style={{ 
                    padding: '20px', 
                    background: colors.historyBg, 
                    borderRadius: 12, 
                    boxShadow: colors.boxShadow 
                  }}
                >
                  <Title 
                    level={5} 
                    style={{ 
                      marginBottom: '20px', 
                      color: '#faad14', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8 
                    }}
                  >
                    <HistoryOutlined style={{ color: '#faad14' }} /> History
                  </Title>
                  <Title level={5} style={{ color: colors.primary, marginTop: 0, marginBottom: 10, fontSize: 16 }}>Events</Title>
                  {loadingEvents ? (
                    <Spin />
                  ) : eventHistory.length === 0 ? (
                    <Empty description="No events assigned" />
                  ) : (
                    <List
                      itemLayout="horizontal"
                      dataSource={eventHistory}
                      renderItem={item => (
                        <List.Item 
                          style={{ 
                            background: colors.cardBg, 
                            borderRadius: 8, 
                            marginBottom: 10, 
                            boxShadow: colors.boxShadow, 
                            padding: 16 
                          }}
                        >
                          <List.Item.Meta
                            avatar={<Avatar style={{ background: colors.primary }} icon={<ClockCircleOutlined />} />}
                            title={
                              <span style={{ fontWeight: 600, color: colors.primary, fontSize: 15 }}>
                                <CalendarTwoTone /> {item.title}
                              </span>
                            }
                            description={
                              <div style={{ fontSize: 13 }}>
                                <div style={{ marginBottom: 4 }}>
                                  <span style={{ color: '#faad14', fontWeight: 500 }}><ClockCircleOutlined /> Date:</span> 
                                  <span style={{ color: colors.textPrimary }}> {item.start_date}</span>
                                </div>
                                <div style={{ color: colors.textSecondary, marginBottom: 4 }}>
                                  <span style={{ color: '#722ed1', fontWeight: 500 }}><InfoCircleOutlined /> Description:</span> 
                                  {item.description && item.description.length > 60 ? item.description.slice(0, 60) + '...' : item.description}
                                </div>
                                <div style={{ fontWeight: 500, marginBottom: 4, color: item.end_date && new Date(item.end_date) < new Date() ? '#cf1322' : '#389e0d' }}>
                                  <span style={{ color: item.end_date && new Date(item.end_date) < new Date() ? '#cf1322' : '#389e0d' }}>
                                    <HistoryOutlined /> Status:
                                  </span> 
                                  {item.end_date && new Date(item.end_date) < new Date() ? 'Ended' : 'Ongoing'}
                                </div>
                                <div style={{ fontWeight: 500, color: colors.primary, marginBottom: 2 }}>
                                  <UserOutlined /> Assigned Users:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                  {(Array.isArray(item.users) && item.users.length > 0
                                    ? item.users
                                    : Array.isArray(item.participants) && item.participants.length > 0
                                      ? item.participants
                                      : []
                                  ).length > 0
                                    ? (Array.isArray(item.users) && item.users.length > 0
                                        ? item.users
                                        : item.participants
                                      ).map(u => (
                                        <span 
                                          key={u.id || u.email} 
                                          style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            background: theme === 'dark' ? '#1a1a1a' : '#e6f0ff', 
                                            borderRadius: 6, 
                                            padding: '2px 8px', 
                                            marginBottom: 2 
                                          }}
                                        >
                                          <Avatar 
                                            size={18} 
                                            style={{ 
                                              marginRight: 6, 
                                              background: colors.cardBg, 
                                              color: colors.primary, 
                                              fontWeight: 600, 
                                              fontSize: 11 
                                            }}
                                          >
                                            {u.name ? u.name.charAt(0) : (u.email ? u.email.charAt(0) : '?')}
                                          </Avatar>
                                          <span style={{ fontSize: 12, color: colors.textPrimary, fontWeight: 500 }}>
                                            {u.name || u.email || 'Unknown'}
                                          </span>
                                          {u.department && (
                                            <span style={{ fontSize: 11, color: '#52c41a', marginLeft: 6 }}>
                                              <InfoCircleOutlined /> {typeof u.department === 'string' 
                                                ? u.department 
                                                : (u.department?.name || 'N/A')}
                                            </span>
                                          )}
                                        </span>
                                      ))
                                    : <span style={{ fontSize: 12, color: colors.textSecondary }}>No users assigned</span>
                                  }
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                  <Title level={5} style={{ color: colors.primary, marginTop: 24, marginBottom: 10, fontSize: 16 }}>Vacations</Title>
                  {loadingVacations ? (
                    <Spin />
                  ) : vacations.length === 0 ? (
                    <Empty description="No vacations found" />
                  ) : (
                    <List
                      itemLayout="horizontal"
                      dataSource={vacations}
                      renderItem={vac => (
                        <List.Item 
                          style={{ 
                            background: colors.cardBg, 
                            borderRadius: 8, 
                            marginBottom: 10, 
                            boxShadow: colors.boxShadow, 
                            padding: 16 
                          }}
                        >
                          <List.Item.Meta
                            avatar={<Avatar style={{ background: '#faad14' }} icon={<CalendarTwoTone />} />}
                            title={
                              <span style={{ fontWeight: 600, color: '#faad14', fontSize: 15 }}>
                                Vacation: {vac.type || 'N/A'}
                              </span>
                            }
                            description={
                              <div style={{ fontSize: 13 }}>
                                <div style={{ marginBottom: 4 }}>
                                  <span style={{ color: '#faad14', fontWeight: 500 }}>From:</span> 
                                  <span style={{ color: colors.textPrimary }}> {vac.start_date}</span>
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                  <span style={{ color: '#faad14', fontWeight: 500 }}>To:</span> 
                                  <span style={{ color: colors.textPrimary }}> {vac.end_date}</span>
                                </div>
                                <div style={{ color: colors.textSecondary, marginBottom: 4 }}>
                                  <span style={{ color: '#722ed1', fontWeight: 500 }}>Reason:</span> 
                                  {vac.reason && vac.reason.length > 60 ? vac.reason.slice(0, 60) + '...' : vac.reason}
                                </div>
                                <div style={{ fontWeight: 500, color: colors.primary, marginBottom: 2 }}>
                                  <UserOutlined /> Status: {vac.status || 'N/A'}
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              )}
              {activeTab === 'documents' && (
                <EmployeeProfileTabs userId={contextUser?.id} isOwnProfile={true} />
              )}
            </Col>
          </Row>
        
      </div>
    </ConfigProvider>
  );
};

export default ProfilePage;
