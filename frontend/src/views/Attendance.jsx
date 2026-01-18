import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Space, Typography, message, DatePicker, Tabs, Tag } from 'antd';
import axios from '../axios';
import PageContainer from '../components/PageContainer';
import dayjs from 'dayjs';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Text } = Typography;

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [approvalRecords, setApprovalRecords] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const { user } = useStateContext();
  const [activeTab, setActiveTab] = useState('my');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        date_from: dateRange[0]?.format('YYYY-MM-DD'),
        date_to: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const res = await axios.get('/attendance/records', { params });
      const data = res.data.data || res.data;
      setRecords(data?.data || data);
    } catch {
      message.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalRecords = async () => {
    // Only for managers/admins
    try {
      setLoading(true);
      const params = {
        // Need backend support to filter by "unapproved" or "subordinates"
        // For now, fetch all and filter client side or assume backend handles it
        // We might need a separate endpoint like /attendance/approvals
        date_from: dateRange[0]?.format('YYYY-MM-DD'),
        date_to: dateRange[1]?.format('YYYY-MM-DD'),
      };
      // Re-using same endpoint but without user_id filter usually returns all if admin
      // Ideally, we add a specific query param like 'scope=team'
      const res = await axios.get('/attendance/records', { params: { ...params, scope: 'team' } }); 
      const data = res.data.data || res.data;
      setApprovalRecords(data?.data || data);
    } catch {
      console.log('Failed to load approvals or permission denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my') {
      fetchRecords();
    } else {
      fetchApprovalRecords();
    }
  }, [activeTab, dateRange]);

  const clockIn = async () => {
    try {
      setLoading(true);
      await axios.post('/attendance/clock-in');
      message.success('Clocked in');
      fetchRecords();
    } catch (e) {
      message.error(e.response?.data?.error || 'Clock-in failed');
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async () => {
    try {
      setLoading(true);
      await axios.post('/attendance/clock-out');
      message.success('Clocked out');
      fetchRecords();
    } catch (e) {
      message.error(e.response?.data?.error || 'Clock-out failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/attendance/${id}/approve`);
      message.success('Record approved');
      fetchApprovalRecords();
    } catch (e) {
      message.error('Failed to approve');
    }
  };

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const color = status === 'present' ? 'green' : status === 'late' ? 'orange' : 'red';
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      }
    },
    { title: 'Clock In', dataIndex: 'clock_in_time', key: 'clock_in_time',
      render: (v) => v ? dayjs(v).format('HH:mm') : '-' },
    { title: 'Clock Out', dataIndex: 'clock_out_time', key: 'clock_out_time',
      render: (v) => v ? dayjs(v).format('HH:mm') : '-' },
    { title: 'Overtime', dataIndex: 'overtime_minutes', key: 'overtime_minutes',
      render: (v) => v ? `${v} min` : '-' },
    { 
      title: 'Approval', 
      key: 'approval',
      render: (_, record) => record.approved_at ? <Tag color="green">Approved</Tag> : <Tag>Pending</Tag>
    }
  ];

  const approvalColumns = [
    { title: 'Employee', key: 'user', render: (_, r) => r.user?.name || 'Unknown' },
    ...columns,
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => !record.approved_at && (
        <Button 
          type="primary" 
          size="small" 
          icon={<CheckOutlined />} 
          onClick={() => handleApprove(record.id)}
        >
          Approve
        </Button>
      )
    }
  ];

  const items = [
    {
      key: 'my',
      label: 'My Attendance',
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={clockIn} loading={loading}>Clock In</Button>
            <Button onClick={clockOut} loading={loading}>Clock Out</Button>
          </Space>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={records}
            columns={columns}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 600 }}
          />
        </>
      ),
    },
    // Only show if user has permission (simple check for now, can be robust)
    (user?.role?.name === 'admin' || user?.role?.name === 'manager' || user?.permissions?.includes('attendance.approve')) && {
      key: 'approvals',
      label: 'Approvals',
      children: (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={approvalRecords}
          columns={approvalColumns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      ),
    }
  ].filter(Boolean);

  return (
    <PageContainer title="Attendance">
      <Space style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(val) => setDateRange(val)}
          allowClear={false}
        />
        <Button onClick={() => activeTab === 'my' ? fetchRecords() : fetchApprovalRecords()}>Filter</Button>
      </Space>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
      </Card>
    </PageContainer>
  );
};

export default Attendance;
