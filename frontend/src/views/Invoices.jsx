import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Statistic,
  Divider,
  Typography,
  Descriptions,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilePdfOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import { useCompany } from '../contexts/CompanyContext';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: null,
    customer_id: null,
    search: '',
  });
  const [form] = Form.useForm();
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (currentCompany) {
      fetchInvoices();
      fetchStats();
      fetchCustomers();
      fetchLeads();
    }
  }, [currentCompany, filters]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/invoices?${params.toString()}`);
      setInvoices(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      message.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/invoices');
      const data = response.data.data || response.data || [];
      
      const total = data.length;
      const paid = data.filter(i => i.status === 'paid').length;
      const overdue = data.filter(i => {
        if (i.status === 'paid') return false;
        return dayjs(i.due_date).isBefore(dayjs(), 'day');
      }).length;
      const totalAmount = data.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
      const paidAmount = data.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
      const pendingAmount = data.filter(i => i.status !== 'paid')
        .reduce((sum, i) => sum + parseFloat(i.balance || i.total_amount || 0), 0);

      setStats({
        total,
        paid,
        overdue,
        totalAmount,
        paidAmount,
        pendingAmount,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await axios.get('/leads');
      setLeads(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  const handleCreate = () => {
    setEditingInvoice(null);
    form.resetFields();
    form.setFieldsValue({
      issue_date: dayjs(),
      due_date: dayjs().add(30, 'day'),
      currency: 'USD',
      items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }],
    });
    setModalVisible(true);
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    form.setFieldsValue({
      ...invoice,
      issue_date: invoice.issue_date ? dayjs(invoice.issue_date) : null,
      due_date: invoice.due_date ? dayjs(invoice.due_date) : null,
      customer_id: invoice.customer_id,
      lead_id: invoice.lead_id,
      items: invoice.items || [],
    });
    setModalVisible(true);
  };

  const handleView = async (invoice) => {
    try {
      const response = await axios.get(`/invoices/${invoice.id}`);
      setSelectedInvoice(response.data);
      setDetailModalVisible(true);
    } catch {
      message.error('Failed to load invoice details');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        issue_date: values.issue_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
        items: values.items.filter(item => item.description && item.quantity > 0),
      };

      if (editingInvoice) {
        await axios.put(`/invoices/${editingInvoice.id}`, payload);
        message.success('Invoice updated successfully');
      } else {
        await axios.post('/invoices', payload);
        message.success('Invoice created successfully');
      }

      setModalVisible(false);
      fetchInvoices();
      fetchStats();
    } catch (error) {
      console.error('Invoice save error:', error);
      message.error(error.response?.data?.error || 'Failed to save invoice');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/invoices/${id}`);
      message.success('Invoice deleted successfully');
      fetchInvoices();
      fetchStats();
    } catch {
      message.error('Failed to delete invoice');
    }
  };

  const handleStatusChange = async (invoice, newStatus) => {
    try {
      await axios.put(`/invoices/${invoice.id}`, { status: newStatus });
      message.success('Invoice status updated');
      fetchInvoices();
      fetchStats();
    } catch {
      message.error('Failed to update status');
    }
  };

  const handleGeneratePdf = async (invoice) => {
    try {
      const response = await axios.get(`/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('PDF generated successfully');
    } catch {
      message.warning('PDF generation not yet implemented. Showing invoice details instead.');
      handleView(invoice);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      sent: 'processing',
      paid: 'success',
      overdue: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <ClockCircleOutlined />,
      sent: <SendOutlined />,
      paid: <CheckCircleOutlined />,
      overdue: <CloseCircleOutlined />,
      cancelled: <CloseCircleOutlined />,
    };
    return icons[status] || null;
  };

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => {
        if (record.customer) {
          return `${record.customer.first_name || ''} ${record.customer.last_name || ''}`.trim() || record.customer.company_name || 'N/A';
        }
        if (record.lead) {
          return `${record.lead.first_name || ''} ${record.lead.last_name || ''}`.trim() || record.lead.company_name || 'N/A';
        }
        return 'N/A';
      },
    },
    {
      title: 'Issue Date',
      dataIndex: 'issue_date',
      key: 'issue_date',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount, record) => (
        <Text strong>
          {record.currency || 'USD'} {parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance, record) => {
        const bal = parseFloat(balance || record.total_amount || 0);
        return (
          <Text type={bal > 0 ? 'danger' : 'success'}>
            {record.currency || 'USD'} {bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePdf(record)}
          >
            PDF
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this invoice?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="Total Invoices"
              value={stats.total || 0}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Paid"
              value={stats.paid || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Overdue"
              value={stats.overdue || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending Amount"
              value={stats.pendingAmount || 0}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>

        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Search invoices..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="Filter by Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="draft">Draft</Option>
              <Option value="sent">Sent</Option>
              <Option value="paid">Paid</Option>
              <Option value="overdue">Overdue</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
            <Select
              placeholder="Filter by Customer"
              value={filters.customer_id}
              onChange={(value) => setFilters({ ...filters, customer_id: value })}
              style={{ width: 200 }}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {customers.map((customer) => (
                <Option key={customer.id} value={customer.id}>
                  {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.company_name}
                </Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Invoice
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={invoices}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Save"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_id"
                label="Customer"
              >
                <Select
                  placeholder="Select Customer"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {customers.map((customer) => (
                    <Option key={customer.id} value={customer.id}>
                      {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.company_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lead_id"
                label="Lead (Optional)"
              >
                <Select
                  placeholder="Select Lead"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {leads.map((lead) => (
                    <Option key={lead.id} value={lead.id}>
                      {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.company_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="issue_date"
                label="Issue Date"
                rules={[{ required: true, message: 'Please select issue date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="due_date"
                label="Due Date"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="currency"
                label="Currency"
                initialValue="USD"
              >
                <Select>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                  <Option value="GBP">GBP</Option>
                  <Option value="MAD">MAD</Option>
                  <Option value="AED">AED</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Invoice Items</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                        rules={[{ required: true, message: 'Description required' }]}
                      >
                        <Input placeholder="Description" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: 'Qty' }]}
                      >
                        <InputNumber min={1} placeholder="Qty" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unit_price']}
                        rules={[{ required: true, message: 'Price' }]}
                      >
                        <InputNumber min={0} placeholder="Price" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item
                        {...restField}
                        name={[name, 'tax_rate']}
                      >
                        <InputNumber min={0} max={100} placeholder="Tax %" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item
                        {...restField}
                        name={[name, 'discount_rate']}
                      >
                        <InputNumber min={0} max={100} placeholder="Disc %" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Button
                        type="link"
                        danger
                        onClick={() => remove(name)}
                        disabled={fields.length === 1}
                      >
                        Remove
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  Add Item
                </Button>
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <Form.Item name="terms" label="Terms & Conditions">
            <TextArea rows={3} placeholder="Payment terms and conditions..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`Invoice ${selectedInvoice?.invoice_number || ''}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="pdf" icon={<FilePdfOutlined />} onClick={() => handleGeneratePdf(selectedInvoice)}>
            Generate PDF
          </Button>,
          selectedInvoice?.status !== 'paid' && (
             <Button
               key="pay-now"
               type="primary"
               style={{ background: '#6772e5', borderColor: '#6772e5' }}
               onClick={() => {
                 // Trigger payment flow
                 message.loading({ content: 'Initiating Secure Payment...', key: 'payment' });
                 axios.post('/payments/create-intent', { invoice_id: selectedInvoice.id })
                   .then(res => {
                     // In a real implementation, we would open a Stripe Elements modal here with the clientSecret
                     console.log('Client Secret:', res.data.clientSecret);
                     message.success({ content: 'Payment Intent Created! Redirecting to Payment Gateway...', key: 'payment' });
                     // Simulate redirect or modal open
                     // setPaymentModalVisible(true);
                   })
                   .catch(err => {
                     message.error({ content: 'Payment initialization failed', key: 'payment' });
                   });
               }}
             >
               Pay Now (Stripe)
             </Button>
          ),
          selectedInvoice?.status !== 'paid' && (
            <Button
              key="mark-paid"
              onClick={() => handleStatusChange(selectedInvoice, 'paid')}
            >
              Mark as Paid (Manual)
            </Button>
          ),
          selectedInvoice?.status === 'draft' && (
            <Button
              key="send"
              onClick={() => handleStatusChange(selectedInvoice, 'sent')}
            >
              Send Invoice
            </Button>
          ),
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {selectedInvoice && (
          <Tabs
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <>
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Invoice Number">
                        {selectedInvoice.invoice_number}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor(selectedInvoice.status)}>
                          {selectedInvoice.status?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Customer">
                        {selectedInvoice.customer
                          ? `${selectedInvoice.customer.first_name || ''} ${selectedInvoice.customer.last_name || ''}`.trim() || selectedInvoice.customer.company_name
                          : selectedInvoice.lead
                          ? `${selectedInvoice.lead.first_name || ''} ${selectedInvoice.lead.last_name || ''}`.trim() || selectedInvoice.lead.company_name
                          : 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Currency">
                        {selectedInvoice.currency || 'USD'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Issue Date">
                        {selectedInvoice.issue_date ? dayjs(selectedInvoice.issue_date).format('MMM DD, YYYY') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Due Date">
                        {selectedInvoice.due_date ? dayjs(selectedInvoice.due_date).format('MMM DD, YYYY') : '-'}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider>Items</Divider>
                    <Table
                      dataSource={selectedInvoice.items || []}
                      pagination={false}
                      columns={[
                        { title: 'Description', dataIndex: 'description', key: 'description' },
                        { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                        {
                          title: 'Unit Price',
                          dataIndex: 'unit_price',
                          key: 'unit_price',
                          render: (price) => parseFloat(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
                        },
                        {
                          title: 'Tax Rate',
                          dataIndex: 'tax_rate',
                          key: 'tax_rate',
                          render: (rate) => `${rate || 0}%`,
                        },
                        {
                          title: 'Discount',
                          dataIndex: 'discount_rate',
                          key: 'discount_rate',
                          render: (rate) => `${rate || 0}%`,
                        },
                        {
                          title: 'Line Total',
                          dataIndex: 'line_total',
                          key: 'line_total',
                          render: (total) => parseFloat(total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
                        },
                      ]}
                      rowKey="id"
                    />

                    <Divider>Summary</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="Subtotal" value={selectedInvoice.subtotal || 0} precision={2} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Tax Amount" value={selectedInvoice.tax_amount || 0} precision={2} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Discount" value={selectedInvoice.discount_amount || 0} precision={2} />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Total Amount"
                          value={selectedInvoice.total_amount || 0}
                          precision={2}
                          valueStyle={{ color: '#1890ff', fontSize: 20 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Paid Amount" value={selectedInvoice.paid_amount || 0} precision={2} />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Balance"
                          value={selectedInvoice.balance || selectedInvoice.total_amount || 0}
                          precision={2}
                          valueStyle={{ color: parseFloat(selectedInvoice.balance || selectedInvoice.total_amount || 0) > 0 ? '#cf1322' : '#3f8600' }}
                        />
                      </Col>
                    </Row>

                    {selectedInvoice.notes && (
                      <>
                        <Divider>Notes</Divider>
                        <Text>{selectedInvoice.notes}</Text>
                      </>
                    )}

                    {selectedInvoice.terms && (
                      <>
                        <Divider>Terms & Conditions</Divider>
                        <Text>{selectedInvoice.terms}</Text>
                      </>
                    )}
                  </>
                ),
              },
              {
                key: 'payments',
                label: 'Payments',
                children: (
                  <Table
                    dataSource={selectedInvoice.payments || []}
                    pagination={false}
                    columns={[
                      {
                        title: 'Date',
                        dataIndex: 'payment_date',
                        key: 'payment_date',
                        render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
                      },
                      {
                        title: 'Amount',
                        dataIndex: 'amount',
                        key: 'amount',
                        render: (amount) => parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
                      },
                      {
                        title: 'Method',
                        dataIndex: 'payment_method',
                        key: 'payment_method',
                      },
                      {
                        title: 'Reference',
                        dataIndex: 'reference_number',
                        key: 'reference_number',
                      },
                      {
                        title: 'Recorded By',
                        key: 'recorded_by',
                        render: (_, record) => record.received_by?.name || '-',
                      },
                    ]}
                    rowKey="id"
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default Invoices;


