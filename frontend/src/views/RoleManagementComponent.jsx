import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Card,
    Modal,
    Form,
    Input,
    message,
    Space,
    Typography,
    Checkbox,
    Row,
    Col,
    Popconfirm,
    Tag,
    Tooltip,
    Divider
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SafetyCertificateOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import axios from '../axios';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Text } = Typography;

const RoleManagementComponent = () => {
    const { theme } = useStateContext();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Theme styles to match UserSettingView
    const isDark = theme === 'dark';
    const colors = {
        cardBg: isDark ? '#1f1f1f' : '#ffffff',
        textPrimary: isDark ? 'rgba(255, 255, 255, 0.85)' : '#222222',
        textSecondary: isDark ? 'rgba(255, 255, 255, 0.45)' : '#595959',
        border: isDark ? '#303030' : '#f0f0f0',
        primary: isDark ? '#177ddc' : '#1890ff',
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                axios.get('/roles'),
                axios.get('/permissions')
            ]);
            setRoles(rolesRes.data || []);
            setPermissions(permsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to load roles and permissions');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingRole(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingRole(record);
        form.setFieldsValue({
            name: record.name,
            description: record.description,
            permissions: record.permissions?.map(p => p.id) || []
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/roles/${id}`);
            message.success('Role deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Delete error:', error);
            message.error('Failed to delete role');
        }
    };

    const handleFinish = async (values) => {
        setSubmitting(true);
        try {
            if (editingRole) {
                await axios.put(`/roles/${editingRole.id}`, values);
                message.success('Role updated successfully');
            } else {
                await axios.post('/roles', values);
                message.success('Role created successfully');
            }
            setModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Submit error:', error);
            message.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    // Group permissions by module (assuming permission names are like "module.action")
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const [module] = perm.name.split('.');
        const moduleName = module.charAt(0).toUpperCase() + module.slice(1);

        if (!acc[moduleName]) {
            acc[moduleName] = [];
        }
        acc[moduleName].push(perm);
        return acc;
    }, {});

    const columns = [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong style={{ color: colors.textPrimary }}>{text}</Text>,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => <Text type="secondary">{text || '-'}</Text>,
        },
        {
            title: 'Permissions',
            key: 'permissions_count',
            render: (_, record) => (
                <Tag color="blue">{record.permissions?.length || 0} permissions</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete this role?"
                        description="This action cannot be undone. Users with this role may lose access."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        disabled={['admin', 'manager', 'employee'].includes(record.name.toLowerCase())} // Protect default roles if needed
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            disabled={['admin', 'manager', 'employee'].includes(record.name.toLowerCase())}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 0 }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
            }}>
                <div>
                    <Title level={4} style={{ margin: 0, color: colors.textPrimary }}>
                        Role Management
                    </Title>
                    <Text type="secondary">Create and manage user roles and access permissions.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    Add New Role
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={roles}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                style={{
                    background: colors.cardBg,
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`
                }}
                rowClassName="editable-row"
            />

            <Modal
                title={editingRole ? "Edit Role" : "Create New Role"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={800}
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                >
                    <Form.Item
                        name="name"
                        label="Role Name"
                        rules={[{ required: true, message: 'Please enter role name' }]}
                    >
                        <Input placeholder="e.g. HR Manager" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={2} placeholder="Role description..." />
                    </Form.Item>

                    <Divider orientation="left">Permissions</Divider>

                    <Form.Item name="permissions">
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[16, 16]}>
                                {Object.entries(groupedPermissions).map(([module, perms]) => (
                                    <Col span={24} key={module}>
                                        <Card
                                            size="small"
                                            title={module}
                                            type="inner"
                                            headStyle={{ background: '#fafafa', fontSize: 13 }}
                                        >
                                            <Row gutter={[8, 8]}>
                                                {perms.map(perm => (
                                                    <Col span={8} key={perm.id}>
                                                        <Checkbox value={perm.id} style={{ fontSize: 12 }}>
                                                            <Tooltip title={perm.description || perm.name}>
                                                                {perm.name}
                                                            </Tooltip>
                                                        </Checkbox>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                        <Button onClick={() => setModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {editingRole ? 'Update Role' : 'Create Role'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default RoleManagementComponent;
