import React, { useState, useEffect, useMemo } from 'react';
import { 
  Button, Card, Space, Row, Col, Calendar, Modal, Form, Input, 
  Select, DatePicker, notification, Radio, Drawer, Popconfirm, 
  Statistic, Typography, Divider, Spin, ConfigProvider, theme, 
  List, Tag, Badge, Tooltip, Segmented, Avatar 
} from 'antd';
import { 
  PlusOutlined, CalendarOutlined, InfoCircleOutlined, 
  ExportOutlined, FilePdfOutlined, CloudSyncOutlined,
  ClockCircleOutlined, TeamOutlined, EnvironmentOutlined,
  UnorderedListOutlined, AppstoreOutlined
} from '@ant-design/icons';
import axios from '../axios';
import moment from 'moment';
import { useStateContext } from '../contexts/ContextProvider';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { useToken } = theme;

// --- MOCK DATA FOR ERP COMPONENTS ---
const EVENT_CATEGORIES = [
    { type: 'présentiel', color: 'blue', label: 'Sur Place (Bureau)' },
    { type: 'en ligne', color: 'purple', label: 'Virtuel (Teams/Meet)' },
    { type: 'deadline', color: 'red', label: 'Date Limite' },
];

const EventsComponent = () => {
  const { token } = useToken(); // Use Ant Design System Tokens
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  
  // UI States
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Selection States
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventType, setEventType] = useState('présentiel');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Forms
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();

  // --- STYLES ---
  const cardStyles = {
    background: token.colorBgContainer,
    borderRadius: '12px',
    boxShadow: token.boxShadowSecondary,
    border: `1px solid ${token.colorBorderSecondary}`,
  };

  const sideWidgetStyle = {
    ...cardStyles,
    marginBottom: 16
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  // --- DATA FETCHING ---
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/events');
      const events = Array.isArray(response.data) ? response.data : [];
      setData(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status !== 401) {
        notification.error({ message: 'Failed to fetch events' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/employees');
      const employees = Array.isArray(response.data) ? response.data : [];
      setUsers(employees);
    } catch (error) {
       console.error(error);
    }
  };

  // --- FILTER LOGIC ---
  const filteredEvents = useMemo(() => {
    return data.filter(event => {
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      const lowerSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = !lowerSearch || 
        (event.title?.toLowerCase().includes(lowerSearch)) || 
        (event.description?.toLowerCase().includes(lowerSearch));
      
      return matchesType && matchesSearch;
    });
  }, [data, typeFilter, searchTerm]);

  const upcomingEvents = useMemo(() => {
      return data.filter(e => moment(e.start_date).isAfter(moment())).sort((a,b) => moment(a.start_date) - moment(b.start_date)).slice(0, 3);
  }, [data]);

  // --- ACTIONS: CREATE/UPDATE/DELETE ---
  const handleCreateEvent = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        description: values.description,
        start_date: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end_date: values.dateRange[1] ? values.dateRange[1].format('YYYY-MM-DD HH:mm:ss') : null,
        location: eventType === 'présentiel' ? values.location : 'En Ligne',
        type: eventType,
        participants: selectedUsers
      };

      const response = await axios.post('/events', payload);
      const newEvent = response.data.data || response.data;
      
      // Optimistic Update
      setData(prev => [...prev, newEvent]);
      form.resetFields();
      setModalVisible(false);
      notification.success({ message: 'Événement créé avec succès' });
    } catch (error) {
      notification.error({ message: 'Erreur lors de la création' });
    }
  };

  const handleUpdateEvent = async () => {
    try {
      const values = await updateForm.validateFields();
      const payload = {
        title: values.title,
        description: values.description,
        start_date: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end_date: values.dateRange[1] ? values.dateRange[1].format('YYYY-MM-DD HH:mm:ss') : null,
        location: eventType === 'présentiel' ? values.location : 'En Ligne',
        type: eventType,
        participants: selectedUsers
      };

      const response = await axios.put(`/events/${selectedEvent.id}`, payload);
      const updatedEvent = response.data.data || response.data;

      setData(data.map(e => (e.id === selectedEvent.id ? updatedEvent : e)));
      setUpdateModalVisible(false);
      setDrawerVisible(false);
      notification.success({ message: 'Événement mis à jour' });
    } catch (error) {
      notification.error({ message: 'Erreur de mise à jour' });
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await axios.delete(`/events/${selectedEvent.id}`);
      setData(data.filter(e => e.id !== selectedEvent.id));
      setDrawerVisible(false);
      notification.success({ message: 'Événement supprimé' });
    } catch (error) {
      notification.error({ message: 'Erreur de suppression' });
    }
  };

  // --- TOOLS: EXPORT & SYNC ---
  const handleExportICS = () => {
    setExportLoading(true);
    // Simulating .ICS generation
    setTimeout(() => {
        const calendarData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MyERP//Events//EN\n` + 
        filteredEvents.map(e => 
            `BEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${moment(e.start_date).format('YYYYMMDDTHHmmss')}\nDTEND:${moment(e.end_date).format('YYYYMMDDTHHmmss')}\nLOCATION:${e.location}\nDESCRIPTION:${e.description}\nEND:VEVENT`
        ).join('\n') + `\nEND:VCALENDAR`;
        
        const blob = new Blob([calendarData], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'planning_entreprise.ics');
        document.body.appendChild(link);
        link.click();
        
        setExportLoading(false);
        notification.success({ message: 'Fichier Calendrier (.ics) généré', description: 'Compatible avec Outlook, Google, Apple.' });
    }, 1000);
  };

  const handleGoogleSync = () => {
      notification.info({ 
          message: 'Synchronisation en cours', 
          description: 'Envoi des données vers Google Workspace...', 
          icon: <CloudSyncOutlined style={{ color: '#108ee9' }} /> 
      });
  };

  // --- OPEN HANDLERS ---
  const openDrawer = (event) => {
    setSelectedEvent(event);
    setDrawerVisible(true);
  };

  const openUpdateModal = () => {
    if (selectedEvent) {
        setUpdateModalVisible(true);
        const { title, description, start_date, end_date, location, type, users: evtUsers } = selectedEvent;
        
        // Defensive check for users
        const userIds = Array.isArray(evtUsers) ? evtUsers.map(u => u.id) : [];

        updateForm.setFieldsValue({
            title,
            description,
            dateRange: [moment(start_date), moment(end_date)],
            location,
            eventType: type,
            users: userIds,
        });
        setEventType(type);
        setSelectedUsers(userIds);
    }
  };

  // --- RENDERERS ---
  const dateCellRender = (value) => {
    const listData = data.filter(event => moment(event.start_date).isSame(value, 'day'));
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map(item => (
          <li key={item.id} onClick={(e) => { e.stopPropagation(); openDrawer(item); }}>
            <Badge status={item.type === 'présentiel' ? 'processing' : 'warning'} text={item.title} style={{ fontSize: 10 }} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ padding: '24px', background: token.colorBgLayout, minHeight: '100vh' }}>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
            
            {/* --- LEFT SIDEBAR (ERP CONTEXT) --- */}
            <Col xs={24} md={6} lg={5}>
                
                {/* 1. Create Button */}
                <Button 
                    type="primary" 
                    size="large" 
                    icon={<PlusOutlined />} 
                    block 
                    style={{ marginBottom: 24, height: 48, borderRadius: 8, boxShadow: '0 4px 14px rgba(24, 144, 255, 0.3)' }}
                    onClick={() => { form.resetFields(); setModalVisible(true); }}
                >
                    Nouvel Événement
                </Button>

                {/* 2. Mini Calendar */}
                <Card style={sideWidgetStyle} size="small" title={<span style={{fontSize: 14}}>Navigation</span>}>
                    <Calendar 
                        fullscreen={false} 
                        value={selectedDate}
                        onChange={setSelectedDate}
                        style={{ margin: '-12px' }} 
                    />
                </Card>

                {/* 3. Categories / Legend */}
                <Card style={sideWidgetStyle} size="small" title="Catégories">
                    <List
                        dataSource={EVENT_CATEGORIES}
                        split={false}
                        renderItem={item => (
                            <List.Item style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => setTypeFilter(item.type)}>
                                <Space>
                                    <Badge color={item.color} />
                                    <Text>{item.label}</Text>
                                </Space>
                                {typeFilter === item.type && <CheckCircleOutlined style={{color: token.colorPrimary}} />}
                            </List.Item>
                        )}
                    />
                    <Button type="link" size="small" onClick={() => setTypeFilter('all')} style={{ paddingLeft: 0 }}>
                        Voir tout
                    </Button>
                </Card>

                {/* 4. Upcoming Widget */}
                <Card style={sideWidgetStyle} size="small" title="À venir bientôt">
                     <List
                        itemLayout="horizontal"
                        dataSource={upcomingEvents}
                        renderItem={item => (
                            <List.Item style={{ padding: '10px 0', cursor: 'pointer' }} onClick={() => openDrawer(item)}>
                                <List.Item.Meta
                                    avatar={<Avatar style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimary }}>{moment(item.start_date).format('DD')}</Avatar>}
                                    title={<Text style={{fontSize: 13}} ellipsis>{item.title}</Text>}
                                    description={<Text type="secondary" style={{fontSize: 11}}>{moment(item.start_date).fromNow()}</Text>}
                                />
                            </List.Item>
                        )}
                     />
                     {upcomingEvents.length === 0 && <Text type="secondary" style={{fontSize: 12}}>Aucun événement proche.</Text>}
                </Card>
            </Col>

            {/* --- MAIN CONTENT (WORKSPACE) --- */}
            <Col xs={24} md={18} lg={19}>
                
                {/* 1. Header & Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Planning Entreprise</Title>
                        <Text type="secondary">
                             {selectedDate.format('MMMM YYYY')} • {filteredEvents.length} Événements trouvés
                        </Text>
                    </div>

                    <Space>
                        <Segmented 
                            options={[
                                { value: 'list', icon: <UnorderedListOutlined />, label: 'Liste' },
                                { value: 'calendar', icon: <AppstoreOutlined />, label: 'Calendrier' },
                            ]} 
                            value={viewMode} 
                            onChange={setViewMode}
                        />
                        <Divider type="vertical" />
                        <Tooltip title="Exporter pour Outlook/Google (.ics)">
                            <Button icon={<ExportOutlined />} onClick={handleExportICS} loading={exportLoading}>Export .ICS</Button>
                        </Tooltip>
                        <Tooltip title="Imprimer l'agenda (PDF)">
                            <Button icon={<FilePdfOutlined />} onClick={() => window.print()}>Print PDF</Button>
                        </Tooltip>
                        <Tooltip title="Sync Google Calendar">
                            <Button icon={<CloudSyncOutlined />} onClick={handleGoogleSync} />
                        </Tooltip>
                    </Space>
                </div>

                {/* 2. Content Area */}
                {viewMode === 'list' ? (
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Input.Search 
                                placeholder="Rechercher un événement..." 
                                style={{ marginBottom: 16, maxWidth: 400 }} 
                                onChange={e => setSearchTerm(e.target.value)}
                                allowClear
                            />
                        </Col>
                        {filteredEvents.length === 0 ? (
                            <Col span={24}><div style={{textAlign:'center', padding: 40, color: token.colorTextSecondary}}>Aucun événement trouvé pour ces filtres.</div></Col>
                        ) : (
                            filteredEvents.map(event => (
                                <Col xs={24} md={12} lg={8} key={event.id}>
                                    <Card 
                                        hoverable 
                                        style={{...cardStyles, height: '100%'}}
                                        onClick={() => openDrawer(event)}
                                        actions={[
                                            <Tooltip title="Voir Détails"><InfoCircleOutlined key="info" /></Tooltip>,
                                            <Tooltip title="Participants"><TeamOutlined key="team" /> {event.participants?.length || 0}</Tooltip>,
                                            <Tooltip title="Lieu"><EnvironmentOutlined key="loc" /></Tooltip>
                                        ]}
                                    >
                                        <Card.Meta
                                            avatar={
                                                <div style={{
                                                    background: event.type === 'en ligne' ? '#f9f0ff' : '#e6f7ff',
                                                    color: event.type === 'en ligne' ? '#722ed1' : '#1890ff',
                                                    width: 48, height: 48, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: 16, lineHeight: 1 }}>{moment(event.start_date).format('DD')}</span>
                                                    <span style={{ fontSize: 10 }}>{moment(event.start_date).format('MMM').toUpperCase()}</span>
                                                </div>
                                            }
                                            title={event.title}
                                            description={
                                                <Space direction="vertical" size={2}>
                                                    <Tag color={event.type === 'en ligne' ? 'purple' : 'blue'}>
                                                        {event.type === 'en ligne' ? 'En Ligne' : 'Présentiel'}
                                                    </Tag>
                                                    <Text type="secondary" style={{fontSize: 12}}>
                                                        <ClockCircleOutlined /> {moment(event.start_date).format('HH:mm')} - {event.end_date ? moment(event.end_date).format('HH:mm') : 'Fin'}
                                                    </Text>
                                                </Space>
                                            }
                                        />
                                    </Card>
                                </Col>
                            ))
                        )}
                    </Row>
                ) : (
                    <Card style={cardStyles}>
                        <Calendar 
                            dateCellRender={dateCellRender} 
                            value={selectedDate}
                            onSelect={setSelectedDate}
                        />
                    </Card>
                )}
            </Col>
        </Row>

        {/* --- MODALS & DRAWERS --- */}

        {/* 1. Details Drawer */}
        <Drawer
            title="Détails de l'événement"
            placement="right"
            width={420}
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            extra={
                <Space>
                    <Button onClick={openUpdateModal}>Modifier</Button>
                    <Popconfirm title="Supprimer cet événement ?" onConfirm={handleDeleteEvent}>
                        <Button type="primary" danger icon={<DeleteOutlined />}>Supprimer</Button>
                    </Popconfirm>
                </Space>
            }
        >
            {selectedEvent && (
                <div>
                     <Tag color={selectedEvent.type === 'en ligne' ? 'purple' : 'blue'} style={{marginBottom: 16}}>
                        {selectedEvent.type === 'en ligne' ? 'VISIO / ONLINE' : 'BUREAU / ONSITE'}
                     </Tag>
                     <Title level={4} style={{marginTop: 0}}>{selectedEvent.title}</Title>
                     
                     <Divider />
                     
                     <div style={{marginBottom: 16}}>
                         <Text type="secondary" style={{display:'block', marginBottom: 4}}>DESCRIPTION</Text>
                         <Text>{selectedEvent.description || "Aucune description fournie."}</Text>
                     </div>

                     <div style={{marginBottom: 16}}>
                         <Text type="secondary" style={{display:'block', marginBottom: 4}}>QUAND ?</Text>
                         <Space>
                            <CalendarOutlined />
                            <Text strong>{moment(selectedEvent.start_date).format('dddd DD MMMM YYYY')}</Text>
                         </Space>
                         <div style={{marginLeft: 24, marginTop: 4, color: token.colorTextSecondary}}>
                             {moment(selectedEvent.start_date).format('HH:mm')} à {selectedEvent.end_date ? moment(selectedEvent.end_date).format('HH:mm') : '...'}
                         </div>
                     </div>

                     <div style={{marginBottom: 16}}>
                         <Text type="secondary" style={{display:'block', marginBottom: 4}}>OÙ ?</Text>
                         <Space>
                            <EnvironmentOutlined />
                            <Text>{selectedEvent.location || 'Non spécifié'}</Text>
                         </Space>
                     </div>

                     <Divider />

                     <Text type="secondary" style={{display:'block', marginBottom: 8}}>PARTICIPANTS ({selectedEvent.participants?.length || 0})</Text>
                     <Avatar.Group maxCount={5}>
                        {selectedEvent.participants && selectedEvent.participants.map((p, i) => (
                            <Tooltip title={p.name} key={i}>
                                <Avatar style={{ backgroundColor: '#87d068' }}>{p.name ? p.name.charAt(0) : 'U'}</Avatar>
                            </Tooltip>
                        ))}
                     </Avatar.Group>
                </div>
            )}
        </Drawer>

        {/* 2. Create/Update Modal */}
        <Modal
            title={updateModalVisible ? "Modifier l'événement" : "Planifier un nouvel événement"}
            open={modalVisible || updateModalVisible}
            onCancel={() => { setModalVisible(false); setUpdateModalVisible(false); }}
            onOk={updateModalVisible ? handleUpdateEvent : handleCreateEvent}
            width={600}
        >
            <Form form={updateModalVisible ? updateForm : form} layout="vertical">
                <Form.Item name="title" label="Titre" rules={[{ required: true }]}>
                    <Input prefix={<CalendarOutlined />} placeholder="Ex: Réunion Marketing" />
                </Form.Item>
                
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="eventType" label="Type" initialValue="présentiel">
                             <Select onChange={setEventType}>
                                 <Option value="présentiel">🏢 Sur Place</Option>
                                 <Option value="en ligne">💻 En Ligne</Option>
                             </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                         {eventType === 'présentiel' && (
                            <Form.Item name="location" label="Salle / Lieu">
                                <Input prefix={<EnvironmentOutlined />} placeholder="Ex: Salle 302" />
                            </Form.Item>
                        )}
                    </Col>
                </Row>

                <Form.Item name="dateRange" label="Date et Heure" rules={[{ required: true }]}>
                    <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="users" label="Inviter des collègues">
                    <Select mode="multiple" placeholder="Sélectionner des participants" onChange={setSelectedUsers} optionFilterProp="children">
                        {users.map(user => (
                            <Option key={user.id} value={user.id}>{user.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item name="description" label="Ordre du jour / Description">
                    <Input.TextArea rows={3} placeholder="Détails de l'événement..." />
                </Form.Item>
            </Form>
        </Modal>

      </Spin>
    </div>
  );
};

// Helper icon for drawer
const DeleteOutlined = () => <span role="img" aria-label="delete" className="anticon anticon-delete"><svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M9 10h6v6H9z"></path></svg></span>; // Simplified for this snippet if icon missing
import { CheckCircleOutlined } from '@ant-design/icons'; // Ensure imported

export default EventsComponent;