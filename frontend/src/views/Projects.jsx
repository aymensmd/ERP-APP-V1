import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Tag, Input, List, Avatar, Progress, ConfigProvider, Spin, message, Modal, Form, DatePicker, Select } from 'antd';
import { PlusOutlined, TeamOutlined, CalendarOutlined, CheckCircleOutlined, EditOutlined, ProjectOutlined, DeleteOutlined } from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import axios from '../axios';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const statusColors = {
  'In Progress': 'blue',
  'Completed': 'green',
  'Planned': 'orange',
};

const Projects = () => {
  const { theme } = useStateContext();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();

  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      primary: '#1890ff',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.65)',
      border: '#303030',
      primary: '#177ddc',
    }
  };

  const colors = themeStyles[theme];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/projects');
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        message.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get('/employees');
        setUsers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchProjects();
    fetchUsers();
  }, []);

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      dateRange: project.start_date && project.due ? [dayjs(project.start_date), dayjs(project.due)] : null,
      location: project.location,
      team: project.team?.map(member => {
        const user = users.find(u => u.name === member);
        return user?.id;
      }).filter(Boolean) || []
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const projectData = {
        name: values.name,
        description: values.description,
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        due: values.dateRange[1].format('YYYY-MM-DD'),
        location: values.location,
        team: values.team || []
      };

      if (editingProject) {
        await axios.put(`/projects/${editingProject.id}`, projectData);
        message.success('Project updated successfully');
      } else {
        await axios.post('/projects', projectData);
        message.success('Project created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      
      // Refresh projects list
      const response = await axios.get('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error saving project:', error);
      message.error(error.response?.data?.error || 'Failed to save project');
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axios.delete(`/projects/${projectId}`);
        message.success('Project deleted successfully');
        // Refresh projects list
        const response = await axios.get('/projects');
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch {
        message.error('Failed to delete project');
      }
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

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
        padding: '32px', 
        minHeight: 'calc(100vh - 64px)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '32px' }}>
          <Col>
            <Title level={2} style={{ 
              marginBottom: '8px', 
              color: colors.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ProjectOutlined style={{ color: colors.primary }} />
              Projects
            </Title>
            <Text type="secondary" style={{ color: colors.textSecondary, fontSize: '16px' }}>
              Manage and track all your company projects here.
            </Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="large"
              onClick={handleCreate}
            >
              New Project
            </Button>
          </Col>
        </Row>
        <Row style={{ marginBottom: '32px' }}>
          <Col span={24}>
            <Input.Search
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 400 }}
              size="large"
              allowClear
              onSearch={() => {
                // Search handled by filtering
              }}
            />
          </Col>
        </Row>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <List
            grid={{ gutter: [24, 24], xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
            dataSource={filteredProjects}
            locale={{ emptyText: 'No projects found' }}
            renderItem={project => (
            <List.Item>
              <Card
                title={
                  <span style={{ fontWeight: 600 }}>
                    {project.name} 
                    <Tag color={statusColors[project.status]} style={{ marginLeft: 8 }}>
                      {project.status}
                    </Tag>
                  </span>
                }
                extra={
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      icon={<EditOutlined />} 
                      size="small" 
                      type="text"
                      onClick={() => handleEdit(project)}
                    >
                      Edit
                    </Button>
                    <Button 
                      icon={<DeleteOutlined />} 
                      size="small" 
                      type="text"
                      danger
                      onClick={() => handleDelete(project.id)}
                    >
                      Delete
                    </Button>
                  </div>
                }
                variant="outlined"
                hoverable
                style={{ 
                  borderRadius: '16px', 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: `1px solid ${colors.border}`,
                  minHeight: 260,
                  transition: 'all 0.2s ease'
                }}
              >
                <Paragraph style={{ color: colors.textSecondary, marginBottom: '16px' }}>
                  {project.description}
                </Paragraph>
                <div style={{ marginBottom: '12px', color: colors.textPrimary }}>
                  <TeamOutlined style={{ marginRight: 8, color: colors.primary }} />
                  <Text>Team: {project.team && project.team.length > 0 ? project.team.join(', ') : 'No team members'}</Text>
                </div>
                <div style={{ marginBottom: '12px', color: colors.textPrimary }}>
                  <CalendarOutlined style={{ marginRight: 8, color: colors.primary }} />
                  <Text>Due: {project.due}</Text>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <CheckCircleOutlined style={{ marginRight: 8, color: colors.primary }} />
                  <Text style={{ marginRight: 8 }}>Progress:</Text>
                  <Progress 
                    percent={project.progress} 
                    size="small" 
                    strokeColor={{
                      '0%': colors.primary,
                      '100%': '#52c41a',
                    }}
                  />
                </div>
              </Card>
            </List.Item>
            )}
          />
        )}

        {/* Create/Edit Project Modal */}
        <Modal
          title={editingProject ? 'Edit Project' : 'Create New Project'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingProject(null);
          }}
          footer={null}
          width={600}
          styles={{
            body: {
              padding: '24px',
              background: colors.cardBg,
            }
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="Project Name"
              rules={[{ required: true, message: 'Please enter project name' }]}
            >
              <Input placeholder="Enter project name" size="large" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="Enter project description"
              />
            </Form.Item>

            <Form.Item
              name="dateRange"
              label="Start Date & End Date"
              rules={[{ required: true, message: 'Please select date range' }]}
            >
              <DatePicker.RangePicker 
                style={{ width: '100%' }}
                size="large"
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item
              name="location"
              label="Location"
            >
              <Input placeholder="Enter project location" size="large" />
            </Form.Item>

            <Form.Item
              name="team"
              label="Team Members"
            >
              <Select
                mode="multiple"
                placeholder="Select team members"
                size="large"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={users.map(user => ({
                  value: user.id,
                  label: user.name,
                }))}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large"
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Projects;
