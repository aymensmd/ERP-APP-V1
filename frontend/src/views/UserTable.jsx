import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, message, Drawer, Select, Space, Popconfirm, Typography, ConfigProvider, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import EmployeeForm from '../components/EmployeeForm';
import axios from '../axios';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { useStateContext } from '../contexts/ContextProvider';

const { Option } = Select;
const { Title, Text } = Typography;

const UserTable = () => {
  const { theme } = useStateContext();
  const [searchText, setSearchText] = useState('');
  const [department, setDepartment] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [departmentOptions, setDepartmentOptions] = useState([]);

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

  const handleDelete = async (userId) => {
    try {
      await axios.delete(`/employees/${userId}`);
      message.success('Employee deleted successfully');
      refresh();
    } catch (error) {
      message.error('Failed to delete employee');
      console.error('Delete error:', error);
    }
  };

  const handleResetFilters = () => {
    setSearchText('');
    setDepartment('');
    setRoleFilter('');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
                          user.employee_id?.toLowerCase().includes(searchText.toLowerCase());
    const matchesDepartment = department ? user.department_id === parseInt(department) : true;
    const matchesRole = roleFilter ? user.role?.name === roleFilter : true;
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 110,
      render: (text) => <span style={{ color: colors.textPrimary, fontFamily: 'monospace', fontSize: 12 }}>{text || 'N/A'}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text, record) => (
        <div>
          <div style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 13 }}>{text}</div>
          <div style={{ color: colors.textSecondary, fontSize: 11 }}>{record.position || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text) => <span style={{ color: colors.textPrimary, fontSize: 12 }}>{text}</span>,
    },
    {
      title: 'Department',
      dataIndex: ['department', 'name'],
      key: 'department',
      width: 140,
      render: (deptName, record) => {
        // Handle both object and ID formats
        const department = record.department?.name || 
                          (record.department_id ? departmentOptions.find(d => d.id === record.department_id)?.name : null) ||
                          deptName;
        return <Tag color="blue" style={{ fontSize: 11 }}>{department || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => {
        const roleName = role?.name || role;
        const roleColors = {
          'Admin': 'red',
          'Manager': 'orange',
          'Employee': 'green',
        };
        return <Tag color={roleColors[roleName] || 'default'} style={{ fontSize: 11 }}>{roleName || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusColors = {
          'active': 'green',
          'inactive': 'default',
          'on-leave': 'orange',
          'terminated': 'red',
        };
        return <Tag color={statusColors[status] || 'default'} style={{ fontSize: 11 }}>{(status || 'active').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setDrawerVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this employee?"
            description="This will remove them from the company. Are you sure?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
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
      <div style={{ 
        margin: 0, 
        borderRadius: '8px', 
        background: 'transparent',
        border: 'none'
      }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ marginBottom: 4, color: colors.textPrimary, fontSize: 16, fontWeight: 600 }}>
            Employees List
          </Title>
          <Text type="secondary" style={{ color: colors.textSecondary, fontSize: 12 }}>
            Manage and view all employees in your organization
          </Text>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 8, 
          marginBottom: 16,
          alignItems: 'center'
        }}>
          <Input
            placeholder="Search by name, email, or employee ID"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ flex: '1 1 250px', maxWidth: '350px' }}
            prefix={<SearchOutlined />}
            allowClear
            size="middle"
          />
          <Select
            placeholder="Department"
            value={department}
            onChange={value => setDepartment(value)}
            style={{ width: '160px' }}
            allowClear
            size="middle"
          >
            {departmentOptions.map(dept => (
              <Option key={dept.id} value={dept.id.toString()}>{dept.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="Role"
            value={roleFilter}
            onChange={value => setRoleFilter(value)}
            style={{ width: '140px' }}
            allowClear
            size="middle"
          >
            <Option value="Admin">Admin</Option>
            <Option value="Manager">Manager</Option>
            <Option value="Employee">Employee</Option>
          </Select>
          <Button 
            type="default" 
            icon={<FilterOutlined />} 
            onClick={handleResetFilters}
            size="middle"
          >
            Reset
          </Button>
        </div>
        <div style={{
          background: colors.cardBg,
          borderRadius: '6px',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`
        }}>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            loading={loading}
            rowKey="id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
              pageSizeOptions: ['5', '10', '20', '50'],
              size: 'small'
            }}
            scroll={{ x: 1200 }}
            size="small"
            style={{ 
              background: 'transparent'
            }}
            locale={{
              emptyText: 'No employees found'
            }}
          />
        </div>

        <Drawer
          title={selectedUser ? 'Edit Employee' : 'Add Employee'}
          placement="right"
          onClose={() => {
            setDrawerVisible(false);
            setSelectedUser(null);
          }}
          open={drawerVisible}
          width={Math.min(850, window.innerWidth * 0.85)}
          styles={{
            body: {
              padding: '20px',
              background: colors.cardBg,
              color: colors.textPrimary
            },
            header: {
              padding: '16px 20px',
              background: colors.cardBg,
              borderBottom: `1px solid ${colors.border}`
            }
          }}
        >
          <EmployeeForm
            employee={selectedUser}
            mode={selectedUser ? 'edit' : 'create'}
            onSuccess={() => {
              setDrawerVisible(false);
              setSelectedUser(null);
              refresh();
            }}
            onCancel={() => {
              setDrawerVisible(false);
              setSelectedUser(null);
            }}
          />
        </Drawer>
      </div>
    </ConfigProvider>
  );
};

export default UserTable;