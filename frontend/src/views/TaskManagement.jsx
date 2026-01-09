import React from 'react';
import { Card, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function TaskManagement() {
  const navigate = useNavigate();
  return (
    <Card style={{ minHeight: 300 }}>
      <Title level={3}>Task Management</Title>
      <Paragraph>Manage your tasks, create checklists, and assign priorities here.</Paragraph>
      <Button onClick={() => navigate(-1)} type="link">Go back</Button>
    </Card>
  );
}
