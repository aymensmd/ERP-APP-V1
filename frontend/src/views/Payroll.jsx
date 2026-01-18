import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  DatePicker, 
  Select, 
  Typography, 
  Tag, 
  Space, 
  message, 
  Statistic, 
  Row, 
  Col, 
  Descriptions 
} from 'antd';
import { 
  DollarOutlined, 
  CalculatorOutlined, 
  EyeOutlined, 
  CheckCircleOutlined,
  BankOutlined
} from '@ant-design/icons';
import axios from '../axios';
import PageContainer from '../components/PageContainer';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Payroll = () => {
  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [form] = Form.useForm();
  
  // Filter states
  const [monthFilter, setMonthFilter] = useState(dayjs());

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = {
        month: monthFilter.format('YYYY-MM'),
      };
      const response = await axios.get('/payroll', { params });
      setPayrolls(response.data.data || []);
    } catch (error) {
      message.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/employees');
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load employees');
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchUsers();
  }, [monthFilter]);

  const handleGenerate = async (values) => {
    try {
      setLoading(true);
      const payload = {
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD'),
        user_id: values.user_id, // Optional
      };

      await axios.post('/payroll/generate', payload);
      message.success('Payroll generated successfully');
      setIsGenerateModalVisible(false);
      form.resetFields();
      fetchPayrolls();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`/payroll/${id}`, { status });
      message.success(`Payroll marked as ${status}`);
      fetchPayrolls();
      if (selectedPayroll && selectedPayroll.id === id) {
        setIsDetailModalVisible(false);
      }
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Space>
           <Text strong>{record.user?.name}</Text>
        </Space>
      )
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => (
        <Text>
          {dayjs(record.pay_period_start).format('MMM D')} - {dayjs(record.pay_period_end).format('MMM D, YYYY')}
        </Text>
      )
    },
    {
      title: 'Base Salary',
      dataIndex: 'base_salary',
      key: 'base_salary',
      render: (val) => parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2 })
    },
    {
      title: 'Net Salary',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (val) => <Text strong>{parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { draft: 'orange', processed: 'blue', paid: 'green' };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => {
            setSelectedPayroll(record);
            setIsDetailModalVisible(true);
          }}
        >
          Details
        </Button>
      )
    }
  ];

  // Calculate totals
  const totalNet = payrolls.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);
  const totalPending = payrolls.filter(p => p.status !== 'paid').reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);

  return (
    <PageContainer title="Payroll Management">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic 
              title="Total Payroll (This Month)" 
              value={totalNet} 
              precision={2} 
              prefix={<DollarOutlined />} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic 
              title="Pending Payment" 
              value={totalPending} 
              precision={2} 
              valueStyle={{ color: '#cf1322' }}
              prefix={<BankOutlined />} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button 
              type="primary" 
              size="large" 
              icon={<CalculatorOutlined />} 
              onClick={() => setIsGenerateModalVisible(true)}
            >
              Run Payroll
            </Button>
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <DatePicker 
              picker="month" 
              value={monthFilter} 
              onChange={setMonthFilter} 
              allowClear={false}
            />
          </Space>
        </Space>
        
        <Table 
          columns={columns} 
          dataSource={payrolls} 
          rowKey="id" 
          loading={loading}
          scroll={{ x: 800 }} 
        />
      </Card>

      {/* Generate Modal */}
      <Modal
        title="Generate Payroll"
        open={isGenerateModalVisible}
        onCancel={() => setIsGenerateModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleGenerate}>
          <Form.Item 
            name="dateRange" 
            label="Pay Period" 
            rules={[{ required: true, message: 'Select dates' }]}
            initialValue={[dayjs().startOf('month'), dayjs().endOf('month')]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="user_id" label="Employee (Optional)">
            <Select placeholder="All Employees" allowClear>
              {users.map(u => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Payroll Details"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>Close</Button>,
          selectedPayroll?.status === 'draft' && (
            <Button 
              key="process" 
              type="primary" 
              onClick={() => handleStatusUpdate(selectedPayroll.id, 'processed')}
            >
              Mark Processed
            </Button>
          ),
          selectedPayroll?.status === 'processed' && (
            <Button 
              key="pay" 
              type="primary" 
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleStatusUpdate(selectedPayroll.id, 'paid')}
            >
              Mark Paid
            </Button>
          )
        ]}
      >
        {selectedPayroll && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Employee">{selectedPayroll.user?.name}</Descriptions.Item>
            <Descriptions.Item label="Base Salary">
              {parseFloat(selectedPayroll.base_salary).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Overtime">
              {parseFloat(selectedPayroll.overtime_amount).toFixed(2)} ({selectedPayroll.overtime_hours} hrs)
            </Descriptions.Item>
            <Descriptions.Item label="Bonuses">
              {parseFloat(selectedPayroll.bonuses).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Deductions">
              {parseFloat(selectedPayroll.deductions).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Net Salary" contentStyle={{ fontWeight: 'bold', fontSize: '1.1em' }}>
              {parseFloat(selectedPayroll.net_salary).toFixed(2)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};

export default Payroll;
