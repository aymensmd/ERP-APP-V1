// SideContent.js - Updated version
import React, { useState, useEffect } from 'react';
import { Card, List, Input, Avatar, Typography, Divider, Badge, Tag } from 'antd';
import { UserOutlined, TeamOutlined, BarChartOutlined } from '@ant-design/icons';
import axios from '../axios';

const { Search } = Input;
const { Title, Text } = Typography;

const SideContent = () => {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/employees');
        // Handle Laravel API response format
        const employees = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setData(employees);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = data.filter(item =>
    item.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Extract department names, handling both string and object formats
  const departmentNames = data.map(d => {
    if (typeof d.department === 'string') {
      return d.department;
    }
    return d.department?.name || d.department_id || 'Unknown';
  });
  const departmentCount = [...new Set(departmentNames.filter(Boolean))].length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Team Card */}
      <Card
        loading={loading}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <Text strong>Team Members</Text>
          </div>
        }
        styles={{ 
          header: { borderBottom: 0 },
          body: { padding: '0 16px 16px' }
        }}
        className="side-content-card"
      >
        <Search
          placeholder="Search team members..."
          allowClear
          onChange={e => setSearchText(e.target.value)}
          style={{ marginBottom: '16px' }}
        />
        
        <List
          size="small"
          itemLayout="horizontal"
          dataSource={filteredData}
          renderItem={(item, index) => (
            <List.Item 
              key={index} 
              style={{ 
                padding: '12px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                ':hover': {
                  background: '#f5f5f5'
                }
              }}
            >
              <List.Item.Meta
                avatar={
                  <Badge 
                    dot 
                    color="#52c41a" 
                    offset={[-5, 30]}
                  >
                    <Avatar 
                      style={{ 
                        backgroundColor: '#1890ff', 
                        fontWeight: 600 
                      }}
                    >
                      {item.name?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                  </Badge>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong>{item.name || 'Unknown'}</Text>
                    <Tag color="blue">
                      {typeof item.department === 'string' 
                        ? item.department 
                        : (item.department?.name || item.department_id || 'No Department')}
                    </Tag>
                  </div>
                }
                description={
                  <Text type="secondary" ellipsis>
                    {item.email}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Stats Card */}
      <Card
        loading={loading}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChartOutlined style={{ color: '#1890ff' }} />
            <Text strong>Team Stats</Text>
          </div>
        }
        styles={{ header: { borderBottom: 0 } }}
        className="side-content-card"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Team Members</Text>
            <Text strong>{data.length}</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Departments</Text>
            <Text strong style={{ color: '#faad14' }}>{departmentCount}</Text>
          </div>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Avg. Performance</Text>
            <Text strong style={{ color: '#52c41a' }}>N/A</Text>
          </div>
          
          <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
            Performance metrics coming soon
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default SideContent;