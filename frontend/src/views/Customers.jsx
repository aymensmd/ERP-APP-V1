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
  Avatar,
  message,
  Popconfirm,
  Tabs,
  List,
  Typography,
  Row,
  Col,
  Statistic,
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
  HistoryOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import { useCompany } from '../contexts/CompanyContext';
import CommunicationHistory from '../components/CommunicationHistory';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: null,
    type: null,
    search: '',
  });
  const [form] = Form.useForm();
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (currentCompany) {
      fetchCustomers();
      fetchStats();
    }
  }, [currentCompany, filters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/customers?${params.toString()}`);
      setCustomers(Array.isArray(response.data.data) ? response.data.data : (response.data.data || []));
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from customers
      const total = customers.length;
      const active = customers.filter(c => c.status === 'active').length;
      const business = customers.filter(c => c.type === 'business').length;
      const totalRevenue = customers.reduce((sum, c) => sum + (parseFloat(c.total_revenue) || 0), 0);
      
      setStats({ total, active, business, totalRevenue });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [customers]);

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        credit_limit: values.credit_limit || null,
      };
      
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });

      if (editingCustomer) {
        await axios.put(`/customers/${editingCustomer.id}`, payload);
        message.success('Customer updated successfully');
      } else {
        await axios.post('/customers', payload);
        message.success('Customer created successfully');
      }

      setModalVisible(false);
      setEditingCustomer(null);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      console.error('Customer save error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to save customer';
      message.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/customers/${id}`);
      message.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      message.error('Failed to delete customer');
    }
  };

  const handleViewDetails = async (customer) => {
    try {
      const response = await axios.get(`/customers/${customer.id}`);
      setSelectedCustomer(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Failed to load customer details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      suspended: 'error',
    };
    return colors[status] || 'default';
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
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'business' ? 'blue' : 'default'}>
          {type === 'business' ? 'Business' : 'Individual'}
        </Tag>
      ),
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
      title: 'Revenue',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (revenue) => revenue ? (
        <Space>
          <DollarOutlined />
          {parseFloat(revenue).toLocaleString()}
        </Space>
      ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCustomer(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this customer?"
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
                title="Total Customers"
                value={stats.total || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Customers"
                value={stats.active || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Business Customers"
                value={stats.business || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={stats.totalRevenue || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<DollarOutlined />}
                precision={2}
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
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="suspended">Suspended</Option>
              </Select>
              <Select
                placeholder="Filter by Type"
                allowClear
                style={{ width: 150 }}
                value={filters.type}
                onChange={(value) => setFilters({ ...filters, type: value })}
              >
                <Option value="individual">Individual</Option>
                <Option value="business">Business</Option>
              </Select>
              <Input
                placeholder="Search customers..."
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
                setEditingCustomer(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Add Customer
            </Button>
          </Space>

          <Table
            dataSource={customers}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 15 }}
          />
        </Card>
      </Space>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Create Customer'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCustomer(null);
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
              <Form.Item name="type" label="Type">
                <Select>
                  <Option value="individual">Individual</Option>
                  <Option value="business">Business</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="suspended">Suspended</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="billing_address" label="Billing Address">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="shipping_address" label="Shipping Address">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingCustomer ? 'Update' : 'Create'} Customer
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        title={`Customer: ${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedCustomer(null);
        }}
        footer={null}
        width={900}
      >
        {selectedCustomer && (
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Email:</Text> {selectedCustomer.email || '-'}
                    </Col>
                    <Col span={12}>
                      <Text strong>Phone:</Text> {selectedCustomer.phone || '-'}
                    </Col>
                    <Col span={12}>
                      <Text strong>Company:</Text> {selectedCustomer.company_name || '-'}
                    </Col>
                    <Col span={12}>
                      <Text strong>Type:</Text> {selectedCustomer.type || '-'}
                    </Col>
                    <Col span={12}>
                      <Text strong>Status:</Text> 
                      <Tag color={getStatusColor(selectedCustomer.status)}>
                        {selectedCustomer.status}
                      </Tag>
                    </Col>
                    <Col span={12}>
                      <Text strong>Total Revenue:</Text> 
                      ${parseFloat(selectedCustomer.total_revenue || 0).toLocaleString()}
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'communications',
                label: 'Communications',
                children: (
                  <CommunicationHistory
                    communicableType="App\Models\Customer"
                    communicableId={selectedCustomer.id}
                  />
                ),
              },
              {
                key: 'invoices',
                label: 'Invoices',
                children: (
                  <List
                    dataSource={selectedCustomer.invoices || []}
                    renderItem={(invoice) => (
                      <List.Item>
                        <Space>
                          <Text strong>{invoice.invoice_number}</Text>
                          <Tag color={invoice.status === 'paid' ? 'success' : 'default'}>
                            {invoice.status}
                          </Tag>
                          <Text>${parseFloat(invoice.total_amount || 0).toLocaleString()}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default Customers;

