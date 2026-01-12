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
    Row,
    Col,
    Statistic,
    message,
    Popconfirm,
    Badge,
    Switch,
    Typography,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    GlobalOutlined,
    MailOutlined,
    PhoneOutlined,
    BankOutlined,
    RocketOutlined,
    StopOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Text } = Typography;
const { Option } = Select;

const TenantManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [form] = Form.useForm();
    const { theme } = useStateContext();

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/companies');
            // Backend returns paginated data: { data: [...], current_page: 1, ... }
            setCompanies(response.data.data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
            message.error('Failed to load companies. Ensure you have admin privileges.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingCompany) {
                await axios.put(`/companies/${editingCompany.id}`, values);
                message.success('Company updated successfully');
            } else {
                await axios.post('/companies', values);
                message.success('Company created successfully');
            }
            setModalVisible(false);
            setEditingCompany(null);
            form.resetFields();
            fetchCompanies();
        } catch (error) {
            message.error(error.response?.data?.error || 'Failed to save company');
        }
    };

    const handleToggleActive = async (id, isActive) => {
        try {
            await axios.put(`/companies/${id}`, { is_active: !isActive });
            message.success(`Company ${!isActive ? 'activated' : 'deactivated'} successfully`);
            fetchCompanies();
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/companies/${id}`);
            message.success('Company deleted successfully');
            fetchCompanies();
        } catch (error) {
            message.error('Failed to delete company');
        }
    };

    const columns = [
        {
            title: 'Company',
            key: 'name',
            render: (_, record) => (
                <Space>
                    <div className="glass-inner-card" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                        <BankOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
                    </div>
                    <div>
                        <Text strong>{record.name}</Text>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{record.slug}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Domain & Contact',
            key: 'contact',
            render: (_, record) => (
                <div>
                    <div><GlobalOutlined style={{ fontSize: 12, marginRight: 4 }} /> {record.domain || 'N/A'}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}><MailOutlined style={{ fontSize: 12, marginRight: 4 }} /> {record.email || 'N/A'}</div>
                </div>
            ),
        },
        {
            title: 'Subscription',
            dataIndex: 'subscription_status',
            key: 'subscription',
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'warning'} style={{ borderRadius: 6, textTransform: 'capitalize' }}>
                    {status || 'Trial'}
                </Tag>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            align: 'center',
            render: (_, record) => (
                <Tooltip title={record.is_active ? 'Active' : 'Deactivated'}>
                    <Badge status={record.is_active ? 'success' : 'error'} text={record.is_active ? 'Active' : 'Inactive'} />
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Switch
                        size="small"
                        checked={record.is_active}
                        onChange={() => handleToggleActive(record.id, record.is_active)}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingCompany(record);
                            form.setFieldsValue(record);
                            setModalVisible(true);
                        }}
                    />
                    <Popconfirm
                        title="Are you sure? All tenant data will be inaccessible."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes, Delete"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const stats = {
        total: companies.length,
        active: companies.filter(c => c.is_active).length,
        trials: companies.filter(c => c.subscription_status === 'trial' || !c.subscription_status).length,
    };

    return (
        <div className="page-container">
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <Title level={2} className="text-gradient" style={{ marginBottom: 4 }}>Tenant Management</Title>
                    <Text type="secondary">Enterprise-wide control over business units, companies, and platform access.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    style={{ borderRadius: 10, background: 'var(--primary-gradient)', border: 'none' }}
                    onClick={() => {
                        setEditingCompany(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                >
                    Add Company
                </Button>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
                    <Card className="glass-card">
                        <Statistic
                            title="Total Tenants"
                            value={stats.total}
                            prefix={<BankOutlined style={{ color: '#4f46e5' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="glass-card">
                        <Statistic
                            title="Active Subscriptions"
                            value={stats.active}
                            prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                            valueStyle={{ color: '#10b981' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="glass-card">
                        <Statistic
                            title="Trial Periods"
                            value={stats.trials}
                            prefix={<RocketOutlined style={{ color: '#f59e0b' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="glass-card" bodyStyle={{ padding: 24 }}>
                <Table
                    columns={columns}
                    dataSource={companies}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 15 }}
                    className="premium-table"
                />
            </Card>

            <Modal
                title={editingCompany ? 'Edit Company Settings' : 'Register New Company'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                width={700}
                okText="Save Company"
                className="premium-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        timezone: 'UTC',
                        currency: 'USD',
                        language: 'en',
                        is_active: true
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Company Name" rules={[{ required: true }]}>
                                <Input placeholder="Acme Corp" prefix={<BankOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="domain" label="Primary Domain">
                                <Input placeholder="acme.com" prefix={<GlobalOutlined />} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="email" label="Contact Email">
                                <Input placeholder="billing@company.com" prefix={<MailOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="phone" label="Contact Phone">
                                <Input placeholder="+1..." prefix={<PhoneOutlined />} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={8}>
                        <Col span={8}>
                            <Form.Item name="timezone" label="Timezone">
                                <Select showSearch>
                                    <Option value="UTC">UTC</Option>
                                    <Option value="Europe/Paris">Europe/Paris</Option>
                                    <Option value="Africa/Casablanca">Africa/Casablanca</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="currency" label="Currency">
                                <Select>
                                    <Option value="USD">USD ($)</Option>
                                    <Option value="EUR">EUR (€)</Option>
                                    <Option value="MAD">MAD (DH)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="language" label="Portal Language">
                                <Select>
                                    <Option value="en">English</Option>
                                    <Option value="fr">French</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="address" label="Mailing Address">
                        <Input.TextArea rows={3} placeholder="Street, City, Postal Code, Country" />
                    </Form.Item>

                    {editingCompany && (
                        <Form.Item name="is_active" label="System Access" valuePropName="checked">
                            <Switch checkedChildren="Active" unCheckedChildren="Suspended" />
                        </Form.Item>
                    )}
                </Form>
            </Modal>

            <style>{`
        .premium-table .ant-table { background: transparent !important; }
        .premium-table .ant-table-thead > tr > th { background: rgba(0,0,0,0.02) !important; color: #8c8c8c !important; font-weight: 600 !important; font-size: 11px !important; text-transform: uppercase !important; border-bottom: 2px solid #f0f0f0 !important; }
        .premium-table .ant-table-row:hover > td { background: rgba(79, 70, 229, 0.02) !important; }
      `}</style>
        </div>
    );
};

export default TenantManagement;
