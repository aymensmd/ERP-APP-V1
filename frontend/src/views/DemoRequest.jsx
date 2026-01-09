import React from 'react';
import { Typography, Form, Input, Button, Card } from 'antd';

const { Title, Paragraph } = Typography;

const DemoRequest = () => {
  const onFinish = (values) => {
    // Here you would handle the demo request (e.g., send to backend)
    alert('Demo request submitted!');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#f8fafc' }}>
      <Card style={{ maxWidth: 400, width: '100%', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 16 }}>Request a Demo</Title>
        <Paragraph style={{ textAlign: 'center', marginBottom: 24 }}>
          Fill out the form below and our team will contact you to schedule a personalized demo.
        </Paragraph>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name' }]}> 
            <Input placeholder="Your Name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}> 
            <Input placeholder="Your Email" />
          </Form.Item>
          <Form.Item label="Company" name="company"> 
            <Input placeholder="Your Company" />
          </Form.Item>
          <Form.Item label="Message" name="message"> 
            <Input.TextArea placeholder="Tell us about your needs..." rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Submit</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DemoRequest;
