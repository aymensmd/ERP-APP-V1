import React, { useState } from 'react';
import { Typography, Card, List, Button, Modal, Radio, message, ConfigProvider, Tag, Divider } from 'antd';
import { FormOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Paragraph, Text } = Typography;

const mockSurveys = [
  { id: 1, title: 'Employee Engagement Survey', questions: ['Are you satisfied with your work-life balance?'], status: 'Active', category: 'Engagement' },
  { id: 2, title: 'Workplace Safety Assessment', questions: ['Do you feel safe at the workplace?'], status: 'Active', category: 'Safety' },
  { id: 3, title: 'Job Satisfaction Survey', questions: ['How satisfied are you with your current role?', 'Would you recommend this company to others?'], status: 'Pending', category: 'Satisfaction' },
];

const Surveys = () => {
  const { theme } = useStateContext();
  const [openSurvey, setOpenSurvey] = useState(null);
  const [answers, setAnswers] = useState({});

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

  const take = (survey) => setOpenSurvey(survey);
  const submit = () => {
    message.success('Survey submitted — thank you for your feedback!');
    setOpenSurvey(null);
    setAnswers({});
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers({ ...answers, [questionIndex]: value });
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
      <div style={{ 
        padding: '32px', 
        minHeight: 'calc(100vh - 64px)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ 
            marginBottom: '8px', 
            color: colors.textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FormOutlined style={{ color: colors.primary }} />
            Surveys
          </Title>
          <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: '16px' }}>
            Participate in surveys to help improve our workplace.
          </Paragraph>
        </div>
        <Card 
          style={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg
          }}
        >
          {mockSurveys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textSecondary }}>
              <FormOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
              <div>No surveys available at the moment.</div>
            </div>
          ) : (
            <List
              dataSource={mockSurveys}
              renderItem={s => (
                <List.Item 
                  actions={[
                    <Button 
                      type="primary" 
                      onClick={() => take(s)}
                      disabled={s.status !== 'Active'}
                    >
                      {s.status === 'Active' ? 'Take Survey' : 'Coming Soon'}
                    </Button>
                  ]}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: `1px solid ${colors.border}`,
                    background: theme === 'dark' ? '#2a2a2a' : '#fafafa',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <List.Item.Meta 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{s.title}</span>
                        <Tag color={s.status === 'Active' ? 'green' : 'orange'}>{s.status}</Tag>
                        <Tag color="blue">{s.category}</Tag>
                      </div>
                    } 
                    description={
                      <Text style={{ color: colors.textSecondary }}>
                        {s.questions.length} question(s)
                      </Text>
                    } 
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        <Modal 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FormOutlined style={{ color: colors.primary }} />
              <span style={{ color: colors.textPrimary }}>{openSurvey?.title}</span>
            </div>
          } 
          open={!!openSurvey} 
          onCancel={() => {
            setOpenSurvey(null);
            setAnswers({});
          }} 
          onOk={submit} 
          okText="Submit"
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
          <div>
            {openSurvey?.questions.map((q, i) => (
              <div key={i} style={{ marginBottom: '24px' }}>
                <Text strong style={{ color: colors.textPrimary, fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                  {i + 1}. {q}
                </Text>
                <Radio.Group 
                  onChange={e => handleAnswerChange(i, e.target.value)} 
                  value={answers[i]}
                  style={{ width: '100%' }}
                >
                  <Radio value={1} style={{ display: 'block', marginBottom: '8px', color: colors.textPrimary }}>Yes</Radio>
                  <Radio value={2} style={{ display: 'block', marginBottom: '8px', color: colors.textPrimary }}>No</Radio>
                  <Radio value={3} style={{ display: 'block', color: colors.textPrimary }}>Sometimes</Radio>
                </Radio.Group>
                {i < openSurvey.questions.length - 1 && <Divider style={{ margin: '16px 0', borderColor: colors.border }} />}
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Surveys;
