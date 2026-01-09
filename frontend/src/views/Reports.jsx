import React, { useState } from 'react';
import { Typography, Card, Select, Button, Space, DatePicker, message, ConfigProvider, Form, Row, Col, Spin, Table } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import axios from '../axios';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const { theme } = useStateContext();
  const [type, setType] = useState('attendance');
  const [range, setRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
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

  const generate = async (values) => {
    try {
      setLoading(true);
      const payload = {
        type: values.type || type,
        start_date: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      };

      const response = await axios.post('/reports/generate', payload);
      setReportData(response.data);
      message.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      message.error(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
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
            <FileTextOutlined style={{ color: colors.primary }} />
            Reports
          </Title>
          <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: '16px' }}>
            Generate and download various reports for your organization.
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
          <Form form={form} layout="vertical" onFinish={generate} initialValues={{ type: type }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item 
                  name="type"
                  label={<span style={{ color: colors.textPrimary, fontWeight: 500 }}>Report Type</span>}
                  rules={[{ required: true, message: 'Please select report type' }]}
                >
                  <Select 
                    size="large"
                    style={{ width: '100%' }}
                  >
                    <Option value="attendance">Attendance Report</Option>
                    <Option value="payroll">Payroll Report</Option>
                    <Option value="performance">Performance Report</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item 
                  name="dateRange"
                  label={<span style={{ color: colors.textPrimary, fontWeight: 500 }}>Date Range</span>}
                >
                  <RangePicker 
                    size="large"
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8}>
                <Form.Item label=" " style={{ marginTop: 30 }}>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />} 
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                  >
                    Generate Report
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {reportData && (
          <Card
            title={<span style={{ color: colors.textPrimary, fontWeight: 600 }}>Report Results</span>}
            style={{ 
              marginTop: '32px',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${colors.border}`,
              background: colors.cardBg
            }}
          >
            {reportData.type === 'attendance' && reportData.data?.employees && (
              <div>
                <div style={{ marginBottom: '24px', padding: '16px', background: theme === 'dark' ? '#2a2a2a' : '#f0f5ff', borderRadius: '8px' }}>
                  <Text strong style={{ color: colors.textPrimary }}>Summary: </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    Total Employees: {reportData.data.summary?.total_employees || 0} | 
                    Total Leave Days: {reportData.data.summary?.total_leave_days || 0} | 
                    Approved Days: {reportData.data.summary?.total_approved_days || 0} | 
                    Pending Days: {reportData.data.summary?.total_pending_days || 0}
                  </Text>
                </div>
                <Table
                  dataSource={reportData.data.employees}
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    { title: 'Department', dataIndex: 'department', key: 'department' },
                    { title: 'Total Leave Days', dataIndex: 'total_leave_days', key: 'total_leave_days' },
                    { title: 'Approved Days', dataIndex: 'approved_days', key: 'approved_days' },
                    { title: 'Pending Days', dataIndex: 'pending_days', key: 'pending_days' },
                  ]}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </div>
            )}

            {reportData.type === 'performance' && reportData.data?.employees && (
              <div>
                <div style={{ marginBottom: '24px', padding: '16px', background: theme === 'dark' ? '#2a2a2a' : '#f0f5ff', borderRadius: '8px' }}>
                  <Text strong style={{ color: colors.textPrimary }}>Summary: </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    Total Employees: {reportData.data.summary?.total_employees || 0} | 
                    Average Performance: {reportData.data.summary?.average_performance || 0}%
                  </Text>
                </div>
                <Table
                  dataSource={reportData.data.employees}
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    { title: 'Department', dataIndex: 'department', key: 'department' },
                    { title: 'Events Created', dataIndex: 'events_created', key: 'events_created' },
                    { title: 'Events Participated', dataIndex: 'events_participated', key: 'events_participated' },
                    { title: 'Performance Score', dataIndex: 'performance_score', key: 'performance_score' },
                  ]}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </div>
            )}

            {reportData.type === 'payroll' && (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
                Payroll report data would be displayed here. Integration with payroll system needed.
              </div>
            )}
          </Card>
        )}
      </div>
    </ConfigProvider>
  );
};

export default Reports;
