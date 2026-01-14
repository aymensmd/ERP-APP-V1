import React, { useState, useEffect, useCallback } from 'react';
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
  TimePicker,
  Row,
  Col,
  Tabs,
  Calendar,
  Badge,
  Typography,
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import { useCompany } from '../contexts/CompanyContext';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const Shifts = () => {
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [form] = Form.useForm();
  const [assignmentForm] = Form.useForm();
  const { currentCompany } = useCompany();

  

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/shifts');
      setShifts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      message.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get('/employees');
      setEmployees(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const startDate = selectedDate.startOf('month').format('YYYY-MM-DD');
      const endDate = selectedDate.endOf('month').format('YYYY-MM-DD');
      const response = await axios.get(`/shift-assignments?start_date=${startDate}&end_date=${endDate}`);
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      message.error('Failed to load assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (currentCompany) {
      fetchShifts();
      fetchEmployees();
      fetchAssignments();
    }
  }, [currentCompany, fetchShifts, fetchEmployees, fetchAssignments]);

  useEffect(() => {
    if (currentCompany) {
      fetchAssignments();
    }
  }, [currentCompany, selectedDate, fetchAssignments]);
  const handleCreateShift = () => {
    setEditingShift(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      days_of_week: [],
    });
    setShiftModalVisible(true);
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    form.setFieldsValue({
      ...shift,
      start_time: shift.start_time ? dayjs(shift.start_time, 'HH:mm') : null,
      end_time: shift.end_time ? dayjs(shift.end_time, 'HH:mm') : null,
      days_of_week: shift.days_of_week || [],
    });
    setShiftModalVisible(true);
  };

  const handleSubmitShift = async (values) => {
    try {
      const payload = {
        ...values,
        start_time: values.start_time.format('HH:mm'),
        end_time: values.end_time.format('HH:mm'),
      };

      if (editingShift) {
        await axios.put(`/shifts/${editingShift.id}`, payload);
        message.success('Shift updated successfully');
      } else {
        await axios.post('/shifts', payload);
        message.success('Shift created successfully');
      }

      setShiftModalVisible(false);
      fetchShifts();
    } catch (error) {
      console.error('Shift save error:', error);
      message.error(error.response?.data?.error || 'Failed to save shift');
    }
  };

  const handleDeleteShift = async (id) => {
    try {
      await axios.delete(`/shifts/${id}`);
      message.success('Shift deleted successfully');
      fetchShifts();
    } catch {
      message.error('Failed to delete shift');
    }
  };

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    assignmentForm.resetFields();
    assignmentForm.setFieldsValue({
      assignment_date: dayjs(),
    });
    setAssignmentModalVisible(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    assignmentForm.setFieldsValue({
      ...assignment,
      assignment_date: assignment.assignment_date ? dayjs(assignment.assignment_date) : null,
      start_time: assignment.start_time ? dayjs(assignment.start_time, 'HH:mm') : null,
      end_time: assignment.end_time ? dayjs(assignment.end_time, 'HH:mm') : null,
      user_id: assignment.user_id,
      shift_id: assignment.shift_id,
    });
    setAssignmentModalVisible(true);
  };

  const handleSubmitAssignment = async (values) => {
    try {
      const payload = {
        ...values,
        assignment_date: values.assignment_date.format('YYYY-MM-DD'),
        start_time: values.start_time ? values.start_time.format('HH:mm') : null,
        end_time: values.end_time ? values.end_time.format('HH:mm') : null,
      };

      if (editingAssignment) {
        await axios.put(`/shift-assignments/${editingAssignment.id}`, payload);
        message.success('Assignment updated successfully');
      } else {
        await axios.post('/shift-assignments', payload);
        message.success('Shift assigned successfully');
      }

      setAssignmentModalVisible(false);
      fetchAssignments();
    } catch (error) {
      console.error('Assignment save error:', error);
      message.error(error.response?.data?.error || 'Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (id) => {
    try {
      await axios.delete(`/shift-assignments/${id}`);
      message.success('Assignment deleted successfully');
      fetchAssignments();
    } catch {
      message.error('Failed to delete assignment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'blue',
      confirmed: 'green',
      completed: 'success',
      cancelled: 'default',
      no_show: 'error',
    };
    return colors[status] || 'default';
  };

  const getDateCellData = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return assignments.filter(a => a.assignment_date === dateStr);
  };

  const dateCellRender = (date) => {
    const dayAssignments = getDateCellData(date);
    if (dayAssignments.length === 0) return null;

    return (
      <div style={{ fontSize: 10 }}>
        {dayAssignments.slice(0, 3).map((assignment, index) => (
          <Badge
            key={index}
            status="processing"
            text={
              <span style={{ fontSize: 10 }}>
                {assignment.user?.name || `${assignment.user?.first_name || ''} ${assignment.user?.last_name || ''}`.trim()}
              </span>
            }
          />
        ))}
        {dayAssignments.length > 3 && (
          <div style={{ fontSize: 10, color: '#1890ff' }}>
            +{dayAssignments.length - 3} more
          </div>
        )}
      </div>
    );
  };

  const shiftColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => time || '-',
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time) => time || '-',
    },
    {
      title: 'Duration',
      dataIndex: 'duration_hours',
      key: 'duration_hours',
      render: (hours) => `${hours || 0} hours`,
    },
    {
      title: 'Days of Week',
      dataIndex: 'days_of_week',
      key: 'days_of_week',
      render: (days) => {
        if (!days || days.length === 0) return '-';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(d => dayNames[d]).join(', ');
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditShift(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this shift?"
            onConfirm={() => handleDeleteShift(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const assignmentColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        record.user?.name || `${record.user?.first_name || ''} ${record.user?.last_name || ''}`.trim() || 'N/A'
      ),
    },
    {
      title: 'Shift',
      key: 'shift',
      render: (_, record) => record.shift?.name || 'N/A',
    },
    {
      title: 'Date',
      dataIndex: 'assignment_date',
      key: 'assignment_date',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => time || '-',
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time) => time || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || 'SCHEDULED'}
        </Tag>
      ),
    },
    {
      title: 'Assigned By',
      key: 'assigned_by',
      render: (_, record) => record.assigned_by_user?.name || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditAssignment(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this assignment?"
            onConfirm={() => handleDeleteAssignment(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs
        items={[
          {
            key: 'shifts',
            label: 'Shift Definitions',
            children: (
              <Card
                title="Shift Definitions"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateShift}>
                    Create Shift
                  </Button>
                }
              >
                <Table
                  columns={shiftColumns}
                  dataSource={shifts}
                  loading={loading}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'assignments',
            label: 'Shift Assignments',
            children: (
              <Card
                title="Shift Assignments"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAssignment}>
                    Assign Shift
                  </Button>
                }
              >
                <Table
                  columns={assignmentColumns}
                  dataSource={assignments}
                  loading={assignmentsLoading}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
          {
            key: 'calendar',
            label: 'Shift Calendar',
            children: (
              <Card title="Shift Calendar">
                <Calendar
                  value={selectedDate}
                  onChange={setSelectedDate}
                  dateCellRender={dateCellRender}
                  onPanelChange={setSelectedDate}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Shift Modal */}
      <Modal
        title={editingShift ? 'Edit Shift' : 'Create Shift'}
        open={shiftModalVisible}
        onCancel={() => setShiftModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitShift}>
          <Form.Item
            name="name"
            label="Shift Name"
            rules={[{ required: true, message: 'Shift name required' }]}
          >
            <Input placeholder="e.g., Morning Shift, Night Shift" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label="Start Time"
                rules={[{ required: true, message: 'Start time required' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="End Time"
                rules={[{ required: true, message: 'End time required' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Shift description" />
          </Form.Item>

          <Form.Item name="days_of_week" label="Days of Week">
            <Checkbox.Group>
              {dayNames.map((day, index) => (
                <Checkbox key={index} value={index}>
                  {day}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked">
            <Checkbox>Active</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        title={editingAssignment ? 'Edit Assignment' : 'Assign Shift'}
        open={assignmentModalVisible}
        onCancel={() => setAssignmentModalVisible(false)}
        onOk={() => assignmentForm.submit()}
        width={600}
        okText="Save"
      >
        <Form form={assignmentForm} layout="vertical" onFinish={handleSubmitAssignment}>
          <Form.Item
            name="user_id"
            label="Employee"
            rules={[{ required: true, message: 'Employee required' }]}
          >
            <Select placeholder="Select employee" showSearch optionFilterProp="children">
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.id}>
                  {emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="shift_id"
            label="Shift"
            rules={[{ required: true, message: 'Shift required' }]}
          >
            <Select placeholder="Select shift" showSearch optionFilterProp="children">
              {shifts.filter(s => s.is_active).map((shift) => (
                <Option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.start_time} - {shift.end_time})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="assignment_date"
            label="Assignment Date"
            rules={[{ required: true, message: 'Date required' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="Start Time (Optional)">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="End Time (Optional)">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {editingAssignment && (
            <Form.Item name="status" label="Status">
              <Select>
                <Option value="scheduled">Scheduled</Option>
                <Option value="confirmed">Confirmed</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="no_show">No Show</Option>
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

export default Shifts;


