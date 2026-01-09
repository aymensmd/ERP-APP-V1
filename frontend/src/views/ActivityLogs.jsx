import React from 'react';
import { Card, Typography, Space } from 'antd';
import ActivityTimeline from '../components/ActivityTimeline';
import { HistoryOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ActivityLogs = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space>
            <HistoryOutlined style={{ fontSize: 24 }} />
            <Title level={2} style={{ margin: 0 }}>
              Activity Logs
            </Title>
          </Space>
        </Card>

        <ActivityTimeline showFilters={true} limit={100} />
      </Space>
    </div>
  );
};

export default ActivityLogs;




