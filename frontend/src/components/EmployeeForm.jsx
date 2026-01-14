import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Divider,
  InputNumber,
  Card,
  Tabs,
  Checkbox,
  message,
  Space,
  Typography,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  BankOutlined,
  SafetyOutlined,
  DollarOutlined,
  CalendarOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';
import { usePermissions } from '../hooks/usePermissions';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const EmployeeForm = ({ employee, onSuccess, onCancel, mode = 'create' }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [managers, setManagers] = useState([]);
  const [, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const { hasPermission } = usePermissions();
  const canManagePermissions = hasPermission('permissions.manage') || hasPermission('employees.update');

  useEffect(() => {
    fetchDepartments();
    fetchRoles();
    fetchManagers();
    if (canManagePermissions) {
      fetchPermissions();
    }
  }, []);

  useEffect(() => {
    if (employee && mode === 'edit') {
      form.setFieldsValue({
        ...employee,
        date_of_birth: employee.date_of_birth ? dayjs(employee.date_of_birth) : null,
        hire_date: employee.hire_date ? dayjs(employee.hire_date) : null,
      });
    } else if (mode === 'create') {
      // Set defaults for new employee
      form.setFieldsValue({
        status: 'active',
        employment_type: 'full-time',
      });
    }
  }, [employee, mode, form]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/departments');
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/roles');
      setRoles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to basic roles
      setRoles([
        { id: 1, name: 'Admin', slug: 'admin' },
        { id: 2, name: 'Manager', slug: 'manager' },
        { id: 3, name: 'Employee', slug: 'employee' },
      ]);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get('/employees?per_page=100');
      const employees = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      // Filter out the current employee if editing
      const filtered = employee 
        ? employees.filter(emp => emp.id !== employee.id)
        : employees;
      setManagers(filtered.filter(emp => ['admin', 'manager'].includes(emp.role?.slug?.toLowerCase())));
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const fetchPermissions = async () => {
    if (!canManagePermissions) return;
    
    try {
      const response = await axios.get('/permissions');
      const perms = Array.isArray(response.data) ? response.data : [];
      setPermissions(perms);
      
      // Group permissions by group
      const grouped = {};
      perms.forEach(perm => {
        const group = perm.group || 'Other';
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push(perm);
      });
      setGroupedPermissions(grouped);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // If permission check fails, just don't show permissions tab
      setGroupedPermissions({});
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
        hire_date: values.hire_date ? values.hire_date.format('YYYY-MM-DD') : null,
        salary: values.salary || null,
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });

      if (mode === 'create') {
        await axios.post('/employees', payload);
        message.success('Employee created successfully');
      } else {
        await axios.put(`/employees/${employee.id}`, payload);
        message.success('Employee updated successfully');
      }

      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving employee:', error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       'Failed to save employee';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      scrollToFirstError
      size="large"
    >
      <Tabs 
        defaultActiveKey="1" 
        type="card"
        items={[
          {
            key: '1',
            label: (
              <span>
                <UserOutlined /> Personal Info
              </span>
            ),
            children: (
              <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="John Doe" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="john.doe@example.com" />
              </Form.Item>
            </Col>
            {mode === 'create' ? (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                  ]}
                >
                  <Input.Password placeholder="••••••" />
                </Form.Item>
              </Col>
            ) : (
              <>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="old_password"
                    label="Current Password (to change password)"
                  >
                    <Input.Password placeholder="Enter current password" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="password"
                    label="New Password (leave empty to keep current)"
                    rules={[
                      { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                  >
                    <Input.Password placeholder="Enter new password" />
                  </Form.Item>
                </Col>
              </>
            )}
            <Col xs={24} sm={12}>
              <Form.Item name="employee_id" label="Employee ID">
                <Input prefix={<IdcardOutlined />} placeholder="Auto-generated if empty" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="date_of_birth" label="Date of Birth">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="genre" label="Gender">
                <Select placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="Address">
                <Input prefix={<HomeOutlined />} placeholder="Street address, City, Country" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone_number" label="Phone Number">
                <Input prefix={<PhoneOutlined />} placeholder="+1234567890" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="social_situation" label="Marital Status">
                <Select placeholder="Select status">
                  <Option value="Single">Single</Option>
                  <Option value="Married">Married</Option>
                  <Option value="Divorced">Divorced</Option>
                  <Option value="Widowed">Widowed</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="sos_number" label="Emergency Contact Phone">
                <Input prefix={<PhoneOutlined />} placeholder="Emergency contact" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="emergency_contact_name" label="Emergency Contact Name">
                <Input placeholder="Contact name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="emergency_contact_relation" label="Relationship">
                <Input placeholder="e.g., Spouse, Parent, Sibling" />
              </Form.Item>
            </Col>
          </Row>
              </div>
            ),
          },
          {
            key: '2',
            label: (
              <span>
                <BankOutlined /> Employment
              </span>
            ),
            children: (
              <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="department_id"
                label="Department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="role_id"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  {roles.map(role => (
                    <Option key={role.id} value={role.id}>
                      {role.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="position" label="Job Position">
                <Input placeholder="e.g., Senior Developer, HR Manager" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="manager_id" label="Manager">
                <Select 
                  placeholder="Select manager"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {managers.map(manager => (
                    <Option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role?.name || 'N/A'})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="hire_date" label="Hire Date">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="employment_type" label="Employment Type">
                <Select defaultValue="full-time">
                  <Option value="full-time">Full Time</Option>
                  <Option value="part-time">Part Time</Option>
                  <Option value="contract">Contract</Option>
                  <Option value="intern">Intern</Option>
                  <Option value="freelance">Freelance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="salary" label="Salary">
                <InputNumber
                  style={{ width: '100%' }}
                  addonBefore="$"
                  placeholder="0.00"
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="Status" initialValue="active">
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="on-leave">On Leave</Option>
                  <Option value="terminated">Terminated</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="notes" label="Notes">
                <TextArea rows={4} placeholder="Additional notes about the employee..." />
              </Form.Item>
            </Col>
          </Row>
              </div>
            ),
          },
          ...(canManagePermissions ? [{
            key: '3',
            label: (
              <span>
                <SafetyOutlined /> Permissions
              </span>
            ),
            children: (
              <div>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              Select additional permissions to override role defaults. Leave empty to use role permissions only.
            </Text>
            <Form.Item name="permissions">
              <Checkbox.Group style={{ width: '100%' }}>
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <Card 
                    key={group} 
                    title={group} 
                    size="small" 
                    style={{ marginBottom: 16 }}
                    bodyStyle={{ maxHeight: '300px', overflowY: 'auto' }}
                  >
                    <Row gutter={[8, 8]}>
                      {perms.map(perm => (
                        <Col xs={24} sm={12} md={8} key={perm.id}>
                          <Checkbox value={perm.name}>
                            <div>
                              <div style={{ fontWeight: 500 }}>{perm.name}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {perm.description || `${perm.resource} - ${perm.action}`}
                              </Text>
                            </div>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                ))}
              </Checkbox.Group>
            </Form.Item>
              </div>
            ),
          }] : []),
        ]}
      />

      <Divider />
      
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            {mode === 'create' ? 'Create Employee' : 'Update Employee'}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} size="large">
              Cancel
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default EmployeeForm;

