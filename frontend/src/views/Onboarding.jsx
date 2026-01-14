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
  message,
  Popconfirm,
  DatePicker,
  Checkbox,
  Progress,
  Row,
  Col,
  Statistic,
  List,
  Typography,
  Divider,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import { useCompany } from '../contexts/CompanyContext';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const Onboarding = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [users, setUsers] = useState([]);
  const [template, setTemplate] = useState([]);
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (currentCompany) {
      fetchEmployees();
      fetchUsers();
    }
  }, [currentCompany]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchChecklist(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees');
      setEmployees(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      message.error('Failed to load employees');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/employees');
      setUsers(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchChecklist = async (userId) => {
    setChecklistLoading(true);
    try {
      const response = await axios.get(`/onboarding/checklist/${userId}`);
      setChecklist(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
      message.error('Failed to load checklist');
    } finally {
      setChecklistLoading(false);
    }
  };

  const fetchTemplate = async () => {
    try {
      const response = await axios.get('/onboarding/template');
      setTemplate(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch template:', error);
    }
  };

  const handleCreateChecklist = () => {
    if (!selectedEmployee) {
      message.warning('Please select an employee first');
      return;
    }
    fetchTemplate();
    setTemplateModalVisible(true);
  };

  const handleUseTemplate = async () => {
    if (!selectedEmployee) return;

    try {
      await axios.post(`/onboarding/checklist/${selectedEmployee.id}/create`, {
        tasks: template,
      });
      message.success('Onboarding checklist created successfully');
      setTemplateModalVisible(false);
      fetchChecklist(selectedEmployee.id);
    } catch (error) {
      console.error('Failed to create checklist:', error);
      message.error(error.response?.data?.error || 'Failed to create checklist');
    }
  };

  const handleCreateCustom = () => {
    if (!selectedEmployee) {
      message.warning('Please select an employee first');
      return;
    }
    form.resetFields();
    form.setFieldsValue({
      tasks: [{ task_name: '', description: '', category: 'other' }],
    });
    setModalVisible(true);
  };

  const handleSubmitChecklist = async (values) => {
    try {
      await axios.post(`/onboarding/checklist/${selectedEmployee.id}/create`, {
        tasks: values.tasks.filter(t => t.task_name),
      });
      message.success('Onboarding checklist created successfully');
      setModalVisible(false);
      fetchChecklist(selectedEmployee.id);
    } catch (error) {
      console.error('Failed to create checklist:', error);
      message.error(error.response?.data?.error || 'Failed to create checklist');
    }
  };

  const handleAddItem = () => {
    if (!selectedEmployee) {
      message.warning('Please select an employee first');
      return;
    }
    setEditingItem(null);
    itemForm.resetFields();
    setItemModalVisible(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    itemForm.setFieldsValue({
      ...item,
      due_date: item.due_date ? dayjs(item.due_date) : null,
    });
    setItemModalVisible(true);
  };

  const handleSubmitItem = async (values) => {
    try {
      if (editingItem) {
        await axios.put(`/onboarding/items/${editingItem.id}`, values);
        message.success('Checklist item updated successfully');
      } else {
        await axios.post(`/onboarding/checklist/${selectedEmployee.id}/add`, values);
        message.success('Checklist item added successfully');
      }
      setItemModalVisible(false);
      fetchChecklist(selectedEmployee.id);
    } catch (error) {
      console.error('Failed to save item:', error);
      message.error(error.response?.data?.error || 'Failed to save item');
    }
  };

  const handleUpdateStatus = async (item, newStatus) => {
    try {
      await axios.put(`/onboarding/items/${item.id}`, { status: newStatus });
      message.success('Status updated successfully');
      fetchChecklist(selectedEmployee.id);
    } catch {
      message.error('Failed to update status');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await axios.delete(`/onboarding/items/${itemId}`);
      message.success('Item deleted successfully');
      fetchChecklist(selectedEmployee.id);
    } catch {
      message.error('Failed to delete item');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'default',
      in_progress: 'processing',
      completed: 'success',
      skipped: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      in_progress: <ClockCircleOutlined />,
      completed: <CheckCircleOutlined />,
      skipped: <CloseCircleOutlined />,
    };
    return icons[status] || null;
  };

  const getCategoryColor = (category) => {
    const colors = {
      documentation: 'blue',
      access: 'green',
      training: 'orange',
      equipment: 'purple',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  const calculateProgress = () => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.status === 'completed').length;
    return Math.round((completed / checklist.length) * 100);
  };

  const progress = calculateProgress();
  const completedCount = checklist.filter(item => item.status === 'completed').length;

  const checklistColumns = [
    {
      title: 'Task',
      dataIndex: 'task_name',
      key: 'task_name',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          {record.description && <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>}
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color={getCategoryColor(category)}>
          {category?.toUpperCase() || 'OTHER'}
        </Tag>
      ),
    },
    {
      title: 'Assigned To',
      key: 'assigned_to',
      render: (_, record) => record.assigned_to_user?.name || '-',
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status?.replace('_', ' ').toUpperCase() || 'PENDING'}
        </Tag>
      ),
    },
    {
      title: 'Completed',
      key: 'completed',
      render: (_, record) => {
        if (record.status === 'completed') {
          return (
            <Space>
              <Text type="success">{record.completed_by_user?.name || '-'}</Text>
              {record.completed_date && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(record.completed_date).format('MMM DD, YYYY')}
                </Text>
              )}
            </Space>
          );
        }
        return '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status !== 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleUpdateStatus(record, 'completed')}
            >
              Complete
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleUpdateStatus(record, 'in_progress')}
            >
              Start
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDeleteItem(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Select Employee" style={{ height: '100%' }}>
            <Select
              placeholder="Select an employee to view their onboarding checklist"
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
              value={selectedEmployee?.id}
              onChange={(value) => {
                const emp = employees.find(e => e.id === value);
                setSelectedEmployee(emp);
              }}
            >
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.id}>
                  {emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}
                </Option>
              ))}
            </Select>
          </Card>
        </Col>
        <Col span={12}>
          {selectedEmployee && (
            <Card>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Total Tasks"
                    value={checklist.length}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Completed"
                    value={completedCount}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Progress"
                    value={progress}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
              <Progress percent={progress} style={{ marginTop: 16 }} />
            </Card>
          )}
        </Col>
      </Row>

      {selectedEmployee && (
        <Card
          title={`Onboarding Checklist: ${selectedEmployee.name || `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim()}`}
          extra={
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateChecklist}
                disabled={checklist.length > 0}
              >
                Create Checklist
              </Button>
              {checklist.length > 0 && (
                <>
                  <Button icon={<PlusOutlined />} onClick={handleAddItem}>
                    Add Item
                  </Button>
                  <Button onClick={handleCreateCustom}>
                    Create Custom
                  </Button>
                </>
              )}
            </Space>
          }
        >
          {checklist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <Title level={4} type="secondary">No Onboarding Checklist</Title>
              <Text type="secondary">
                Create a checklist using a template or build a custom one
              </Text>
            </div>
          ) : (
            <Table
              columns={checklistColumns}
              dataSource={checklist.map(item => ({
                ...item,
                assigned_to_user: users.find(u => u.id === item.assigned_to),
                completed_by_user: users.find(u => u.id === item.completed_by),
              }))}
              loading={checklistLoading}
              rowKey="id"
              pagination={false}
            />
          )}
        </Card>
      )}

      {/* Template Selection Modal */}
      <Modal
        title="Use Default Template"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        onOk={handleUseTemplate}
        okText="Use Template"
        width={700}
      >
        <List
          dataSource={template}
          renderItem={(item, index) => (
            <List.Item>
              <Space>
                <Badge count={index + 1} />
                <div>
                  <Text strong>{item.task_name}</Text>
                  {item.description && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.description}
                      </Text>
                    </div>
                  )}
                  <Tag color={getCategoryColor(item.category)} style={{ marginTop: 4 }}>
                    {item.category?.toUpperCase() || 'OTHER'}
                  </Tag>
                </div>
              </Space>
            </List.Item>
          )}
        />
      </Modal>

      {/* Custom Checklist Modal */}
      <Modal
        title="Create Custom Checklist"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitChecklist}>
          <Form.List name="tasks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'task_name']}
                          label="Task Name"
                          rules={[{ required: true, message: 'Task name required' }]}
                        >
                          <Input placeholder="Task name" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'category']}
                          label="Category"
                          initialValue="other"
                        >
                          <Select>
                            <Option value="documentation">Documentation</Option>
                            <Option value="access">Access</Option>
                            <Option value="training">Training</Option>
                            <Option value="equipment">Equipment</Option>
                            <Option value="other">Other</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      label="Description"
                    >
                      <TextArea rows={2} placeholder="Task description" />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'due_date']}
                          label="Due Date"
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'assigned_to']}
                          label="Assign To"
                        >
                          <Select placeholder="Select user" allowClear>
                            {users.map((user) => (
                              <Option key={user.id} value={user.id}>
                                {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Button
                      type="link"
                      danger
                      onClick={() => remove(name)}
                      disabled={fields.length === 1}
                    >
                      Remove
                    </Button>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  Add Task
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        title={editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        onOk={() => itemForm.submit()}
        okText={editingItem ? 'Update' : 'Add'}
      >
        <Form form={itemForm} layout="vertical" onFinish={handleSubmitItem}>
          <Form.Item
            name="task_name"
            label="Task Name"
            rules={[{ required: true, message: 'Task name required' }]}
          >
            <Input placeholder="Task name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Task description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" initialValue="other">
                <Select>
                  <Option value="documentation">Documentation</Option>
                  <Option value="access">Access</Option>
                  <Option value="training">Training</Option>
                  <Option value="equipment">Equipment</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="due_date" label="Due Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="assigned_to" label="Assign To">
            <Select placeholder="Select user" allowClear>
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {editingItem && (
            <Form.Item name="status" label="Status">
              <Select>
                <Option value="pending">Pending</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="completed">Completed</Option>
                <Option value="skipped">Skipped</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Onboarding;


