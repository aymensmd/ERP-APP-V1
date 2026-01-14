import React, { useState } from 'react';
import { Card, List, Button, Modal, Input, Form, message, Typography, Divider, ConfigProvider } from 'antd';
import { QuestionCircleOutlined, CustomerServiceOutlined, SendOutlined } from '@ant-design/icons';
import PageContainer from '../components/PageContainer';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Paragraph, Text } = Typography;

const faqs = [
  { q: 'How do I reset my password?', a: 'Go to Settings > Security and choose Reset Password. You will receive an email with instructions to reset your password.' },
  { q: 'How can I add a new employee?', a: 'Navigate to Users > Add Employee and fill the required fields. Make sure you have admin privileges to add new employees.' },
  { q: 'How do I export reports?', a: 'Go to Reports > Select report type > Choose date range > Click Generate. You can export in CSV or PDF formats with date range filters.' },
  { q: 'How do I request vacation time?', a: 'Go to Vacation > New Request, fill in the dates and reason, then submit for approval. Your manager will be notified.' },
  { q: 'How do I track my time?', a: 'Navigate to Time Tracking page and click Start to begin tracking. Click Stop when finished. All sessions are logged automatically.' },
];

const HelpCenter = () => {
  const { theme } = useStateContext();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form] = Form.useForm();

  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      primary: '#1890ff',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.65)',
      border: '#303030',
      primary: '#177ddc',
    }
  };

  const colors = themeStyles[theme];

  const submit = () => {
    message.success('Support request submitted successfully! We will get back to you soon.');
    form.resetFields();
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: colors.cardBg,
          colorText: colors.textPrimary,
          colorBorder: colors.border,
          colorPrimary: colors.primary,
        },
      }}
    >
      <PageContainer 
        title="Help Center"
        subtitle="Find answers to common questions or contact our support team"
        icon={QuestionCircleOutlined}
      >
        <div style={{ marginBottom: '32px' }}>
          <Title level={4} style={{ 
            color: colors.textPrimary, 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <QuestionCircleOutlined style={{ color: colors.primary }} />
            Frequently Asked Questions
          </Title>
          <List
            dataSource={faqs}
            renderItem={f => (
              <List.Item 
                onClick={() => { setSelected(f); setOpen(true); }} 
                style={{ 
                  cursor: 'pointer',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: `1px solid ${colors.border}`,
                  background: theme === 'dark' ? '#2a2a2a' : '#fafafa',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#333333' : '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#2a2a2a' : '#fafafa';
                }}
              >
                <List.Item.Meta 
                  title={<span style={{ color: colors.textPrimary, fontWeight: 500 }}>{f.q}</span>} 
                  description={<span style={{ color: colors.textSecondary }}>{f.a.slice(0, 100) + '...'}</span>} 
                />
              </List.Item>
            )} 
          />
        </div>

        <Divider style={{ margin: '32px 0', borderColor: colors.border }} />

        <div>
          <Title level={4} style={{ 
            color: colors.textPrimary, 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CustomerServiceOutlined style={{ color: colors.primary }} />
            Contact Support
          </Title>
          <Form form={form} layout="vertical" onFinish={submit}>
            <Form.Item 
              name="subject" 
              label={<span style={{ color: colors.textPrimary, fontWeight: 500 }}>Subject</span>} 
              rules={[{ required: true, message: 'Please enter a subject' }]}
            >
              <Input size="large" placeholder="Enter subject..." />
            </Form.Item>
            <Form.Item 
              name="description" 
              label={<span style={{ color: colors.textPrimary, fontWeight: 500 }}>Description</span>} 
              rules={[{ required: true, message: 'Please enter a description' }]}
            >
              <Input.TextArea rows={6} placeholder="Describe your issue or question..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} size="large">
                Send Request
              </Button>
            </Form.Item>
          </Form>
        </div>

        <Modal 
          open={open} 
          title={
            <span style={{ color: colors.textPrimary }}>
              <QuestionCircleOutlined style={{ marginRight: 8, color: colors.primary }} />
              {selected?.q}
            </span>
          } 
          onCancel={() => setOpen(false)} 
          footer={[
            <Button key="close" onClick={() => setOpen(false)}>
              Close
            </Button>
          ]}
          styles={{
            body: {
              background: colors.cardBg,
              color: colors.textPrimary,
              padding: '24px'
            },
            header: {
              background: colors.cardBg,
              borderBottom: `1px solid ${colors.border}`
            }
          }}
        >
          <Paragraph style={{ color: colors.textPrimary, fontSize: '16px', lineHeight: '1.6' }}>
            {selected?.a}
          </Paragraph>
        </Modal>
      </PageContainer>
    </ConfigProvider>
  );
};

export default HelpCenter;

