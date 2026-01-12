import React, { useState, useEffect, useMemo } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    message,
    Space,
    Typography,
    Select,
    Popconfirm,
    TreeSelect,
    Avatar
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ApartmentOutlined,
    UserOutlined
} from '@ant-design/icons';
import axios from '../axios';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Text } = Typography;
const { Option } = Select;

const DepartmentManagementComponent = () => {
    const { theme } = useStateContext();
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Theme styles
    const isDark = theme === 'dark';
    const colors = {
        cardBg: isDark ? '#1f1f1f' : '#ffffff',
        textPrimary: isDark ? 'rgba(255, 255, 255, 0.85)' : '#222222',
        textSecondary: isDark ? 'rgba(255, 255, 255, 0.45)' : '#595959',
        border: isDark ? '#303030' : '#f0f0f0',
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, empRes] = await Promise.all([
                axios.get('/departments'),
                axios.get('/employees')
            ]);
            setDepartments(deptRes.data || []);
            setEmployees(empRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const buildTree = (items, parentId = null) => {
        return items
            .filter(item => item.parent_id === parentId)
            .map(item => ({
                ...item,
                key: item.id,
                children: buildTree(items, item.id)
            }));
    };

    const treeData = useMemo(() => {
        if (departments.some(d => d.children && d.children.length > 0)) {
            return departments;
        }
        return buildTree(departments);
    }, [departments]);

    const treeSelectData = useMemo(() => {
        const loop = (data) => data.map((item) => {
            return {
                title: item.name,
                value: item.id,
                key: item.id,
                children: item.children && item.children.length > 0 ? loop(item.children) : [],
                disabled: editingDept && (item.id === editingDept.id)
            };
        });
        return loop(treeData);
    }, [treeData, editingDept]);


    const handleAdd = () => {
        setEditingDept(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingDept(record);
        form.setFieldsValue({
            name: record.name,
            manager_id: record.manager_id,
            parent_id: record.parent_id,
            description: record.description
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/departments/${id}`);
            message.success('Department deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Delete error:', error);
            message.error('Failed to delete department');
        }
    };

    const handleFinish = async (values) => {
        setSubmitting(true);
        try {
            if (editingDept) {
                await axios.put(`/departments/${editingDept.id}`, values);
                message.success('Department updated successfully');
            } else {
                await axios.post('/departments', values);
                message.success('Department created successfully');
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

    const columns = [
        {
            title: 'Department Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Space><ApartmentOutlined style={{ color: '#1890ff' }} /><Text strong style={{ color: colors.textPrimary }}>{text}</Text></Space>,
        },
        {
            title: 'Manager',
            dataIndex: 'manager',
            key: 'manager',
            render: (manager, record) => {
                if (manager) return (
                    <Space>
                        <Avatar size="small" src={manager.avatar} icon={<UserOutlined />} />
                        <Text style={{ color: colors.textPrimary }}>{manager.name}</Text>
                    </Space>
                );
                const emp = employees.find(e => e.id === record.manager_id);
                return emp ? (
                    <Space>
                        <Avatar size="small" src={emp.avatar} icon={<UserOutlined />} />
                        <Text style={{ color: colors.textPrimary }}>{emp.name}</Text>
                    </Space>
                ) : <Text type="secondary">-</Text>;
            }
        },
        {
            title: 'Employees',
            key: 'employees_count',
            render: (_, record) => (
                <Text type="secondary">{record.employees_count || 0} Members</Text>
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
                        title="Delete this department?"
                        description="Sub-departments will also be deleted or orphaned."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 0 }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
            }}>
                <div>
                    <Title level={4} style={{ margin: 0, color: colors.textPrimary }}>
                        Departments
                    </Title>
                    <Text type="secondary">Manage organizational structure and hierarchy.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    Add Department
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={treeData}
                rowKey="id"
                loading={loading}
                pagination={false}
                expandable={{
                    defaultExpandAllRows: true
                }}
                style={{
                    background: colors.cardBg,
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`
                }}
                rowClassName="editable-row"
            />

            <Modal
                title={editingDept ? "Edit Department" : "Create Department"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                >
                    <Form.Item
                        name="name"
                        label="Department Name"
                        rules={[{ required: true, message: 'Please enter department name' }]}
                    >
                        <Input placeholder="e.g. Engineering" />
                    </Form.Item>

                    <Form.Item
                        name="parent_id"
                        label="Parent Department"
                    >
                        <TreeSelect
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            treeData={treeSelectData}
                            placeholder="Select parent department (optional)"
                            treeDefaultExpandAll
                            allowClear
                        />
                    </Form.Item>

                    <Form.Item
                        name="manager_id"
                        label="Department Head"
                    >
                        <Select
                            showSearch
                            placeholder="Select a manager"
                            optionFilterProp="children"
                            allowClear
                        >
                            {employees.map(emp => (
                                <Option key={emp.id} value={emp.id}>{emp.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                        <Button onClick={() => setModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {editingDept ? 'Update Department' : 'Create Department'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default DepartmentManagementComponent;
