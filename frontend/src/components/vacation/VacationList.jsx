import React, { useState } from 'react';
import { Table, Tag, Space, Button, Select, Popconfirm, message, Modal, Form, Input, DatePicker, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import axios from '../../axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS = {
  'En attente': 'gold',
  'Approuvé': 'green',
  'Rejeté': 'red'
};

const VacationList = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { data: vacations, loading, error, refresh } = useRealTimeData('/vacations');
  // const { user } = useAuth();

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/vacations/${id}`);
      
      message.success('Vacation request deleted successfully');
      refresh();
    } catch (error) {
      message.error('Failed to delete vacation request');
      console.error('Delete error:', error);
    }
  };

  const handleUpdate = async (values) => {
    try {
      await axios.put(`/vacations/${selectedVacation.id}`, 
        { 
          ...values,
          start_date: values.start_date.format('YYYY-MM-DD'),
          end_date: values.end_date.format('YYYY-MM-DD')
        }
      );
      
      message.success('Vacation request updated successfully');
      setIsModalVisible(false);
      refresh();
    } catch (error) {
      message.error('Failed to update vacation request');
      console.error('Update error:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/vacations/${id}/approve`, {});
      message.success('Vacation request approved successfully');
      refresh();
    } catch (error) {
      message.error('Failed to approve vacation request');
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`/vacations/${id}/reject`, {});
      message.success('Vacation request rejected successfully');
      refresh();
    } catch (error) {
      message.error('Failed to reject vacation request');
      console.error('Reject error:', error);
    }
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (text) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => <Tooltip title={`Vacation Type: ${text}`}><span style={{ fontWeight: 'bold', color: '#277dfe' }}>{text}</span></Tooltip>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLORS[status]} style={{ fontSize: '14px', padding: '5px 10px', borderRadius: '8px' }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} style={{ color: '#277dfe' }} onClick={() => {
            setSelectedVacation(record);
            setIsModalVisible(true);
          }}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this vacation?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" icon={<DeleteOutlined />} danger>Delete</Button>
          </Popconfirm>
          <Button type="link" style={{ color: 'green' }} onClick={() => handleApprove(record.id)}>
            Approve
          </Button>
          <Button type="link" style={{ color: 'red' }} onClick={() => handleReject(record.id)}>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  // Prepare filtered data
  const filteredVacations = React.useMemo(() => {
    let filtered = Array.isArray(vacations) ? vacations : [];
    if (statusFilter) {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    if (dateRange && Array.isArray(dateRange) && dateRange[0] && dateRange[1]) {
      const [start, end] = dateRange;
      filtered = filtered.filter(v => {
        const vStart = dayjs(v.start_date);
        const vEnd = dayjs(v.end_date);
        return vStart.isSameOrAfter(start, 'day') && vEnd.isSameOrBefore(end, 'day');
      });
    }
    return filtered;
  }, [vacations, statusFilter, dateRange]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f7fa', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
        <Select
          placeholder="Filter by status"
          onChange={setStatusFilter}
          style={{ width: 200 }}
          allowClear
          suffixIcon={<FilterOutlined />}
        >
          <Option value="En attente">En attente</Option>
          <Option value="Approuvé">Approuvé</Option>
          <Option value="Rejeté">Rejeté</Option>
        </Select>
        <DatePicker.RangePicker
          onChange={setDateRange}
          style={{ width: 300 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredVacations}
        loading={loading}
        rowKey="id"
        bordered
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showQuickJumper: true,
        }}
        style={{
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
        }}
        rowClassName={() => 'table-row-hover'}
      />
      <Modal
        title="Edit Vacation"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item name="reason" label="Reason">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VacationList;
