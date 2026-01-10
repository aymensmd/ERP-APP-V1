import React, { useState, useEffect } from 'react';
import { Button, Card, Drawer, Typography, Row, Col, Statistic, Divider, ConfigProvider, Spin } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import Layout from 'antd/es/layout/layout';
import EmployeeForm from '../components/EmployeeForm';
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
    // Handle both object and string/ID formats
    const deptName = typeof emp.department === 'object' && emp.department?.name 
      ? emp.department.name 
      : typeof emp.department === 'string' 
      ? emp.department 
      : emp.department_id 
      ? `Department ${emp.department_id}`
      : 'Unassigned';
    acc[deptName] = (acc[deptName] || 0) + 1;
    return acc;
  }, {});
  const departmentList = Object.entries(departmentCounts).map(([dept, count]) => ({ dept, count }));

  // Quick filter
  const handleDepartmentFilter = dept => {
    setDepartmentFilter(dept);
    if (dept === '') {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(employees.filter(e => {
        const empDeptName = typeof e.department === 'object' && e.department?.name 
          ? e.department.name 
          : typeof e.department === 'string' 
          ? e.department 
          : e.department_id 
          ? `Department ${e.department_id}`
          : 'Unassigned';
        return empDeptName === dept;
      }));
    }
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
        <Spin spinning={loading}>
          <div style={{ padding: 0, maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
            <div style={{ 
              margin: 0, 
              padding: 0, 
              background: 'transparent',
              borderRadius: '8px',
              border: 'none'
            }}>
              <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${colors.border}` }}>
                <Title level={3} style={{ marginBottom: 4, color: colors.textPrimary, fontSize: 20 }}>Employee Management</Title>
                <Text type="secondary" style={{ fontSize: 13, color: colors.textSecondary }}>
                  Add, edit, filter, export and manage employee information.
                </Text>
              </div>
              <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <div style={{ 
                background: colors.statsBg, 
                borderRadius: '8px', 
                padding: '16px', 
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                  <Button
                    icon={<PlusOutlined />} 
                    type="primary" 
                    size="middle"
                    style={{ fontWeight: 500 }}
                    onClick={() => setDrawerVisible(true)}
                  >
                    Add Employee
                  </Button>
                  <Button
                    size="middle"
                    style={{ fontWeight: 500 }}
                    onClick={() => window.dispatchEvent(new CustomEvent('export-employees-csv', { detail: filteredEmployees }))}
                  >
                    Export CSV
                  </Button>
                </div>
              
                <UserTable employees={filteredEmployees} />
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <Card 
                variant="outlined" 
                bodyStyle={{ padding: '16px' }}
                style={{ 
                  background: colors.infoBg, 
                  borderRadius: '8px', 
                  marginBottom: 12,
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.2s ease'
                }}
              >
                <Statistic
                  title={<span style={{ fontSize: 13 }}>Total Employees</span>}
                  value={employees.length}
                  prefix={<UserOutlined style={{ fontSize: 18 }} />}
                  valueStyle={{ color: colors.textPrimary, fontSize: 24, fontWeight: 600 }}
                />
              </Card>
              <Card 
                variant="outlined" 
                bodyStyle={{ padding: '16px' }}
                style={{ 
                  background: colors.infoBg, 
                  borderRadius: '8px', 
                  marginBottom: 12,
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.2s ease'
                }}
              >
                <Title level={5} style={{ marginBottom: 12, color: colors.textPrimary, fontSize: 14, fontWeight: 600 }}>Department Breakdown</Title>
                {departmentList.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>No departments</Text>
                ) : (
                  <ul style={{ paddingLeft: 18, margin: 0, listStyle: 'disc' }}>
                    {departmentList.map(d => (
                      <li 
                        key={d.dept} 
                        style={{ 
                          fontWeight: departmentFilter === d.dept ? 600 : 400, 
                          color: departmentFilter === d.dept ? colors.primary : colors.textPrimary,
                          cursor: 'pointer',
                          marginBottom: 6,
                          fontSize: 13,
                          lineHeight: '20px'
                        }}
                        onClick={() => handleDepartmentFilter(d.dept)}
                      >
                        {d.dept}: {d.count}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card 
                variant="outlined" 
                bodyStyle={{ padding: '16px' }}
                style={{ 
                  background: colors.infoBg, 
                  borderRadius: '8px',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                  border: `1px solid ${colors.border}`
                }}
              >
                <Title level={5} style={{ marginBottom: 12, color: colors.textPrimary, fontSize: 14, fontWeight: 600 }}>Recent Hires</Title>
                {recentHires.length === 0 ? 
                  <Text type="secondary" style={{ fontSize: 12 }}>No recent hires</Text> : 
                  <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                    {recentHires.slice(0, 5).map(e => (
                      <div key={e.id} style={{ color: colors.textPrimary, marginBottom: 8, fontSize: 12, lineHeight: '18px' }}>
                        <div style={{ fontWeight: 500 }}>{e.name}</div>
                        <div style={{ color: colors.textSecondary, fontSize: 11 }}>
                          {typeof e.department === 'object' && e.department?.name 
                            ? e.department.name 
                            : typeof e.department === 'string' 
                            ? e.department 
                            : 'N/A'} - {dayjs(e.created_at).format('MMM DD, YYYY')}
                        </div>
                      </div>
                    ))}
                  </div>
                }
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5} style={{ marginBottom: 12, color: colors.textPrimary, fontSize: 14, fontWeight: 600 }}>Upcoming Events</Title>
                {upcomingBirthdays.length === 0 && upcomingAnniversaries.length === 0 ? 
                  <Text type="secondary" style={{ fontSize: 12 }}>No upcoming events</Text> : 
                  <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                    {upcomingBirthdays.slice(0, 3).map(e => (
                      <div key={e.id + '-bday'} style={{ color: colors.textPrimary, marginBottom: 6, fontSize: 12, lineHeight: '18px' }}>
                        🎂 {e.name} - {dayjs(e.birthday).format('MMM DD')}
                      </div>
                    ))}
                    {upcomingAnniversaries.slice(0, 3).map(e => (
                      <div key={e.id + '-anniv'} style={{ color: colors.textPrimary, marginBottom: 6, fontSize: 12, lineHeight: '18px' }}>
                        🎉 {e.name} - {dayjs(e.created_at).format('MMM DD')}
                      </div>
                    ))}
                  </div>
                }
              </Card>
            </Col>
          </Row>
            </div>
          </div>
        </Spin>
        <Drawer
          title="Add New Employee"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={Math.min(900, window.innerWidth * 0.85)}
          styles={{
            body: {
              padding: '20px',
              background: colors.cardBg,
              color: colors.textPrimary
            },
            header: {
              padding: '16px 20px',
              background: colors.cardBg,
              borderBottom: `1px solid ${colors.border}`
            }
          }}
        >
          <EmployeeForm 
            mode="create"
            onSuccess={() => {
              setDrawerVisible(false);
              window.location.reload(); // Refresh the page to show new employee
            }}
            onCancel={() => setDrawerVisible(false)}
          />
        </Drawer>
      </Content>
    </ConfigProvider>
  );
};

export default EmployeViewComponent;