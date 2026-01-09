import React, { useState } from 'react';
import { List, Button, Avatar, message, Typography, Card, Tag, ConfigProvider, Badge, Statistic, Row, Col } from 'antd';
import { GiftOutlined, TrophyOutlined, StarOutlined } from '@ant-design/icons';
import PageContainer from '../components/PageContainer';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Paragraph, Text } = Typography;

const mock = [
  { id: 1, name: 'Sarah Williams', points: 120, rank: 1, badge: 'Gold' },
  { id: 2, name: 'Michael Brown', points: 110, rank: 2, badge: 'Silver' },
  { id: 3, name: 'You', points: 98, rank: 3, badge: 'Bronze' },
  { id: 4, name: 'Emily Davis', points: 95, rank: 4 },
  { id: 5, name: 'John Smith', points: 87, rank: 5 },
];

const availableRewards = [
  { id: 1, title: 'Gift Card $50', points: 100, claimed: false },
  { id: 2, title: 'Extra Day Off', points: 80, claimed: false },
  { id: 3, title: 'Lunch Voucher', points: 50, claimed: false },
  { id: 4, title: 'Coffee Voucher', points: 30, claimed: true },
];

const Rewards = () => {
  const { theme } = useStateContext();
  const [items] = useState(mock);
  const [rewards] = useState(availableRewards);
  
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

  const claim = (id) => {
    const reward = rewards.find(r => r.id === id);
    if (reward && !reward.claimed && reward.points <= (items.find(i => i.name === 'You')?.points || 0)) {
      message.success(`Reward "${reward.title}" claimed successfully!`);
    } else if (reward?.claimed) {
      message.warning('This reward has already been claimed.');
    } else {
      message.error('Not enough points to claim this reward.');
    }
  };

  const userPoints = items.find(i => i.name === 'You')?.points || 0;

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
        title="Rewards"
        subtitle="Earn points and claim exciting rewards"
        icon={GiftOutlined}
      >
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={8}>
            <Card
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}05 100%)`,
                textAlign: 'center'
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Your Points</span>}
                value={userPoints}
                prefix={<StarOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '36px', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Your Rank</span>}
                value={items.find(i => i.name === 'You')?.rank || 0}
                suffix="th"
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '36px', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg
              }}
            >
              <Statistic
                title={<span style={{ color: colors.textSecondary }}>Available Rewards</span>}
                value={rewards.filter(r => !r.claimed).length}
                valueStyle={{ color: colors.primary, fontSize: '36px', fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
              <TrophyOutlined style={{ marginRight: 8, color: colors.primary }} />
              Leaderboard
            </span>
          }
          style={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg,
            marginBottom: '32px'
          }}
        >
          <List
            dataSource={items}
            renderItem={(i, index) => (
              <List.Item
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: i.name === 'You' ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                  background: i.name === 'You' 
                    ? (theme === 'dark' ? '#111b26' : '#e6f7ff')
                    : (theme === 'dark' ? '#2a2a2a' : '#fafafa'),
                }}
              >
                <List.Item.Meta 
                  avatar={
                    <Badge count={i.rank} offset={[-10, 10]}>
                      <Avatar 
                        size={48} 
                        style={{ 
                          backgroundColor: i.badge === 'Gold' ? '#faad14' : i.badge === 'Silver' ? '#d9d9d9' : '#fa8c16',
                          fontSize: '20px',
                          fontWeight: 600
                        }}
                      >
                        {i.name.charAt(0)}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text strong style={{ color: colors.textPrimary }}>{i.name}</Text>
                      {i.badge && (
                        <Tag color={i.badge === 'Gold' ? 'gold' : i.badge === 'Silver' ? 'default' : 'orange'}>
                          {i.badge}
                        </Tag>
                      )}
                    </div>
                  } 
                  description={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StarOutlined style={{ color: '#faad14' }} />
                      <Text style={{ color: colors.textSecondary }}>{i.points} points</Text>
                    </div>
                  } 
                />
              </List.Item>
            )}
          />
        </Card>

        <Card
          title={
            <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
              <GiftOutlined style={{ marginRight: 8, color: colors.primary }} />
              Available Rewards
            </span>
          }
          style={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg
          }}
        >
          <List
            dataSource={rewards}
            renderItem={r => (
              <List.Item 
                actions={[
                  <Button 
                    type="primary"
                    onClick={() => claim(r.id)}
                    disabled={r.claimed || r.points > userPoints}
                  >
                    {r.claimed ? 'Claimed' : r.points > userPoints ? 'Not Enough Points' : 'Claim'}
                  </Button>
                ]}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: `1px solid ${colors.border}`,
                  background: r.claimed 
                    ? (theme === 'dark' ? '#2a2a2a' : '#f5f5f5')
                    : (theme === 'dark' ? '#2a2a2a' : '#fafafa'),
                  opacity: r.claimed ? 0.6 : 1
                }}
              >
                <List.Item.Meta 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <GiftOutlined style={{ color: colors.primary }} />
                      <Text strong style={{ color: colors.textPrimary }}>{r.title}</Text>
                      {r.claimed && <Tag color="default">Claimed</Tag>}
                    </div>
                  } 
                  description={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <StarOutlined style={{ color: '#faad14' }} />
                      <Text style={{ color: colors.textSecondary }}>{r.points} points required</Text>
                    </div>
                  } 
                />
              </List.Item>
            )}
          />
        </Card>
      </PageContainer>
    </ConfigProvider>
  );
};

export default Rewards;
