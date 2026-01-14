import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Space, Typography, message, DatePicker } from 'antd';
import axios from '../axios';
import PageContainer from '../components/PageContainer';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);

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

  useEffect(() => {
    fetchRecords();
  }, []);

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

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Clock In', dataIndex: 'clock_in_time', key: 'clock_in_time',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: 'Clock Out', dataIndex: 'clock_out_time', key: 'clock_out_time',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: 'Overtime (min)', dataIndex: 'overtime_minutes', key: 'overtime_minutes' },
  ];

  return (
    <PageContainer title="Attendance">
      <Space style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(val) => setDateRange(val)}
          allowClear
        />
        <Button onClick={fetchRecords}>Filter</Button>
        <Button type="primary" onClick={clockIn} loading={loading}>Clock In</Button>
        <Button onClick={clockOut} loading={loading}>Clock Out</Button>
      </Space>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={records}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </PageContainer>
  );
};

export default Attendance;
