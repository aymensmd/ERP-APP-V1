import React from 'react';
import { Card, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function Performance() {
  const navigate = useNavigate();
  return (
    <Card style={{ minHeight: 300 }}>
      <Title level={3}>Performance</Title>
      <Paragraph>View productivity metrics, trends and personalized performance insights.</Paragraph>
      <Button onClick={() => navigate(-1)} type="link">Go back</Button>
    </Card>
  );
}
