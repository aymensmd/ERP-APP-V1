import React from 'react';
import { Card, Typography, Divider, List } from 'antd';

const EmployeeProfile = ({ employee }) => {
  if (!employee) {
    return <Typography.Text type="danger">Employee not found.</Typography.Text>;
  }

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto', borderRadius: 12, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
      <Typography.Title level={3} style={{ textAlign: 'center', color: '#277dfe' }}>
        {employee.name}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
        {employee.position}
      </Typography.Text>
      <Divider />
      <List
        header={<Typography.Title level={4}>Details</Typography.Title>}
        bordered
        dataSource={Object.entries(employee.details || {})}
        renderItem={([key, value]) => (
          <List.Item>
            <Typography.Text strong>{key}:</Typography.Text> {value}
          </List.Item>
        )}
      />
    </Card>
  );
};

export default EmployeeProfile;
