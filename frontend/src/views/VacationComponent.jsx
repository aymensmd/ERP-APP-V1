import React, { useState, useEffect, useContext } from 'react';
import { 
  Badge, Card, Space, Table, Row, List, Button, Drawer, Form, Select, 
  message, Calendar, Statistic, Tag, Typography, Divider, Col, Descriptions,
  ConfigProvider, theme, App, Spin
} from 'antd';
import { 
  DownCircleTwoTone, UpCircleTwoTone, CalendarTwoTone, UserOutlined, 
  InfoCircleOutlined, MailOutlined, TeamOutlined, CalendarOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useStateContext } from '../contexts/ContextProvider';

const { useToken } = theme;
const { Option } = Select;
const { Title, Text } = Typography;

dayjs.locale('fr');

function LiveClock({ fontSize = 64 }) {
  const { token } = useToken();
  const [now, setNow] = React.useState(new Date());
  
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <>
      <span style={{ fontSize, color: token.colorWarning, fontWeight: 700 }}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span style={{ fontSize: fontSize / 2, color: token.colorTextSecondary, marginTop: 8 }}>
        {now.toLocaleDateString()}
      </span>
    </>
  );
}

const TOOL_CONFIG = {
  calendar: {
    icon: <CalendarOutlined style={{ fontSize: 38, color: '#277dfe' }} />,
    content: (
      <Calendar 
        fullscreen={false} 
        style={{ 
          borderRadius: 18, 
          minHeight: 180, 
          minWidth: 180, 
          pointerEvents: 'auto',
          background: 'inherit'
        }} 
      />
    ),
  },
  watch: {
    icon: <ClockCircleOutlined style={{ fontSize: 38, color: '#faad14' }} />,
    content: <LiveClock fontSize={32} />,
  },
  weather: {
    icon: <span role="img" aria-label="weather" style={{ fontSize: 38, color: '#1890ff' }}>☀️</span>,
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180 }}>
        <span style={{ fontSize: 48 }}>22°C</span>
        <span style={{ fontSize: 18, color: 'inherit' }}>Sunny</span>
        <span style={{ fontSize: 14, color: 'inherit', marginTop: 8 }}>Tunis</span>
      </div>
    ),
  },
  quote: {
    icon: <span role="img" aria-label="quote" style={{ fontSize: 38, color: '#722ed1' }}>💡</span>,
    content: (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 180, 
        padding: 12, 
        textAlign: 'center' 
      }}>
        <span style={{ fontSize: 16, fontStyle: 'italic', color: '#722ed1' }}>
          "Success is not the key to happiness. Happiness is the key to success."
        </span>
        <span style={{ fontSize: 13, color: 'inherit', marginTop: 8 }}>
          — Albert Schweitzer
        </span>
      </div>
    ),
  },
};

