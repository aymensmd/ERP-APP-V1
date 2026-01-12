import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  message,
  Popconfirm,
  DatePicker,
  InputNumber,
  Tabs,
  Typography,
  Avatar,
  Badge,
  Tooltip,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
  DollarOutlined,
  TrophyOutlined,
  MoreOutlined,
  EyeOutlined,
  ArrowsAltOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from '../axios';
import dayjs from 'dayjs';
import { useCompany } from '../contexts/CompanyContext';
import { useStateContext } from '../contexts/ContextProvider';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'pipeline'
  const [filters, setFilters] = useState({
    status: null,
    source: null,
    search: '',
  });
  const [form] = Form.useForm();
  const { currentCompany } = useCompany();
  const { theme } = useStateContext();

  useEffect(() => {
    if (currentCompany) {
      fetchLeads();
      fetchStats();
      fetchUsers();
    }
  }, [currentCompany, filters]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/employees');
      setUsers(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.source) params.append('source', filters.source);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/leads?${params.toString()}`);
      const leadData = response.data.data || response.data || [];
      setLeads(Array.isArray(leadData) ? leadData : []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      message.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/leads/statistics/overview');
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        status: values.status || 'new',
        source: values.source || 'other',
        score: values.score || 0,
      };

      if (editingLead) {
        await axios.put(`/leads/${editingLead.id}`, payload);
        message.success('Lead updated successfully');
      } else {
        await axios.post('/leads', payload);
        message.success('Lead created successfully');
      }

      setModalVisible(false);
      setEditingLead(null);
      form.resetFields();
      fetchLeads();
      fetchStats();
    } catch (error) {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to save lead';
      message.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/leads/${id}`);
      message.success('Lead deleted successfully');
      fetchLeads();
      fetchStats();
    } catch (error) {
      message.error('Failed to delete lead');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await axios.put(`/leads/${leadId}`, { status: newStatus });
      message.success('Lead status updated');
      fetchLeads();
      fetchStats();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const leadId = draggableId;
    const newStatus = destination.droppableId;

    // Optimistic UI update
    const updatedLeads = leads.map(l =>
      l.id.toString() === leadId ? { ...l, status: newStatus } : l
    );
    setLeads(updatedLeads);

    try {
      await axios.put(`/leads/${leadId}`, { status: newStatus });
      message.success(`Lead moved to ${newStatus}`);
      fetchLeads();
      fetchStats();
    } catch (error) {
      message.error('Failed to update lead status');
      fetchLeads(); // Rollback
    }
  };

  const getLeadsByStatus = (status) => {
    return leads.filter(lead => lead.status === status);
  };

  const pipelineStages = [
    { key: 'new', label: 'New', color: '#4f46e5', icon: <PlusOutlined /> },
    { key: 'contacted', label: 'Contacted', color: '#7c3aed', icon: <PhoneOutlined /> },
    { key: 'qualified', label: 'Qualified', color: '#10b981', icon: <TrophyOutlined /> },
    { key: 'converted', label: 'Converted', color: '#059669', icon: <BankOutlined /> },
    { key: 'lost', label: 'Lost', color: '#ef4444', icon: <CloseOutlined /> },
  ];

  const getStatusColor = (status) => {
    const colors = {
      new: 'default',
      contacted: 'processing',
      qualified: 'success',
      converted: 'success',
      lost: 'error',
    };
    return colors[status] || 'default';
  };

  const getSourceColor = (source) => {
    const colors = {
      website: 'blue',
      referral: 'green',
      social_media: 'purple',
      email: 'orange',
      phone: 'cyan',
      other: 'default',
    };
    return colors[source] || 'default';
  };

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#4f46e5' }}>
            {record.first_name?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.first_name} {record.last_name}</div>
            {record.email && (
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                <MailOutlined style={{ marginRight: 4 }} /> {record.email}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text) => text || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ borderRadius: 6 }}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Badge count={`${score}%`} overflowCount={100}
          style={{ backgroundColor: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }} />
      ),
    },
    {
      title: 'Estimated Value',
      dataIndex: 'estimated_value',
      key: 'estimated_value',
      render: (value) => value ? (
        <Text strong style={{ color: '#10b981' }}>
          ${parseFloat(value).toLocaleString()}
        </Text>
      ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingLead(record);
                form.setFieldsValue(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'qualified' && (
            <Tooltip title="Convert to Customer">
              <Button
                type="text"
                icon={<ArrowsAltOutlined />}
                style={{ color: '#10b981' }}
                onClick={async () => {
                  try {
                    await axios.post(`/leads/${record.id}/convert`);
                    message.success('Lead converted to customer successfully');
                    fetchLeads();
                  } catch (error) {
                    message.error('Failed to convert lead');
                  }
                }}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Delete this lead?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={2} className="text-gradient" style={{ marginBottom: 4 }}>Leads Pipeline</Title>
          <Text type="secondary">Manage your sales opportunities and track conversions.</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 10, background: 'var(--primary-gradient)', border: 'none' }}
          onClick={() => {
            setEditingLead(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          New Lead
        </Button>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary">Total Leads</Text>}
              value={stats.total || 0}
              prefix={<UserOutlined style={{ color: '#4f46e5' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary">New Leads</Text>}
              value={stats.new || 0}
              valueStyle={{ color: '#4f46e5' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary">Qualified</Text>}
              value={stats.qualified || 0}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary">Converted</Text>}
              value={stats.converted || 0}
              valueStyle={{ color: '#059669' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="glass-card" bodyStyle={{ padding: 24 }}>
        <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search leads..."
            prefix={<EyeOutlined style={{ color: '#bfbfbf' }} />}
            style={{ width: 300, borderRadius: 8 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="Source"
            allowClear
            style={{ width: 150 }}
            value={filters.source}
            onChange={(value) => setFilters({ ...filters, source: value })}
          >
            <Option value="website">Website</Option>
            <Option value="referral">Referral</Option>
            <Option value="social_media">Social Media</Option>
            <Option value="email">Email</Option>
            <Option value="phone">Phone</Option>
            <Option value="other">Other</Option>
          </Select>
          <div style={{ flex: 1 }} />
          <Tabs
            activeKey={viewMode}
            onChange={setViewMode}
            type="card"
            className="premium-tabs"
            items={[
              { key: 'table', label: 'Table' },
              { key: 'pipeline', label: 'Pipeline' },
            ]}
          />
        </div>

        {viewMode === 'table' ? (
          <Table
            dataSource={leads}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            className="premium-table"
          />
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{
              display: 'flex',
              gap: 20,
              overflowX: 'auto',
              paddingBottom: 16,
              minHeight: 500
            }}>
              {pipelineStages.map((stage) => {
                const stageLeads = getLeadsByStatus(stage.key);
                return (
                  <Droppable key={stage.key} droppableId={stage.key}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{
                          background: snapshot.isDraggingOver ? 'rgba(0,0,0,0.02)' : 'transparent',
                          transition: 'background 0.2s ease',
                          minWidth: 280,
                          flex: '0 0 280px',
                          borderRadius: 12,
                          padding: 4
                        }}
                      >
                        <div style={{
                          padding: '12px 16px',
                          marginBottom: 16,
                          borderRadius: 10,
                          background: `${stage.color}15`,
                          borderLeft: `4px solid ${stage.color}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Space>
                            <span style={{ color: stage.color }}>{stage.icon}</span>
                            <Text strong style={{ color: stage.color }}>{stage.label}</Text>
                          </Space>
                          <Badge count={stageLeads.length} style={{ backgroundColor: stage.color }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {stageLeads.map((lead, index) => (
                            <Draggable key={lead.id.toString()} draggableId={lead.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  size="small"
                                  className="glass-card"
                                  style={{
                                    ...provided.draggableProps.style,
                                    boxShadow: snapshot.isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'var(--shadow-sm)',
                                    cursor: 'grab',
                                    border: snapshot.isDragging ? `1px solid ${stage.color}` : undefined
                                  }}
                                  bodyStyle={{ padding: 12 }}
                                  onClick={() => {
                                    setEditingLead(lead);
                                    form.setFieldsValue(lead);
                                    setModalVisible(true);
                                  }}
                                >
                                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <Text strong>{lead.first_name} {lead.last_name}</Text>
                                      <div style={{ fontSize: 10, color: '#8c8c8c' }}>
                                        #{lead.id}
                                      </div>
                                    </div>
                                    {lead.company_name && (
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        <BankOutlined style={{ marginRight: 4 }} /> {lead.company_name}
                                      </Text>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                      <Badge
                                        status={lead.score >= 70 ? 'success' : lead.score >= 40 ? 'warning' : 'error'}
                                        text={`${lead.score}%`}
                                      />
                                      {lead.estimated_value && (
                                        <Text style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                                          ${parseFloat(lead.estimated_value).toLocaleString()}
                                        </Text>
                                      )}
                                    </div>
                                    {lead.assignedTo && (
                                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Avatar size={18} icon={<UserOutlined />} />
                                        <Text type="secondary" style={{ fontSize: 11 }}>{lead.assignedTo.name}</Text>
                                      </div>
                                    )}
                                  </Space>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </Card>

      <Modal
        title={editingLead ? 'Edit Lead' : 'Create Lead'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingLead(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
        className="premium-modal"
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="company_name" label="Company Name">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="job_title" label="Job Title">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="industry" label="Industry">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select>
                  {pipelineStages.map(s => <Option key={s.key} value={s.key}>{s.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="source" label="Source">
                <Select>
                  <Option value="website">Website</Option>
                  <Option value="referral">Referral</Option>
                  <Option value="social_media">Social Media</Option>
                  <Option value="email">Email</Option>
                  <Option value="phone">Phone</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="score" label="Lead Score (0-100)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="estimated_value" label="Estimated Value">
                <InputNumber min={0} style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assigned_to" label="Assign To">
                <Select
                  showSearch
                  placeholder="Select user"
                  optionFilterProp="children"
                  allowClear
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20, marginTop: 20, textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: 'var(--primary-gradient)', border: 'none' }}>
                {editingLead ? 'Update' : 'Create'} Lead
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <style>{`
        .premium-tabs .ant-tabs-nav-list { background: rgba(0,0,0,0.02); padding: 4px; border-radius: 8px; }
        .premium-tabs .ant-tabs-tab { border: none !important; background: transparent !important; margin: 0 !important; }
        .premium-tabs .ant-tabs-tab-active { background: #fff !important; border-radius: 6px !important; box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important; }
        .premium-table .ant-table { background: transparent !important; }
        .premium-table .ant-table-thead > tr > th { background: rgba(0,0,0,0.02) !important; color: #8c8c8c !important; font-weight: 600 !important; font-size: 12px !important; text-transform: uppercase !important; border-bottom: 2px solid #f0f0f0 !important; }
        .premium-table .ant-table-row:hover > td { background: rgba(79, 70, 229, 0.02) !important; }
      `}</style>
    </div>
  );
};

export default Leads;

