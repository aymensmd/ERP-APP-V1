import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  message,
  Popconfirm,
  Empty,
  Spin,
} from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const CommunicationHistory = ({ communicableType, communicableId }) => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingComm, setEditingComm] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (communicableId) {
      fetchCommunications();
    }
  }, [communicableId]);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/communications', {
        params: {
          communicable_type: communicableType,
          communicable_id: communicableId,
        },
      });
      setCommunications(Array.isArray(response.data.data) ? response.data.data : (response.data.data || []));
    } catch (error) {
      console.error('Error fetching communications:', error);
      message.error('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        communicable_type: communicableType,
        communicable_id: communicableId,
        ...values,
        scheduled_at: values.scheduled_at ? values.scheduled_at.format('YYYY-MM-DD HH:mm:ss') : null,
      };

      if (editingComm) {
        await axios.put(`/communications/${editingComm.id}`, payload);
        message.success('Communication updated successfully');
      } else {
        await axios.post('/communications', payload);
        message.success('Communication logged successfully');
      }

      setModalVisible(false);
      setEditingComm(null);
      form.resetFields();
      fetchCommunications();
    } catch (error) {
      message.error('Failed to save communication');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/communications/${id}`);
      message.success('Communication deleted successfully');
      fetchCommunications();
    } catch (error) {
      message.error('Failed to delete communication');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      call: <PhoneOutlined />,
      email: <MailOutlined />,
      meeting: <CalendarOutlined />,
      note: <FileTextOutlined />,
      sms: <MailOutlined />,
      whatsapp: <MailOutlined />,
      other: <FileTextOutlined />,
    };
    return icons[type] || <FileTextOutlined />;
  };

  const getTypeColor = (type) => {
    const colors = {
      call: 'blue',
      email: 'green',
      meeting: 'orange',
      note: 'default',
      sms: 'cyan',
      whatsapp: 'green',
      other: 'default',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return <Spin />;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingComm(null);
            form.resetFields();
            form.setFieldsValue({ type: 'note', direction: 'outbound' });
            setModalVisible(true);
          }}
        >
          Log Communication
        </Button>
      </div>

      {communications.length === 0 ? (
        <Empty description="No communications yet" />
      ) : (
        <List
          dataSource={communications}
          renderItem={(comm) => (
            <List.Item>
              <Card style={{ width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Avatar icon={getTypeIcon(comm.type)} style={{ backgroundColor: getTypeColor(comm.type) }} />
                      <Tag color={getTypeColor(comm.type)}>{comm.type.toUpperCase()}</Tag>
                      <Tag color={comm.direction === 'inbound' ? 'blue' : 'green'}>
                        {comm.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                      </Tag>
                      {comm.status === 'scheduled' && (
                        <Tag color="orange">Scheduled</Tag>
                      )}
                    </Space>
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingComm(comm);
                          form.setFieldsValue({
                            ...comm,
                            scheduled_at: comm.scheduled_at ? dayjs(comm.scheduled_at) : null,
                          });
                          setModalVisible(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Popconfirm
                        title="Delete this communication?"
                        onConfirm={() => handleDelete(comm.id)}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                          Delete
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Space>
                  
                  {comm.subject && (
                    <div>
                      <Text strong>Subject:</Text> {comm.subject}
                    </div>
                  )}
                  
                  <div>
                    <Text>{comm.content}</Text>
                  </div>
                  
                  <Space>
                    {comm.user && (
                      <Space>
                        <UserOutlined />
                        <Text type="secondary">{comm.user.name}</Text>
                      </Space>
                    )}
                    <Text type="secondary">
                      {dayjs(comm.created_at).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    {comm.duration_minutes && (
                      <Text type="secondary">
                        Duration: {comm.duration_minutes} minutes
                      </Text>
                    )}
                  </Space>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Communication Modal */}
      <Modal
        title={editingComm ? 'Edit Communication' : 'Log Communication'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingComm(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Option value="call">Call</Option>
              <Option value="email">Email</Option>
              <Option value="meeting">Meeting</Option>
              <Option value="note">Note</Option>
              <Option value="sms">SMS</Option>
              <Option value="whatsapp">WhatsApp</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="direction" label="Direction">
            <Select>
              <Option value="inbound">Inbound</Option>
              <Option value="outbound">Outbound</Option>
            </Select>
          </Form.Item>
          <Form.Item name="subject" label="Subject">
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Content" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="scheduled_at" label="Scheduled At">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="duration_minutes" label="Duration (minutes)">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingComm ? 'Update' : 'Log'} Communication
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommunicationHistory;