function ToolBox({ tool, expandedTool, setExpandedTool }) {
  const { token } = useToken();
  const isOpen = expandedTool === tool;
  
  return (
    <div
      style={{
        width: isOpen ? '100%' : 90,
        height: isOpen ? 180 : 90,
        borderRadius: token.borderRadiusLG,
        boxShadow: isOpen ? token.boxShadow : token.boxShadowSecondary,
        background: isOpen ? token.colorBgContainer : token.colorBgElevated,
        border: isOpen ? `1.5px solid ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isOpen ? 'default' : 'pointer',
        position: 'relative',
        transition: 'all 0.3s ease',
        zIndex: isOpen ? 2 : 1,
        opacity: isOpen || expandedTool === null ? 1 : 0.3,
        overflow: 'hidden'
      }}
      onClick={() => !isOpen && setExpandedTool(tool)}
    >
      {isOpen ? (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          position: 'relative', 
          padding: 6 
        }}>
          <div style={{ 
            position: 'absolute', 
            top: 6, 
            right: 8, 
            cursor: 'pointer', 
            fontSize: 16, 
            color: token.colorTextSecondary, 
            background: token.colorBgLayout, 
            borderRadius: 8, 
            padding: '1px 6px', 
            boxShadow: token.boxShadowTertiary 
          }} 
            onClick={e => { e.stopPropagation(); setExpandedTool(null); }}
          >
            ✕
          </div>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%', 
            fontSize: 12, 
            padding: 0 
          }}>
            <div style={{ fontSize: 12, width: '100%', textAlign: 'center' }}>
              {TOOL_CONFIG[tool].content}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%', 
          height: '100%' 
        }}>
          {TOOL_CONFIG[tool].icon}
          <span style={{ 
            fontSize: 13, 
            color: token.colorTextSecondary, 
            marginTop: 6, 
            fontWeight: 500, 
            letterSpacing: 0.5, 
            textTransform: 'capitalize' 
          }}>
            {tool}
          </span>
        </div>
      )}
    </div>
  );
}

const VacationComponent = () => {
  const { token: currentUserToken, user: currentUser } = useStateContext();
  const { token } = useToken();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [userData, setUserData] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [expandedTool, setExpandedTool] = useState(null);
  const [loading, setLoading] = useState(false);

  const cardStyles = {
    background: token.colorBgContainer,
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: `1px solid ${token.colorBorder}`,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const statCardStyles = {
    ...cardStyles,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 12px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/employees');
      
      // Response data is already unwrapped by axios interceptor
      const employees = Array.isArray(response.data) ? response.data : [];
      
      const usersWithVacations = employees.map(user => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        department: typeof user.department === 'string' 
          ? user.department 
          : (user.department?.name || user.department_id || 'N/A'),
        role: typeof user.role === 'string' 
          ? user.role 
          : (user.role?.name || user.role_id || 'N/A'),
        key: user.id,
        vacationRequests: Array.isArray(user.vacations) 
          ? user.vacations.map(v => ({
              id: v.id,
              start_date: v.start_date,
              end_date: v.end_date,
              reason: v.reason || 'N/A',
              status: v.status || 'Pending',
              key: v.id,
              user_id: user.id
            }))
          : []
      }));
      
      setUserData(usersWithVacations);
    } catch (error) {
      console.error('Error fetching user data:', error);
      message.error('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: <span style={{ color: token.colorPrimary, fontWeight: 600 }}>Nom de l'employé</span>,
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (text) => (
        <span style={{ color: token.colorPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserOutlined /> {text || 'N/A'}
        </span>
      )
    },
    {
      title: <span style={{ color: token.colorPrimary, fontWeight: 600 }}>Département</span>,
      dataIndex: 'department',
      key: 'department',
      align: 'center',
      render: (text, record) => {
        // Extract department name if it's an object
        const departmentName = typeof text === 'string' 
          ? text 
          : (text?.name || record.department?.name || record.department_id || 'N/A');
        return (
          <span style={{ color: token.colorSuccess, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <InfoCircleOutlined /> {departmentName}
          </span>
        );
      }
    },
    {
      title: <span style={{ color: token.colorPrimary, fontWeight: 600 }}>Email</span>,
      dataIndex: 'email',
      key: 'email',
      align: 'center',
      render: (text) => (
        <span style={{ color: '#722ed1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MailOutlined /> {text || 'N/A'}
        </span>
      )
    },
    {
      title: <span style={{ color: token.colorPrimary, fontWeight: 600 }}>Jour de congé</span>,
      key: 'dayOffRequests',
      align: 'center',
      render: (_, record) => (
        <Space>
          <div onClick={() => toggleExpand(record.key)} style={{ cursor: 'pointer' }}>
            {expandedRowKeys.includes(record.key) ? <DownCircleTwoTone /> : <UpCircleTwoTone />}
          </div>
          <span style={{ color: token.colorWarning, fontWeight: 600 }}>
            {record.vacationRequests?.length || 0} Demandes de congé
          </span>
        </Space>
      ),
    },
  ];

  const toggleExpand = (key) => {
    if (expandedRowKeys.includes(key)) {
      setExpandedRowKeys(expandedRowKeys.filter(k => k !== key));
    } else {
      setExpandedRowKeys([...expandedRowKeys, key]);
    }
  };

  const expandedRowRender = (record) => {
    const dayOffColumns = [
      {
        title: <span style={{ color: token.colorPrimary, fontWeight: 700 }}><CalendarTwoTone /> Date de début</span>,
        dataIndex: 'start_date',
        key: 'start_date',
        align: 'center',
        render: (text) => <span style={{ color: token.colorPrimary, fontWeight: 500 }}>
          {text ? dayjs(text).format('DD/MM/YYYY') : 'N/A'}
        </span>,
      },
      {
        title: <span style={{ color: token.colorPrimary, fontWeight: 700 }}><CalendarTwoTone /> Date de fin</span>,
        dataIndex: 'end_date',
        key: 'end_date',
        align: 'center',
        render: (text) => <span style={{ color: '#722ed1', fontWeight: 500 }}>
          {text ? dayjs(text).format('DD/MM/YYYY') : 'N/A'}
        </span>,
      },
      {
        title: <span style={{ color: token.colorPrimary, fontWeight: 700 }}><InfoCircleOutlined /> Raison</span>,
        dataIndex: 'reason',
        key: 'reason',
        align: 'center',
        render: (text) => <span style={{ color: token.colorText, fontWeight: 500 }}>{text || 'N/A'}</span>,
      },
      {
        title: <span style={{ color: token.colorText, fontWeight: 700 }}><InfoCircleOutlined /> Statut</span>,
        key: 'status',
        align: 'center',
        render: (_, request) => {
          let color = token.colorText;
          if (request.status === 'Approuvé') color = token.colorSuccess;
          else if (request.status === 'Refusé') color = token.colorError;
          
          const isCurrentUser = currentUser && currentUser.id === request.user_id;
          const canModify = !isCurrentUser && (request.status === 'En attente' || request.status === 'pending');
          
          return (
            <>
              <Tag 
                color={token.colorBgLayout} 
                style={{ 
                  color, 
                  fontWeight: 600, 
                  fontSize: 13, 
                  padding: '2px 12px', 
                  marginRight: 8 
                }}
              >
                {request.status || 'Pending'}
              </Tag>
              {canModify && (
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(request);
                  }}
                  style={{ fontWeight: 500 }}
                >
                  Modifier
                </Button>
              )}
              {isCurrentUser && (
                <span style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                  (Vos propres demandes)
                </span>
              )}
            </>
          );
        },
      },
    ];
  
    return (
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        <Table
          columns={dayOffColumns}
          dataSource={record.vacationRequests || []}
          size='small'
          pagination={false}
          rowKey="id"
          rowClassName={(_, idx) => idx % 2 === 0 ? 'vac-table-row-even' : 'vac-table-row-odd'}
          style={{ 
            borderRadius: token.borderRadiusLG, 
            boxShadow: token.boxShadowSecondary,
            margin: 0 
          }}
        />
        <style>{`
          .vac-table-row-even { background: ${token.colorFillAlter} !important; }
          .vac-table-row-odd { background: ${token.colorBgContainer} !important; }
          .ant-table-tbody > tr:hover > td { background: ${token.colorPrimaryBgHover} !important; }
        `}</style>
      </div>
    );
  };

  const openDrawer = (request) => {
    if (!request || !request.user_id) {
      message.error('Invalid request data');
      return;
    }

    const user = userData.find(user => user.id === request.user_id);
    if (!user) {
      message.error('User not found');
      return;
    }
    
    setSelectedVacation({
      id: request.id,
      start_date: request.start_date,
      end_date: request.end_date,
      status: request.status || 'Pending',
      reason: request.reason || 'N/A',
      user_id: request.user_id
    });
    
    setSelectedUser({
      id: user.id,
      name: user.name || 'N/A',
      email: user.email || 'N/A',
      department: typeof user.department === 'string' 
        ? user.department 
        : (user.department?.name || user.department_id || 'N/A'),
      role: typeof user.role === 'string' 
        ? user.role 
        : (user.role?.name || user.role_id || 'N/A')
    });
    
    form.setFieldsValue({
      status: request.status || 'Pending',
    });
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedVacation(null);
    setSelectedUser(null);
  };

  const onFinish = async (values) => {
    if (!selectedVacation?.id) {
      message.error('No vacation request selected');
      return;
    }

    if (currentUser && currentUser.id === selectedVacation.user_id) {
      message.error('You cannot update your own vacation requests');
      return;
    }

    try {
      await axios.put(
        `/vacations/${selectedVacation.id}`, 
        {
          ...selectedVacation,
          status: values.status
        }
      );

      message.success('Request updated successfully');
      closeDrawer();
      fetchUserData();
    } catch (error) {
      console.error('Update failed', error);
      message.error(error.response?.data?.message || 'Failed to update request');
    }
  };

  const totalUsers = userData.length;
  const allRequests = userData.flatMap(u => u.vacationRequests || []);
  const totalRequests = allRequests.length;
  const approved = allRequests.filter(r => r.status === 'Approuvé').length;
  const pending = allRequests.filter(r => r.status === 'En attente' || r.status === 'pending').length;
  const refused = allRequests.filter(r => r.status === 'Refusé').length;

  return (
    <div style={{ 
      padding: '32px', 
      background: token.colorBgLayout,
      minHeight: 'calc(100vh - 64px)',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    }}>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={6}>
            <Card style={{ 
              ...cardStyles,
              background: token.colorWarningBg,
              marginBottom: 16 
            }}>
              <Title level={5} style={{ marginBottom: 4, color: token.colorText }}>Legend</Title>
              <div style={{ color: token.colorText }}>
                <Tag color="success">Approuvé</Tag> Approved
              </div>
              <div style={{ color: token.colorText }}>
                <Tag color="warning">En attente</Tag> Pending
              </div>
              <div style={{ color: token.colorText }}>
                <Tag color="error">Refusé</Tag> Refused
              </div>
            </Card>
            <Card style={cardStyles}>
              <Title level={5} style={{ marginBottom: 4, color: token.colorText }}>Tip of the Day</Title>
              <Text type="secondary">Click on a user to expand and see their vacation requests.</Text>
            </Card>
          </Col>
          
          <Col xs={24} md={18}>
            <Card 
              title={
                <div style={{ 
                  width: '100%', 
                  textAlign: 'center', 
                  fontWeight: 700, 
                  fontSize: 18, 
                  letterSpacing: 1,
                  color: token.colorText
                }}>
                  Tools
                </div>
              } 
              style={cardStyles}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                gap: 16,
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                position: 'relative', 
                overflow: 'visible',
                padding: 8
              }}>
                {['calendar', 'watch', 'weather', 'quote'].map((tool) => (
                  <ToolBox
                    key={tool}
                    tool={tool}
                    expandedTool={expandedTool}
                    setExpandedTool={setExpandedTool}
                  />
                ))}
              </div>
            </Card>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: 16,
              marginBottom: 16
            }}>
              <Card style={statCardStyles}>
                <Statistic 
                  title={<span style={{ color: token.colorPrimary, fontWeight: 600, fontSize: 11 }}>Total Users</span>} 
                  value={totalUsers} 
                  valueStyle={{ color: token.colorPrimary, fontWeight: 700, fontSize: 16 }} 
                />
              </Card>
              <Card style={statCardStyles}>
                <Statistic 
                  title={<span style={{ color: token.colorSuccess, fontWeight: 600, fontSize: 11 }}>Approved</span>} 
                  value={approved} 
                  valueStyle={{ color: token.colorSuccess, fontWeight: 700, fontSize: 16 }} 
                />
              </Card>
              <Card style={statCardStyles}>
                <Statistic 
                  title={<span style={{ color: token.colorWarning, fontWeight: 600, fontSize: 11 }}>Total Requests</span>} 
                  value={totalRequests} 
                  valueStyle={{ color: token.colorWarning, fontWeight: 700, fontSize: 16 }} 
                />
              </Card>
              <Card style={statCardStyles}>
                <Statistic 
                  title={<span style={{ color: token.colorWarning, fontWeight: 600, fontSize: 11 }}>Pending</span>} 
                  value={pending} 
                  valueStyle={{ color: token.colorWarning, fontWeight: 700, fontSize: 16 }} 
                />
              </Card>
              <Card style={statCardStyles}>
                <Statistic 
                  title={<span style={{ color: token.colorError, fontWeight: 600, fontSize: 11 }}>Refused</span>} 
                  value={refused} 
                  valueStyle={{ color: token.colorError, fontWeight: 700, fontSize: 16 }} 
                />
              </Card>
            </div>

            <Card style={{ 
              ...cardStyles,
              marginBottom: 16
            }}>
              <h2 style={{ 
                color: token.colorPrimary, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 16 
              }}>
                <TeamOutlined /> Liste des Vacances
              </h2>
              
              <Table
                columns={columns}
                dataSource={userData}
                pagination={false}
                expandedRowRender={expandedRowRender}
                expandedRowKeys={expandedRowKeys}
                onExpand={(expanded, record) => toggleExpand(record.key)}
                style={{ 
                  ...cardStyles,
                  marginTop: 24
                }}
                scroll={{ x: true }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
      
      <Drawer
        title={
          <span style={{ 
            color: token.colorPrimary, 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8 
          }}>
            <UserOutlined /> Informations Utilisateur
          </span>
        }
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={Math.min(420, window.innerWidth * 0.9)}
        styles={{ 
          body: { 
            background: token.colorBgLayout, 
            borderRadius: token.borderRadiusLG 
          }, 
          header: { 
            background: token.colorPrimary, 
            color: token.colorWhite, 
            borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0` 
          } 
        }}
      >
        {selectedVacation && selectedUser ? (
          <>
            <Card style={cardStyles}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label={
                  <span style={{ color: token.colorPrimary, fontWeight: 600 }}>
                    <UserOutlined /> Nom
                  </span>
                }>
                  {selectedUser.name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label={
                  <span style={{ color: '#722ed1', fontWeight: 600 }}>
                    <MailOutlined /> Email
                  </span>
                }>
                  {selectedUser.email || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label={
                  <span style={{ color: token.colorSuccess, fontWeight: 600 }}>
                    <InfoCircleOutlined /> Département
                  </span>
                }>
                  {typeof selectedUser.department === 'string' 
                    ? selectedUser.department 
                    : (selectedUser.department?.name || 'N/A')}
                </Descriptions.Item>
                <Descriptions.Item label={
                  <span style={{ color: token.colorWarning, fontWeight: 600 }}>
                    <TeamOutlined /> Rôle
                  </span>
                }>
                  {typeof selectedUser.role === 'string' 
                    ? selectedUser.role 
                    : (selectedUser.role?.name || 'N/A')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Divider style={{ margin: '16px 0' }} />
            <Form form={form} onFinish={onFinish} layout="vertical">
              <Form.Item
                label={<span style={{ color: token.colorPrimary, fontWeight: 600 }}>Statut</span>}
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select size="large">
                  <Option value="Approuvé">Approuver</Option>
                  <Option value="Refusé">Refuser</Option>
                </Select>
              </Form.Item>
              <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  disabled={currentUser && currentUser.id === selectedVacation.user_id}
                  style={{ 
                    minWidth: 120, 
                    fontWeight: 600, 
                    fontSize: 16 
                  }}
                >
                  Mettre à jour
                </Button>
                {currentUser && currentUser.id === selectedVacation.user_id && (
                  <div style={{ color: token.colorError, marginTop: 8 }}>
                    Vous ne pouvez pas modifier vos propres demandes
                  </div>
                )}
              </Form.Item>
            </Form>
          </>
        ) : (
          <div>Loading user data...</div>
        )}
      </Drawer>
    </div>
  );
};

export default VacationComponent;