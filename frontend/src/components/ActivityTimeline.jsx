import React, { useState, useEffect } from 'react';
import { Timeline, Card, Avatar, Tag, Typography, Empty, Spin, Select, DatePicker, Space, Button } from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';
import { useCompany } from '../contexts/CompanyContext';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const ActivityTimeline = ({ 
  modelType = null, 
  modelId = null, 
  showFilters = true,
  limit = 50 
}) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: null,
    user_id: null,
    start_date: null,
    end_date: null,
  });
  const { currentCompany } = useCompany();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let url = '/audit-logs';
      const params = new URLSearchParams();

      if (modelType && modelId) {
        url = `/audit-logs/model/${modelType}/${modelId}`;
      } else {
        if (filters.action) params.append('action', filters.action);
        if (filters.user_id) params.append('user_id', filters.user_id);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setActivities(data.slice(0, limit));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany) {
      fetchActivities();
    }
  }, [currentCompany, filters, modelType, modelId]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <PlusOutlined style={{ color: '#52c41a' }} />;
      case 'updated':
        return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'deleted':
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      case 'viewed':
        return <EyeOutlined style={{ color: '#722ed1' }} />;
      default:
        return <FileTextOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'success';
      case 'updated':
        return 'processing';
      case 'deleted':
        return 'error';
      case 'viewed':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatModelName = (modelType) => {
    if (!modelType) return 'Record';
    const parts = modelType.split('\\');
    return parts[parts.length - 1];
  };

  const formatChanges = (changes) => {
    if (!changes || typeof changes !== 'object') return null;
    
    try {
      const parsed = typeof changes === 'string' ? JSON.parse(changes) : changes;
      return Object.entries(parsed).map(([key, value]) => ({
        field: key,
        old: value.old,
        new: value.new,
      }));
    } catch {
      return null;
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setFilters({
        ...filters,
        start_date: null,
        end_date: null,
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      action: null,
      user_id: null,
      start_date: null,
      end_date: null,
    });
  };

  if (loading && activities.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <span>Activity Timeline</span>
          {modelType && modelId && (
            <Tag color="blue">
              {formatModelName(modelType)} #{modelId}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          {showFilters && (
            <>
              <Select
                placeholder="Filter by action"
                allowClear
                style={{ width: 150 }}
                value={filters.action}
                onChange={(value) => setFilters({ ...filters, action: value })}
              >
                <Select.Option value="created">Created</Select.Option>
                <Select.Option value="updated">Updated</Select.Option>
                <Select.Option value="deleted">Deleted</Select.Option>
                <Select.Option value="viewed">Viewed</Select.Option>
              </Select>
              <RangePicker
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                placeholder={['Start Date', 'End Date']}
              />
              {(filters.action || filters.start_date) && (
                <Button onClick={clearFilters} size="small">
                  Clear
                </Button>
              )}
            </>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchActivities}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        </Space>
      }
    >
      {activities.length === 0 ? (
        <Empty
          description="No activity found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Timeline
          mode="left"
          items={activities.map((activity) => {
            const changes = formatChanges(activity.changes);
            const modelName = formatModelName(activity.model_type);

            return {
              dot: (
                <Avatar
                  icon={getActionIcon(activity.action)}
                  style={{
                    backgroundColor: activity.action === 'created' ? '#f6ffed' :
                                   activity.action === 'updated' ? '#e6f7ff' :
                                   activity.action === 'deleted' ? '#fff1f0' :
                                   '#f0f0f0',
                    border: `2px solid ${
                      activity.action === 'created' ? '#52c41a' :
                      activity.action === 'updated' ? '#1890ff' :
                      activity.action === 'deleted' ? '#ff4d4f' :
                      '#8c8c8c'
                    }`,
                  }}
                />
              ),
              children: (
                <div style={{ marginBottom: 24 }}>
                  <Space style={{ marginBottom: 8 }}>
                    <Tag color={getActionColor(activity.action)}>
                      {activity.action?.toUpperCase()}
                    </Tag>
                    <Text strong>{modelName}</Text>
                    {activity.model_id && (
                      <Text type="secondary">#{activity.model_id}</Text>
                    )}
                  </Space>
                  
                  <div style={{ marginBottom: 8 }}>
                    {activity.user ? (
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <Text>{activity.user.name || 'System'}</Text>
                      </Space>
                    ) : (
                      <Text type="secondary">System</Text>
                    )}
                  </div>

                  {changes && changes.length > 0 && (
                    <Card
                      size="small"
                      style={{
                        marginTop: 8,
                        backgroundColor: '#fafafa',
                        border: '1px solid #e8e8e8',
                      }}
                    >
                      <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                        Changes:
                      </Text>
                      {changes.map((change, idx) => (
                        <div key={idx} style={{ marginBottom: 4, fontSize: 12 }}>
                          <Text strong>{change.field}:</Text>{' '}
                          <Text delete style={{ color: '#ff4d4f' }}>
                            {change.old !== null && change.old !== undefined ? String(change.old) : 'null'}
                          </Text>
                          {' → '}
                          <Text style={{ color: '#52c41a' }}>
                            {change.new !== null && change.new !== undefined ? String(change.new) : 'null'}
                          </Text>
                        </div>
                      ))}
                    </Card>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(activity.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                    {activity.ip_address && (
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        • {activity.ip_address}
                      </Text>
                    )}
                  </div>
                </div>
              ),
            };
          })}
        />
      )}
    </Card>
  );
};

export default ActivityTimeline;




