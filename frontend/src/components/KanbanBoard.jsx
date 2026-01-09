import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Avatar,
  Popconfirm,
  message,
  Empty,
  Spin,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  FlagOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';
import { useCompany } from '../contexts/CompanyContext';

const { TextArea } = Input;
const { Option } = Select;

const KanbanBoard = ({ boardId }) => {
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const { currentCompany } = useCompany();

  const defaultColumns = ['todo', 'in_progress', 'review', 'done'];

  useEffect(() => {
    if (boardId) {
      fetchBoard();
      fetchUsers();
    }
  }, [boardId]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/employees');
      setUsers(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/kanban-boards/${boardId}`);
      setBoard(response.data.board);
      
      // Group tasks by status
      const grouped = {};
      defaultColumns.forEach(col => {
        grouped[col] = [];
      });
      
      if (response.data.tasks) {
        Object.entries(response.data.tasks).forEach(([status, taskList]) => {
          grouped[status] = Array.isArray(taskList) ? taskList : [];
        });
      }
      
      setTasks(grouped);
    } catch (error) {
      console.error('Error fetching board:', error);
      message.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (values) => {
    try {
      // Remove undefined/null values to avoid sending them
      const payload = {
        board_id: boardId,
        title: values.title,
        description: values.description || null,
        status: values.status || 'todo',
        priority: values.priority || 'medium',
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        assigned_to: values.assigned_to || null,
        tags: values.tags || null,
        estimated_hours: values.estimated_hours || null,
      };
      
      // Remove null values
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      if (editingTask) {
        await axios.put(`/kanban-tasks/${editingTask.id}`, payload);
        message.success('Task updated successfully');
      } else {
        await axios.post('/kanban-tasks', payload);
        message.success('Task created successfully');
      }

      setTaskModalVisible(false);
      setEditingTask(null);
      form.resetFields();
      fetchBoard();
    } catch (error) {
      console.error('Task save error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to save task';
      message.error(errorMessage);
      if (error.response?.data?.messages) {
        // Show validation errors
        Object.values(error.response.data.messages).flat().forEach(msg => {
          message.error(msg);
        });
      }
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await axios.delete(`/kanban-tasks/${taskId}`);
      message.success('Task deleted successfully');
      fetchBoard();
    } catch (error) {
      message.error('Failed to delete task');
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(column);
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    const sourceColumn = draggedTask.status;
    
    if (sourceColumn === targetColumn) {
      setDraggedTask(null);
      setDraggedOverColumn(null);
      return;
    }

    try {
      // Update task status and position
      const targetTasks = tasks[targetColumn] || [];
      const maxPosition = targetTasks.length > 0 
        ? Math.max(...targetTasks.map(t => t.position || 0))
        : 0;

      await axios.put(`/kanban-tasks/${draggedTask.id}`, {
        status: targetColumn,
        position: maxPosition + 1,
      });

      message.success('Task moved successfully');
      fetchBoard();
    } catch (error) {
      message.error('Failed to move task');
    } finally {
      setDraggedTask(null);
      setDraggedOverColumn(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'processing',
      high: 'warning',
      urgent: 'error',
    };
    return colors[priority] || 'default';
  };

  const getColumnTitle = (column) => {
    const titles = {
      todo: 'To Do',
      in_progress: 'In Progress',
      review: 'Review',
      done: 'Done',
    };
    return titles[column] || column;
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!board) {
    return (
      <Card>
        <Empty description="Board not found" />
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <Card
        title={
          <Space>
            <span>{board.name}</span>
            {board.description && (
              <span style={{ fontSize: 14, color: '#8c8c8c' }}>{board.description}</span>
            )}
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTask(null);
              form.resetFields();
              form.setFieldsValue({ status: 'todo' });
              setTaskModalVisible(true);
            }}
          >
            Add Task
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', minHeight: '600px' }}>
          {defaultColumns.map((column) => {
            const columnTasks = tasks[column] || [];
            const isDraggedOver = draggedOverColumn === column;

            return (
              <div
                key={column}
                style={{
                  flex: 1,
                  minWidth: 300,
                  background: isDraggedOver ? '#e6f7ff' : '#ffffff',
                  borderRadius: 8,
                  padding: 16,
                  border: `2px solid ${isDraggedOver ? '#1890ff' : '#f0f0f0'}`,
                  transition: 'all 0.3s',
                }}
                onDragOver={(e) => handleDragOver(e, column)}
                onDrop={(e) => handleDrop(e, column)}
                onDragLeave={() => setDraggedOverColumn(null)}
              >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    {getColumnTitle(column)}
                  </h3>
                  <Badge count={columnTasks.length} showZero style={{ backgroundColor: '#1890ff' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {columnTasks.length === 0 ? (
                    <div
                      style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#8c8c8c',
                        border: '2px dashed #d9d9d9',
                        borderRadius: 8,
                      }}
                    >
                      Drop tasks here
                    </div>
                  ) : (
                    columnTasks
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          style={{
                            cursor: 'move',
                            marginBottom: 12,
                          }}
                        >
                          <Card
                            size="small"
                            style={{
                              border: `1px solid ${task.id === draggedTask?.id ? '#1890ff' : '#f0f0f0'}`,
                              boxShadow: task.id === draggedTask?.id ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                              transition: 'all 0.2s',
                            }}
                            actions={[
                              <EditOutlined
                                key="edit"
                                onClick={() => {
                                  setEditingTask(task);
                                  form.setFieldsValue({
                                    ...task,
                                    due_date: task.due_date ? dayjs(task.due_date) : null,
                                  });
                                  setTaskModalVisible(true);
                                }}
                              />,
                              <Popconfirm
                                key="delete"
                                title="Delete this task?"
                                onConfirm={() => handleDelete(task.id)}
                              >
                                <DeleteOutlined />
                              </Popconfirm>,
                            ]}
                          >
                          <div>
                            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
                                {task.description.length > 100
                                  ? `${task.description.substring(0, 100)}...`
                                  : task.description}
                              </div>
                            )}
                            <Space style={{ marginBottom: 8 }} wrap>
                              <Tag color={getPriorityColor(task.priority)}>
                                <FlagOutlined /> {task.priority}
                              </Tag>
                              {task.due_date && (
                                <Tag color={dayjs(task.due_date).isBefore(dayjs()) ? 'error' : 'default'}>
                                  <CalendarOutlined /> {dayjs(task.due_date).format('MMM DD')}
                                </Tag>
                              )}
                            </Space>
                            {task.assignedTo && (
                              <div style={{ marginTop: 8 }}>
                                <Avatar size="small" icon={<UserOutlined />}>
                                  {task.assignedTo.name?.charAt(0)}
                                </Avatar>
                                <span style={{ marginLeft: 8, fontSize: 12 }}>
                                  {task.assignedTo.name}
                                </span>
                              </div>
                            )}
                          </div>
                          </Card>
                        </div>
                      ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Task Modal */}
      <Modal
        title={editingTask ? 'Edit Task' : 'Create Task'}
        open={taskModalVisible}
        onCancel={() => {
          setTaskModalVisible(false);
          setEditingTask(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleTaskSubmit} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              {defaultColumns.map(col => (
                <Option key={col} value={col}>{getColumnTitle(col)}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select defaultValue="medium">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="Due Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
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
          <Form.Item name="estimated_hours" label="Estimated Hours">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingTask ? 'Update' : 'Create'} Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KanbanBoard;

