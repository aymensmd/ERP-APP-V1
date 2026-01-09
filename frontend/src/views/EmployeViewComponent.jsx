import React, { useState, useEffect } from 'react';
import { Button, Card, Drawer, Typography, Row, Col, Statistic, Divider, ConfigProvider } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import Layout from 'antd/es/layout/layout';
import Form from '../Form/index';
import UserTable from './UserTable';
import axios from '../axios';
import dayjs from 'dayjs';
import { useStateContext } from '../contexts/ContextProvider';

const { Content } = Layout;
const { Title, Text } = Typography;

const EmployeViewComponent = () => {
  const { theme } = useStateContext();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Theme styles
  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#595959',
      border: '#f0f0f0',
      primary: '#1890ff',
      infoBg: '#f0f5ff',
      statsBg: '#f6f9ff',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      border: '#303030',
      primary: '#177ddc',
      infoBg: '#111b26',
      statsBg: '#141d26',
    }
  };

  const colors = themeStyles[theme];

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/employees');
        // Response data is already unwrapped by axios interceptor
        const employees = Array.isArray(response.data) ? response.data : [];
        setEmployees(employees);
        setFilteredEmployees(employees);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
        setFilteredEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Department breakdown
  const departmentCounts = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});
  const departmentList = Object.entries(departmentCounts).map(([dept, count]) => ({ dept, count }));

  // Quick filter
  const handleDepartmentFilter = dept => {
    setDepartmentFilter(dept);
    if (dept === '') setFilteredEmployees(employees);
    else setFilteredEmployees(employees.filter(e => e.department === dept));
  };

  // Recent hires (last 30 days)
  const recentHires = employees.filter(e => e.created_at && dayjs(e.created_at).isAfter(dayjs().subtract(30, 'day')));

  // Upcoming birthdays (next 30 days)
  const upcomingBirthdays = employees.filter(e => {
    if (!e.birthday) return false;
    const thisYear = dayjs().year();
    const bday = dayjs(e.birthday).year(thisYear);
    const now = dayjs();
    return bday.isAfter(now) && bday.isBefore(now.add(30, 'day'));
  });

  // Upcoming anniversaries (next 30 days)
  const upcomingAnniversaries = employees.filter(e => {
    if (!e.created_at) return false;
    const thisYear = dayjs().year();
    const anniv = dayjs(e.created_at).year(thisYear);
    const now = dayjs();
    return anniv.isAfter(now) && anniv.isBefore(now.add(30, 'day'));
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
      <Content className="content">
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <Card style={{ 
            margin: 0, 
            padding: '32px', 
            background: colors.cardBg,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: 'none'
          }} loading={loading}>
          <Title level={3} style={{ marginBottom: 0, color: colors.textPrimary }}>Gestion des employés</Title>
          <Text type="secondary" style={{ fontSize: 16, color: colors.textSecondary }}>
            Ajoutez, modifiez, filtrez, exportez et consultez les informations des employés.
          </Text>
          <Divider />
          <Row gutter={[32, 32]}>
            <Col xs={24} md={16}>
              <div style={{ 
                background: colors.statsBg, 
                borderRadius: '16px', 
                padding: '32px', 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                      icon={<PlusOutlined />} 
                      type="primary" 
                      size="large"
                      style={{ fontWeight: 600 }}
                      onClick={() => setDrawerVisible(true)}
                    >
                      Ajouter
                    </Button>
                    <Button
                      size="large"
                      style={{ fontWeight: 600 }}
                      onClick={() => window.dispatchEvent(new CustomEvent('export-employees-csv', { detail: filteredEmployees }))}
                    >
                      Exporter CSV
                    </Button>
                  </div>
                </div>
              
                <UserTable employees={filteredEmployees} />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Card variant="outlined" style={{ 
                background: colors.infoBg, 
                borderRadius: '16px', 
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: `1px solid ${colors.border}`,
                transition: 'all 0.2s ease'
              }}>
                <Statistic
                  title="Nombre total d'employés"
                  value={employees.length}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: colors.textPrimary }}
                />
              </Card>
              <Card variant="outlined" style={{ 
                background: colors.infoBg, 
                borderRadius: '16px', 
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: `1px solid ${colors.border}`,
                transition: 'all 0.2s ease'
              }}>
                <Title level={5} style={{ marginBottom: 8, color: colors.textPrimary }}>Répartition par département</Title>
                {departmentList.length === 0 ? (
                  <Text type="secondary">Aucun département</Text>
                ) : (
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {departmentList.map(d => (
                      <li 
                        key={d.dept} 
                        style={{ 
                          fontWeight: departmentFilter === d.dept ? 600 : 400, 
                          color: departmentFilter === d.dept ? colors.primary : colors.textPrimary,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleDepartmentFilter(d.dept)}
                      >
                        {d.dept}: {d.count}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card variant="outlined" style={{ 
                background: colors.infoBg, 
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: `1px solid ${colors.border}`
              }}>
                <Title level={5} style={{ color: colors.textPrimary }}>Nouvelles embauches</Title>
                {recentHires.length === 0 ? 
                  <Text type="secondary">Aucune embauche récente</Text> : 
                  recentHires.map(e => <div key={e.id} style={{ color: colors.textPrimary }}>{e.name} ({typeof e.department === 'string' ? e.department : (e.department?.name || 'N/A')}) - {dayjs(e.created_at).format('DD/MM/YYYY')}</div>)
                }
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5} style={{ color: colors.textPrimary }}>Anniversaires & Entrées à venir</Title>
                {upcomingBirthdays.length === 0 && upcomingAnniversaries.length === 0 ? 
                  <Text type="secondary">Aucun événement à venir</Text> : 
                  <>
                    {upcomingBirthdays.map(e => <div key={e.id + '-bday'} style={{ color: colors.textPrimary }}>🎂 {e.name} - {dayjs(e.birthday).format('DD/MM')}</div>)}
                    {upcomingAnniversaries.map(e => <div key={e.id + '-anniv'} style={{ color: colors.textPrimary }}>🎉 {e.name} - {dayjs(e.created_at).format('DD/MM')}</div>)}
                  </>
                }
              </Card>
            </Col>
          </Row>
        </Card>
        <Drawer
          title="Ajouter un employé"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={Math.min(1000, window.innerWidth * 0.9)}
          styles={{
            body: {
              padding: '32px',
              background: colors.cardBg,
              color: colors.textPrimary
            },
            header: {
              padding: '24px 32px',
              background: colors.cardBg,
              borderBottom: `1px solid ${colors.border}`
            }
          }}
        >
          <Form />
        </Drawer>
        </div>
      </Content>
    </ConfigProvider>
  );
};

export default EmployeViewComponent;