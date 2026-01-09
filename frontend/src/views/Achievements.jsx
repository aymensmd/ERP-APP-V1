import React from 'react';
import { Card, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function Achievements() {
  const navigate = useNavigate();
  return (
    <Card style={{ minHeight: 300 }}>
      <Title level={3}>Achievements</Title>
      <Paragraph>Here you can view and manage achievements, badges and milestones for users.</Paragraph>
      <Button onClick={() => navigate(-1)} type="link">Go back</Button>
    </Card>
  );
}
