import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import KanbanBoard from '../components/KanbanBoard';
import { useCompany } from '../contexts/CompanyContext';

const { TextArea } = Input;
const { Option } = Select;

const KanbanBoards = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form] = Form.useForm();
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (currentCompany) {
      fetchBoards();
      fetchProjects();
    }
  }, [currentCompany]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/kanban-boards');
      setBoards(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching boards:', error);
      message.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        settings: {
          columns: ['todo', 'in_progress', 'review', 'done'],
        },
      };

      if (editingBoard) {
        await axios.put(`/kanban-boards/${editingBoard.id}`, payload);
        message.success('Board updated successfully');
      } else {
        await axios.post('/kanban-boards', payload);
        message.success('Board created successfully');
      }

      setModalVisible(false);
      setEditingBoard(null);
      form.resetFields();
      fetchBoards();
    } catch (error) {
      message.error('Failed to save board');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/kanban-boards/${id}`);
      message.success('Board deleted successfully');
      if (selectedBoard?.id === id) {
        setSelectedBoard(null);
      }
      fetchBoards();
    } catch (error) {
      message.error('Failed to delete board');
    }
  };

  if (selectedBoard) {
    return (
      <div>
        <Button
          style={{ margin: '24px 0 0 24px' }}
          onClick={() => setSelectedBoard(null)}
        >
          ← Back to Boards
        </Button>
        <KanbanBoard boardId={selectedBoard.id} />
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <ApartmentOutlined />
            <span>Kanban Boards</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingBoard(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Create Board
          </Button>
        }
      >
        {boards.length === 0 ? (
          <Empty
            description="No boards yet. Create your first board to get started!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={boards}
            renderItem={(board) => (
              <List.Item>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  actions={[
                    <EditOutlined
                      key="edit"
                      onClick={() => {
                        setEditingBoard(board);
                        form.setFieldsValue(board);
                        setModalVisible(true);
                      }}
                    />,
                    <Popconfirm
                      key="delete"
                      title="Delete this board?"
                      onConfirm={() => handleDelete(board.id)}
                    >
                      <DeleteOutlined />
                    </Popconfirm>,
                  ]}
                  onClick={() => setSelectedBoard(board)}
                >
                  <Card.Meta
                    avatar={<ProjectOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={board.name}
                    description={
                      <div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                          {board.description || 'No description'}
                        </div>
                        {board.project && (
                          <div style={{ marginTop: 4, fontSize: 11, color: '#52c41a' }}>
                            Project: {board.project.title}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Create/Edit Board Modal */}
      <Modal
        title={editingBoard ? 'Edit Board' : 'Create Board'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingBoard(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="Board Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="project_id" label="Link to Project">
            <Select
              showSearch
              placeholder="Select project (optional)"
              allowClear
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name || project.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingBoard ? 'Update' : 'Create'} Board
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KanbanBoards;

