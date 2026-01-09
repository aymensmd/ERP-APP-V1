import React, { useState } from 'react';
import { Input, List, Modal, Typography, Button, Tag, ConfigProvider } from 'antd';
import { BookOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import PageContainer from '../components/PageContainer';
import { useStateContext } from '../contexts/ContextProvider';

const { Paragraph, Text } = Typography;

const docs = [
  { id: 1, title: 'How to request leave', body: 'To request leave, go to Vacation > New Request and fill the form. Attach any supporting documents and submit for manager approval. You will receive a notification once your request is reviewed.', category: 'Vacation' },
  { id: 2, title: 'How to run payroll', body: 'Payroll runs at the end of the month. Ensure employee hours are approved and all timesheets are locked before payroll processing. Navigate to Reports > Payroll Report to generate payroll reports.', category: 'Payroll' },
  { id: 3, title: 'Setting up two-factor auth', body: 'Go to Settings > Security and enable 2FA. We support Authenticator apps like Google Authenticator or Authy. This adds an extra layer of security to your account.', category: 'Security' },
  { id: 4, title: 'Managing employee profiles', body: 'Navigate to HR Management > Employee Profiles to view and manage all employee information. You can add, edit, or update employee details from this page.', category: 'HR Management' },
  { id: 5, title: 'Creating and managing events', body: 'Go to Events page to create new events. Select a date on the calendar, fill in event details, and add participants. Events can be marked as in-person or online.', category: 'Events' },
  { id: 6, title: 'Time tracking guidelines', body: 'Use the Time Tracking feature to log your work hours. Click Start when you begin work and Stop when finished. All sessions are automatically saved and can be reviewed in your logs.', category: 'Time Tracking' },
];

const KnowledgeBase = () => {
  const { theme } = useStateContext();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  const categories = ['All', ...new Set(docs.map(d => d.category))];

  const filtered = docs.filter(d => {
    const matchesQuery = d.title.toLowerCase().includes(query.toLowerCase()) || 
                         d.body.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || d.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

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
        title="Knowledge Base"
        subtitle="Search through our knowledge base for helpful articles and guides"
        icon={BookOutlined}
        extra={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <Tag
                key={cat}
                color={selectedCategory === cat || (!selectedCategory && cat === 'All') ? colors.primary : 'default'}
                onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                style={{ cursor: 'pointer', padding: '4px 12px' }}
              >
                {cat}
              </Tag>
            ))}
          </div>
        }
      >
        <Input 
          placeholder="Search articles..." 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          size="large"
          prefix={<SearchOutlined style={{ color: colors.textSecondary }} />}
          style={{ 
            marginBottom: '24px',
            borderRadius: '8px'
          }}
          allowClear
        />
        {filtered.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: colors.textSecondary 
          }}>
            <FileTextOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
            <div>No articles found matching your search.</div>
          </div>
        ) : (
          <List
            dataSource={filtered}
            renderItem={d => (
              <List.Item 
                onClick={() => { setActive(d); setOpen(true); }} 
                style={{ 
                  cursor: 'pointer',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  border: `1px solid ${colors.border}`,
                  background: theme === 'dark' ? '#2a2a2a' : '#fafafa',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#333333' : '#f0f0f0';
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#2a2a2a' : '#fafafa';
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <List.Item.Meta 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileTextOutlined style={{ color: colors.primary }} />
                      <span style={{ color: colors.textPrimary, fontWeight: 500 }}>{d.title}</span>
                      <Tag color="blue">{d.category}</Tag>
                    </div>
                  } 
                  description={<Text style={{ color: colors.textSecondary }}>{d.body.slice(0, 120) + '...'}</Text>} 
                />
              </List.Item>
            )}
          />
        )}

        <Modal 
          open={open} 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileTextOutlined style={{ color: colors.primary }} />
              <span style={{ color: colors.textPrimary }}>{active?.title}</span>
              {active && <Tag color="blue">{active.category}</Tag>}
            </div>
          } 
          onCancel={() => setOpen(false)} 
          footer={[
            <Button key="close" onClick={() => setOpen(false)}>
              Close
            </Button>
          ]}
          width={600}
          styles={{
            body: {
              background: colors.cardBg,
              color: colors.textPrimary,
              padding: '32px'
            },
            header: {
              background: colors.cardBg,
              borderBottom: `1px solid ${colors.border}`,
              padding: '20px 24px'
            }
          }}
        >
          <Paragraph style={{ color: colors.textPrimary, fontSize: '16px', lineHeight: '1.8', margin: 0 }}>
            {active?.body}
          </Paragraph>
        </Modal>
      </PageContainer>
    </ConfigProvider>
  );
};

export default KnowledgeBase;
