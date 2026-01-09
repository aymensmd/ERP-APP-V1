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
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';
import { useCompany } from '../contexts/CompanyContext';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

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
      setLeads(Array.isArray(response.data.data) ? response.data.data : (response.data.data || []));
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
      // Build payload with only defined values
      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email || null,
        phone: values.phone || null,
        company_name: values.company_name || null,
        job_title: values.job_title || null,
        industry: values.industry || null,
        status: values.status || 'new',
        source: values.source || 'other',
        score: values.score || 0,
        estimated_value: values.estimated_value || null,
        notes: values.notes || null,
        assigned_to: values.assigned_to || null,
      };
      
      // Remove null values
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });

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
      console.error('Lead save error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to save lead';
      message.error(errorMessage);
      if (error.response?.data?.messages) {
        // Show validation errors
        Object.values(error.response.data.messages).flat().forEach(msg => {
          message.error(msg);
        });
      }
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

  const getLeadsByStatus = (status) => {
    return leads.filter(lead => lead.status === status);
  };

  const pipelineStages = [
    { key: 'new', label: 'New', color: '#1890ff', count: getLeadsByStatus('new').length },
    { key: 'contacted', label: 'Contacted', color: '#722ed1', count: getLeadsByStatus('contacted').length },
    { key: 'qualified', label: 'Qualified', color: '#13c2c2', count: getLeadsByStatus('qualified').length },
    { key: 'converted', label: 'Converted', color: '#52c41a', count: getLeadsByStatus('converted').length },
    { key: 'lost', label: 'Lost', color: '#ff4d4f', count: getLeadsByStatus('lost').length },
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
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
            {record.first_name?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.first_name} {record.last_name}</div>
            {record.email && (
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                <MailOutlined /> {record.email}
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
      render: (text) => text ? (
        <Space>
          <BankOutlined />
          {text}
        </Space>
      ) : '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text ? (
        <Space>
          <PhoneOutlined />
          {text}
        </Space>
      ) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source) => (
        <Tag color={getSourceColor(source)}>{source.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Tag color={score >= 70 ? 'success' : score >= 40 ? 'warning' : 'default'}>
          {score}/100
        </Tag>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'estimated_value',
      key: 'estimated_value',
      render: (value) => value ? (
        <Space>
          <DollarOutlined />
          {value.toLocaleString()}
        </Space>
      ) : '-',
    },
    {
      title: 'Assigned To',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (_, record) => record.assignedTo ? record.assignedTo.name : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingLead(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
          {record.status === 'qualified' && (
            <Button
              type="link"
              onClick={async () => {
                try {
                  await axios.post(`/leads/${record.id}/convert`);
                  message.success('Lead converted to customer successfully');
                  fetchLeads();
                } catch (error) {
                  message.error('Failed to convert lead');
                }
              }}
            >
              Convert to Customer
            </Button>
          )}
          <Popconfirm
            title="Delete this lead?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Statistics */}
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Leads"
                value={stats.total || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="New Leads"
                value={stats.new || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Qualified"
                value={stats.qualified || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Converted"
                value={stats.converted || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Actions */}
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
            <Space>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: 150 }}
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Option value="new">New</Option>
                <Option value="contacted">Contacted</Option>
                <Option value="qualified">Qualified</Option>
                <Option value="converted">Converted</Option>
                <Option value="lost">Lost</Option>
              </Select>
              <Select
                placeholder="Filter by Source"
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
              <Input
                placeholder="Search leads..."
                style={{ width: 200 }}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                allowClear
              />
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingLead(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Add Lead
            </Button>
          </Space>

          <Tabs
            activeKey={viewMode}
            onChange={setViewMode}
            items={[
              {
                key: 'table',
                label: 'Table View',
                children: (
                  <Table
                    dataSource={leads}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                  />
                ),
              },
              {
                key: 'pipeline',
                label: 'Pipeline View',
                children: (
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    overflowX: 'auto',
                    paddingBottom: '16px',
                    minHeight: '600px'
                  }}>
                    {pipelineStages.map((stage) => {
                      const stageLeads = getLeadsByStatus(stage.key);
                      return (
                        <Card
                          key={stage.key}
                          title={
                            <Space>
                              <Badge count={stage.count} showZero style={{ backgroundColor: stage.color }} />
                              <Text strong>{stage.label}</Text>
                            </Space>
                          }
                          style={{
                            minWidth: '300px',
                            flex: '0 0 300px',
                            borderTop: `4px solid ${stage.color}`,
                          }}
                          bodyStyle={{ 
                            padding: '12px',
                            maxHeight: '600px',
                            overflowY: 'auto'
                          }}
                        >
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            {stageLeads.length === 0 ? (
                              <div style={{ 
                                textAlign: 'center', 
                                padding: '20px',
                                color: '#999',
                                fontSize: '14px'
                              }}>
                                No leads in this stage
                              </div>
                            ) : (
                              stageLeads.map((lead) => {
                                const menuItems = pipelineStages
                                  .filter(s => s.key !== lead.status)
                                  .map(s => ({
                                    key: s.key,
                                    label: s.label,
                                    onClick: () => handleStatusChange(lead.id, s.key),
                                  }));

                                return (
                                  <Card
                                    key={lead.id}
                                    size="small"
                                    style={{
                                      cursor: 'pointer',
                                      marginBottom: '8px',
                                      backgroundColor: '#fafafa',
                                    }}
                                    hoverable
                                    onClick={() => {
                                      setEditingLead(lead);
                                      form.setFieldsValue(lead);
                                      setModalVisible(true);
                                    }}
                                    actions={[
                                      <Dropdown
                                        key="more"
                                        menu={{ items: menuItems }}
                                        trigger={['click']}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreOutlined />
                                      </Dropdown>,
                                    ]}
                                  >
                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Text strong>
                                          {lead.first_name} {lead.last_name}
                                        </Text>
                                        <Tag color={getStatusColor(lead.status)} style={{ margin: 0 }}>
                                          {lead.status}
                                        </Tag>
                                      </Space>
                                      {lead.company_name && (
                                        <Space>
                                          <BankOutlined />
                                          <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {lead.company_name}
                                          </Text>
                                        </Space>
                                      )}
                                      {lead.email && (
                                        <Space>
                                          <MailOutlined />
                                          <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {lead.email}
                                          </Text>
                                        </Space>
                                      )}
                                      {lead.phone && (
                                        <Space>
                                          <PhoneOutlined />
                                          <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {lead.phone}
                                          </Text>
                                        </Space>
                                      )}
                                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        {lead.score !== undefined && lead.score !== null && (
                                          <Tag color={lead.score >= 70 ? 'success' : lead.score >= 40 ? 'warning' : 'default'}>
                                            Score: {lead.score}
                                          </Tag>
                                        )}
                                        {lead.estimated_value && (
                                          <Space>
                                            <DollarOutlined />
                                            <Text strong style={{ fontSize: '12px' }}>
                                              {parseFloat(lead.estimated_value).toLocaleString()}
                                            </Text>
                                          </Space>
                                        )}
                                      </Space>
                                      {lead.assignedTo && (
                                        <Space>
                                          <Avatar size="small" icon={<UserOutlined />} />
                                          <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {lead.assignedTo.name}
                                          </Text>
                                        </Space>
                                      )}
                                    </Space>
                                  </Card>
                                );
                              })
                            )}
                          </Space>
                        </Card>
                      );
                    })}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      {/* Create/Edit Modal */}
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
                  <Option value="new">New</Option>
                  <Option value="contacted">Contacted</Option>
                  <Option value="qualified">Qualified</Option>
                  <Option value="converted">Converted</Option>
                  <Option value="lost">Lost</Option>
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
                      {user.name} ({user.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingLead ? 'Update' : 'Create'} Lead
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Leads;

