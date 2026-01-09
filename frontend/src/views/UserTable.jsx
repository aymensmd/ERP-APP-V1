import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, message, Drawer, Form, Select, Space, Popconfirm, Typography, ConfigProvider } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import axios from '../axios';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { useStateContext } from '../contexts/ContextProvider';

const { Option } = Select;
const { Title } = Typography;

const UserTable = () => {
  const { theme } = useStateContext();
  const [searchText, setSearchText] = useState('');
  const [department, setDepartment] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [form] = Form.useForm();

  const { data: users, loading, error, refresh } = useRealTimeData('/employees');

  // Theme styles
  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      primary: '#1890ff',
      headerBg: '#f5f5f5',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      border: '#303030',
      primary: '#177ddc',
      headerBg: '#141414',
    }
  };

  const colors = themeStyles[theme];

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/departments');
      // Response data is already unwrapped by axios interceptor
      const departments = Array.isArray(response.data) ? response.data : [];
      setDepartmentOptions(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Only show error message if it's not a 401 (handled by interceptor)
      if (error.response?.status !== 401) {
        message.error('Failed to fetch departments. Please check the API endpoint.');
      }
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleUpdateFormSubmit = async (values) => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const updatedData = {
        name: values.name,
        email: values.email,
        department_id: values.department,
        role_id: values.role,
      };

      await axios.put(`/employees/${selectedUser.id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      message.success('User updated successfully');
      setDrawerVisible(false);
      refresh();
    } catch (error) {
      message.error('Failed to update user');
      console.error('Update error:', error);
    }
  };

  const handleResetFilters = () => {
    setSearchText('');
    setDepartment('');
    setRoleFilter('');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesDepartment = department ? user.department_id === department : true;
    const matchesRole = roleFilter ? user.role?.name === roleFilter : true;
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ color: colors.textPrimary }}>{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <span style={{ color: colors.textPrimary }}>{text}</span>,
    },
    {
      title: 'Department',
      dataIndex: 'department_id',
      key: 'department',
      render: (departmentId) => {
        const department = departmentOptions.find(dep => dep.id === departmentId);
        return <span style={{ color: colors.textPrimary }}>{department ? department.name : 'N/A'}</span>;
      },
    },
    {
      title: 'Role',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (role) => <span style={{ color: colors.textPrimary }}>{role || 'N/A'}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => {
            setSelectedUser(record);
            form.setFieldsValue({
              ...record,
              department: record.department_id,
              role: record.role?.name,
            });
            setDrawerVisible(true);
          }}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
      <Card 
        style={{ 
          margin: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          background: colors.cardBg
        }}
      >
        <Title level={3} style={{ marginBottom: '20px', textAlign: 'center', color: colors.textPrimary }}>
          User Management
        </Title>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: 8 }}>
          <Input
            placeholder="Search by name or email"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: '300px' }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="Filter by Role"
            value={roleFilter}
            onChange={value => setRoleFilter(value)}
            style={{ width: '200px' }}
            allowClear
          >
            <Option value="Admin">Admin</Option>
            <Option value="Moderator">Moderator</Option>
          </Select>
          <Button type="default" icon={<FilterOutlined />} onClick={handleResetFilters}>
            Reset Filters
          </Button>
         
        </div>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          style={{ 
            background: colors.cardBg, 
            borderRadius: '12px', 
            overflow: 'hidden',
            border: `1px solid ${colors.border}`
          }}
        />

        <Drawer
          title={selectedUser ? 'Edit User' : 'Add User'}
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={400}
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
          <Form
            layout="vertical"
            form={form}
            onFinish={handleUpdateFormSubmit}
            style={{ padding: '10px' }}
          >
            <Form.Item 
              name="name" 
              label="Name" 
              rules={[{ required: true, message: 'Please enter name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item 
              name="email" 
              label="Email" 
              rules={[{ required: true, message: 'Please enter email' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item 
              name="department" 
              label="Department" 
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select>
                {departmentOptions.map(dep => (
                  <Option key={dep.id} value={dep.id}>{dep.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="role" 
              label="Role" 
              rules={[{ required: true, message: 'Please select role' }]}
            >
              <Select>
                <Option value="Admin">Admin</Option>
                <Option value="Moderator">Moderator</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {selectedUser ? 'Update User' : 'Add User'}
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      </Card>
    </ConfigProvider>
  );
};

export default UserTable;