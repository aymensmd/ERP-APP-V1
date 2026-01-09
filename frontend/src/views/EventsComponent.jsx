import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Row, Col, Calendar, Modal, Form, Input, Select, DatePicker, notification, Radio, Drawer, Popconfirm, Statistic, Typography, Divider, Spin, ConfigProvider } from 'antd';
import { PlusOutlined, CalendarTwoTone, InfoCircleOutlined } from '@ant-design/icons';
import axios from '../axios';
import moment from 'moment';
import { useStateContext } from '../contexts/ContextProvider';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const EventsComponent = () => {
  const { theme } = useStateContext();
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventType, setEventType] = useState('présentiel');
  const [form] = Form.useForm();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Theme styles
  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      primary: '#1890ff',
      infoBg: '#f9fbff',
      statsBg: '#f6f9ff',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      border: '#303030',
      primary: '#177ddc',
      infoBg: '#111b26',
      statsBg: '#141d26',
    }
  };

  const colors = themeStyles[theme];

  const responsiveCardStyle = {
    flex: 1,
    marginBottom: '16px',
    minWidth: '300px',
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.2s ease'
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/events');
      // Response data is already unwrapped by axios interceptor
      const events = Array.isArray(response.data) ? response.data : [];
      setData(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Don't show error notification on 401 (handled by interceptor)
      if (error.response?.status !== 401) {
        notification.error({
          title: 'Error',
          description: 'Failed to fetch events!',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/employees');
      // Response data is already unwrapped by axios interceptor
      const employees = Array.isArray(response.data) ? response.data : [];
      setUsers(employees);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Don't show error notification on 401 (handled by interceptor)
      if (error.response?.status !== 401) {
        notification.error({
          title: 'Error',
          description: 'Failed to fetch users data!',
        });
      }
    }
  };

  const showCreateEventModal = (date) => {
    setSelectedDate(date ? moment(date) : null);
    setModalVisible(true);
  };

  const handleCreateEvent = async () => {
    try {
      const values = await form.validateFields();
      const response = await axios.post('/events', {
        title: values.title,
        description: values.description,
        start_date: selectedDate ? selectedDate.format('YYYY-MM-DD HH:mm:ss') : values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end_date: values.dateRange[1] ? values.dateRange[1].format('YYYY-MM-DD HH:mm:ss') : null,
        location: eventType === 'présentiel' ? values.location : 'en ligne',
        type: eventType,
        participants: selectedUsers
      });

      // Handle Laravel API resource response
      const newEvent = response.data.data || response.data;
      setData([...data, newEvent]);
      form.resetFields();
      setModalVisible(false);
      notification.success({
        title: 'Success',
        description: 'Event created successfully!',
      });
    } catch (error) {
      console.error('Error creating event:', error.response ? error.response.data : error.message);
      notification.error({
        title: 'Error',
        description: 'Failed to create event!',
      });
    }
  };

  const handleUpdateEvent = async () => {
    try {
      const values = await updateForm.validateFields();
      const response = await axios.put(`/events/${selectedEvent.id}`, {
        title: values.title,
        description: values.description,
        start_date: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end_date: values.dateRange[1] ? values.dateRange[1].format('YYYY-MM-DD HH:mm:ss') : null,
        location: eventType === 'présentiel' ? values.location : 'en ligne',
        type: eventType,
        participants: selectedUsers
      });
  
      // Handle Laravel API resource response
      const updatedEvent = response.data.data || response.data;
      setData(data.map(event => (event.id === selectedEvent.id ? updatedEvent : event)));
      updateForm.resetFields();
      setUpdateModalVisible(false);
  
      notification.success({
        title: 'Success',
        description: 'Event updated successfully!',
      });
    } catch (error) {
      console.error('Error updating event:', error.response ? error.response.data : error.message);
      notification.error({
        title: 'Error',
        description: 'Failed to update event!',
      });
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await axios.delete(`/events/${selectedEvent.id}`);
      setData(data.filter(event => event.id !== selectedEvent.id));
      setDrawerVisible(false);
      notification.success({
        title: 'Success',
        description: 'Event deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting event:', error.response ? error.response.data : error.message);
      notification.error({
        title: 'Error',
        description: 'Failed to delete event!',
      });
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setModalVisible(false);
  };

  const renderEventNotifications = () => {
    return data.map((item) => (
      <Card 
        key={item.id} 
        title={item.title} 
        extra={<CalendarTwoTone />} 
        onClick={() => openDrawer(item)} 
        hoverable
        style={{ 
          marginBottom: '16px',
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease'
        }}
      >
        <p style={{ color: colors.textPrimary }}>Date: {item.start_date}</p>
        <p style={{ color: colors.textPrimary }}>
          Users: {item.participants ? item.participants.map(user => user.name).join(', ') : 'No users assigned'}
        </p>
      </Card>
    ));
  };

  const openDrawer = (event) => {
    setSelectedEvent(event);
    setDrawerVisible(true);
  };

  const openUpdateModal = () => {
    if (selectedEvent) {
      setUpdateModalVisible(true);
      const { title, description, start_date, end_date, location, type, users } = selectedEvent;
      updateForm.setFieldsValue({
        title,
        description,
        dateRange: [moment(start_date), moment(end_date)],
        location,
        eventType: type,
        users: users ? users.map(user => user.id) : [],
      });
      setEventType(type);
      setSelectedUsers(users ? users.map(user => user.id) : []);
    }
  };

  const onPanelChange = (value, mode) => {
    console.log(value.format('YYYY-MM-DD'), mode);
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
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <Row gutter={[24, 24]}>
        <Col xs={24} md={6}>
          <Card style={{ ...responsiveCardStyle, minHeight: 180 }}>
            <Title level={4} style={{ marginBottom: 8, color: colors.textPrimary }}>Quick Stats</Title>
            <Divider style={{ margin: '8px 0', borderColor: colors.border }} />
            <Statistic 
              title="Total Events" 
              value={data.length} 
              valueStyle={{ color: colors.textPrimary }}
            />
            <Statistic 
              title="Upcoming" 
              value={data.filter(e => moment(e.start_date).isAfter(moment())).length} 
              style={{ marginTop: 12 }} 
              valueStyle={{ color: colors.textPrimary }}
            />
          </Card>
          <Card style={{ 
            ...responsiveCardStyle, 
            minHeight: 120, 
            marginTop: 12, 
            background: colors.infoBg 
          }}>
            <Title level={5} style={{ marginBottom: 4, color: colors.textPrimary }}>
              Tip of the Day <InfoCircleOutlined />
            </Title>
            <Text type="secondary">Click on a date to add an event or on an event to see details!</Text>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card style={responsiveCardStyle}>
            <Title level={4} style={{ marginBottom: 8, color: colors.textPrimary }}>Notifications</Title>
            <Divider style={{ margin: '8px 0', borderColor: colors.border }} />
            <div style={{ height: '400px', overflow: 'auto' }}>
              {loading ? <Spin /> : renderEventNotifications()}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={responsiveCardStyle}>
            <Space orientation="vertical" style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => showCreateEventModal(null)}
              >
                Add Event
              </Button>
            </Space>
            <div style={{ 
              width: 300, 
              border: `1px solid ${colors.border}`, 
              borderRadius: 8, 
              background: colors.cardBg, 
              padding: 8, 
              marginBottom: 16 
            }}>
              <Calendar 
                fullscreen={false} 
                onPanelChange={onPanelChange}
                style={{ background: colors.cardBg }}
              />
            </div>
          </Card>
        </Col>

        {/* Create Event Modal */}
        <Modal
          title="Create Event"
          open={modalVisible}
          onCancel={handleCancel}
          onOk={handleCreateEvent}
          styles={{
            body: {
              background: colors.cardBg,
              color: colors.textPrimary
            },
            header: {
              background: colors.cardBg,
              borderBottom: `1px solid ${colors.border}`
            }
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="title"
              label="Event Title"
              rules={[{ required: true, message: 'Please input the title of the event!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="Event Description"
              rules={[{ required: true, message: 'Please input the description of the event!' }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="dateRange"
              label="Event Dates"
              rules={[{ required: true, message: 'Please select the event dates!' }]}
            >
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                disabledDate={current => current && current < moment().startOf('day')}
                onChange={dates => setSelectedDate(dates[0])}
              />
            </Form.Item>
            {eventType === 'présentiel' && (
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please input the location of the event!' }]}
              >
                <Input />
              </Form.Item>
            )}
            <Form.Item name="users" label="Select Participants">
              <Select
                mode="multiple"
                placeholder="Select users"
                onChange={setSelectedUsers}
                allowClear
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="eventType" label="Event Type">
              <Radio.Group value={eventType} onChange={e => setEventType(e.target.value)}>
                <Radio value="présentiel">Présentiel</Radio>
                <Radio value="en ligne">En ligne</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>

        {/* Event Details Drawer */}
        <Drawer
          title="Event Details"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          size="large"
          styles={{
            body: {
              width: 500,
              background: colors.cardBg,
              color: colors.textPrimary
            },
            header: {
              background: colors.cardBg,
              borderBottom: `1px solid ${colors.border}`
            }
          }}
        >
          {selectedEvent && (
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <p><strong>Title:</strong> {selectedEvent.title}</p>
              <p><strong>Description:</strong> {selectedEvent.description}</p>
              <p><strong>Start Date:</strong> {selectedEvent.start_date}</p>
              <p><strong>End Date:</strong> {selectedEvent.end_date}</p>
              <p><strong>Location:</strong> {selectedEvent.location}</p>
              <p><strong>Type:</strong> {selectedEvent.type}</p>
              <p><strong>Participants:</strong> {selectedEvent.participants.map(user => user.name).join(', ')}</p>
              <Space>
                <Button type="primary" onClick={openUpdateModal}>Update</Button>
                <Popconfirm
                  title="Are you sure to delete this event?"
                  onConfirm={handleDeleteEvent}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="danger">Delete</Button>
                </Popconfirm>
              </Space>
            </Card>
          )}
        </Drawer>

        {/* Update Event Modal */}
        <Modal
          title="Update Event"
          open={updateModalVisible}
          onCancel={() => setUpdateModalVisible(false)}
          onOk={handleUpdateEvent}
          styles={{
            body: {
              background: colors.cardBg,
              color: colors.textPrimary
            },
            header: {
              background: colors.cardBg,
              borderBottom: `1px solid ${colors.border}`
            }
          }}
        >
          <Form form={updateForm} layout="vertical">
            <Form.Item
              name="title"
              label="Event Title"
              rules={[{ required: true, message: 'Please input the title of the event!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="Event Description"
              rules={[{ required: true, message: 'Please input the description of the event!' }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="dateRange"
              label="Event Dates"
              rules={[{ required: true, message: 'Please select the event dates!' }]}
            >
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                disabledDate={current => current && current < moment().startOf('day')}
              />
            </Form.Item>
            {eventType === 'présentiel' && (
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please input the location of the event!' }]}
              >
                <Input />
              </Form.Item>
            )}
            <Form.Item name="users" label="Select Participants">
              <Select
                mode="multiple"
                placeholder="Select users"
                onChange={setSelectedUsers}
                allowClear
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="eventType" label="Event Type">
              <Radio.Group value={eventType} onChange={e => setEventType(e.target.value)}>
                <Radio value="présentiel">Présentiel</Radio>
                <Radio value="en ligne">En ligne</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>
      </Row>
      </div>
    </ConfigProvider>
  );
};

export default EventsComponent;