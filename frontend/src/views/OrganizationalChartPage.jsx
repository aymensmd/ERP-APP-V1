import React from 'react';
import { Card, Typography, Space } from 'antd';
import OrganizationalChart from '../components/OrganizationalChart';
import { ApartmentOutlined } from '@ant-design/icons';

const { Title } = Typography;

const OrganizationalChartPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space>
            <ApartmentOutlined style={{ fontSize: 24 }} />
            <Title level={2} style={{ margin: 0 }}>
              Organizational Chart
            </Title>
          </Space>
        </Card>

        <OrganizationalChart />
      </Space>
    </div>
  );
};

export default OrganizationalChartPage;




