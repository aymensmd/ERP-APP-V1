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
  Avatar,
  Tooltip,
  Dropdown,
  Badge,
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
  UserOutlined,
  PrinterOutlined,
  DownloadOutlined,
  MoreOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from '../axios';
import { useCompany } from '../contexts/CompanyContext';
import { useStateContext } from '../contexts/ContextProvider';
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
  const { theme } = useStateContext();

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
    } catch (error) {
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
    } catch (error) {
      message.error('Failed to delete invoice');
    }
  };

  const handleStatusChange = async (invoice, newStatus) => {
    try {
      await axios.put(`/invoices/${invoice.id}`, { status: newStatus });
      message.success('Invoice status updated');
      fetchInvoices();
      fetchStats();
    } catch (error) {
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
    } catch (error) {
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
      render: (text) => (
        <Space>
          <FileTextOutlined style={{ color: '#4f46e5' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => {
        const name = record.customer
          ? `${record.customer.first_name || ''} ${record.customer.last_name || ''}`.trim() || record.customer.company_name
          : record.lead
            ? `${record.lead.first_name || ''} ${record.lead.last_name || ''}`.trim() || record.lead.company_name
            : 'N/A';
        return (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12 }}>Issue: {record.issue_date ? dayjs(record.issue_date).format('MMM DD, YYYY') : '-'}</div>
          <div style={{ fontSize: 12, color: dayjs(record.due_date).isBefore(dayjs()) && record.status !== 'paid' ? '#ef4444' : '#8c8c8c' }}>
            Due: {record.due_date ? dayjs(record.due_date).format('MMM DD, YYYY') : '-'}
          </div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount, record) => (
        <Text strong style={{ color: '#10b981' }}>
          {record.currency || 'USD'} {parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)} style={{ borderRadius: 6, fontSize: 10 }}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="PDF">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleGeneratePdf(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete invoice?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={2} className="text-gradient" style={{ marginBottom: 4 }}>Invoices</Title>
          <Text type="secondary">Manage customer billing and track payments.</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 10, background: 'var(--primary-gradient)', border: 'none' }}
          onClick={handleCreate}
        >
          Create Invoice
        </Button>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8} md={6}>
          <Card className="glass-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary">Total Revenue</Text>}
              value={stats.totalAmount || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#4f46e5' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card className="glass-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary">Paid Amount</Text>}
              value={stats.paidAmount || 0}
              precision={2}
              valueStyle={{ color: '#10b981' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card className="glass-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary">Pending Amount</Text>}
              value={stats.pendingAmount || 0}
              precision={2}
              valueStyle={{ color: '#ef4444' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card className="glass-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary">Invoices Count</Text>}
              value={stats.total || 0}
            />
          </Card>
        </Col>
      </Row>

      <Card className="glass-card" bodyStyle={{ padding: 24 }}>
        <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search invoices..."
            prefix={<EyeOutlined style={{ color: '#bfbfbf' }} />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 300, borderRadius: 8 }}
            allowClear
          />
          <Select
            placeholder="Status"
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
            placeholder="Customer"
            value={filters.customer_id}
            onChange={(value) => setFilters({ ...filters, customer_id: value })}
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {customers.map((c) => (
              <Option key={c.id} value={c.id}>
                {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company_name}
              </Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={invoices}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          className="premium-table"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Save Invoice"
        className="premium-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_id" label="Customer">
                <Select placeholder="Select Customer" allowClear showSearch optionFilterProp="children">
                  {customers.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lead_id" label="Lead (Optional)">
                <Select placeholder="Select Lead" allowClear showSearch optionFilterProp="children">
                  {leads.map((l) => (
                    <Option key={l.id} value={l.id}>
                      {`${l.first_name || ''} ${l.last_name || ''}`.trim() || l.company_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="issue_date" label="Issue Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Currency" initialValue="USD">
                <Select>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                  <Option value="MAD">MAD</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Items</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
                    <Col span={10}>
                      <Form.Item {...restField} name={[name, 'description']} rules={[{ required: true }]}>
                        <Input placeholder="Description" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true }]}>
                        <InputNumber min={1} placeholder="Qty" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item {...restField} name={[name, 'unit_price']} rules={[{ required: true }]}>
                        <InputNumber min={0} placeholder="Price" style={{ width: '100%' }} prefix="$" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Item</Button>
              </>
            )}
          </Form.List>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="pdf" icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} style={{ background: 'var(--primary-gradient)', border: 'none' }} onClick={() => handleGeneratePdf(selectedInvoice)}>Download PDF</Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>Close</Button>,
        ]}
        width={850}
        className="premium-modal"
      >
        {selectedInvoice && (
          <div id="invoice-print-area" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
              <div>
                <Title level={4} className="text-gradient" style={{ margin: 0 }}>INVOICE</Title>
                <Text strong>#{selectedInvoice.invoice_number}</Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Title level={4} style={{ margin: 0 }}>{currentCompany?.name}</Title>
                <Text type="secondary">{currentCompany?.email}</Text>
              </div>
            </div>

            <Row gutter={32} style={{ marginBottom: 40 }}>
              <Col span={12}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>BILLED TO</Text>
                <Title level={5} style={{ margin: 0 }}>
                  {selectedInvoice.customer
                    ? `${selectedInvoice.customer.first_name || ''} ${selectedInvoice.customer.last_name || ''}`.trim() || selectedInvoice.customer.company_name
                    : selectedInvoice.lead
                      ? `${selectedInvoice.lead.first_name || ''} ${selectedInvoice.lead.last_name || ''}`.trim() || selectedInvoice.lead.company_name
                      : 'N/A'}
                </Title>
                <Text type="secondary">{selectedInvoice.customer?.email || selectedInvoice.lead?.email}</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">DATE: <Text strong>{dayjs(selectedInvoice.issue_date).format('MMM DD, YYYY')}</Text></Text>
                  <Text type="secondary">DUE DATE: <Text strong>{dayjs(selectedInvoice.due_date).format('MMM DD, YYYY')}</Text></Text>
                  <Text type="secondary">STATUS: <Tag color={getStatusColor(selectedInvoice.status)}>{selectedInvoice.status?.toUpperCase()}</Tag></Text>
                </Space>
              </Col>
            </Row>

            <Table
              dataSource={selectedInvoice.items || []}
              pagination={false}
              rowKey="id"
              columns={[
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 80 },
                { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price', render: (v) => `$${v}`, width: 120 },
                { title: 'Total', key: 'total', render: (_, r) => `$${(r.quantity * r.unit_price).toLocaleString()}`, align: 'right', width: 120 },
              ]}
              style={{ marginBottom: 32 }}
            />

            <Row justify="end">
              <Col span={10}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Subtotal:</Text>
                  <Text strong>${parseFloat(selectedInvoice.subtotal || 0).toLocaleString()}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Tax ({selectedInvoice.tax_rate || 0}%):</Text>
                  <Text strong>${parseFloat(selectedInvoice.tax_amount || 0).toLocaleString()}</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Title level={4} style={{ margin: 0 }}>Total:</Title>
                  <Title level={4} style={{ margin: 0, color: '#4f46e5' }}>
                    {selectedInvoice.currency || 'USD'} {parseFloat(selectedInvoice.total_amount || 0).toLocaleString()}
                  </Title>
                </div>
              </Col>
            </Row>

            {selectedInvoice.notes && (
              <div style={{ marginTop: 40 }}>
                <Text strong>Notes:</Text>
                <p style={{ color: '#8c8c8c' }}>{selectedInvoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .premium-table .ant-table { background: transparent !important; }
        .premium-table .ant-table-thead > tr > th { background: rgba(0,0,0,0.02) !important; color: #8c8c8c !important; font-weight: 600 !important; font-size: 12px !important; text-transform: uppercase !important; border-bottom: 2px solid #f0f0f0 !important; }
        .premium-table .ant-table-row:hover > td { background: rgba(79, 70, 229, 0.02) !important; }
        @media print {
            body * { visibility: hidden; }
            #invoice-print-area, #invoice-print-area * { visibility: visible; }
            #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Invoices;
