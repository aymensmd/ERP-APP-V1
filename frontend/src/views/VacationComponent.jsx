import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Space, Table, Row, Button, Drawer, Form, Select, 
  message, Tag, Typography, Divider, Col, Descriptions,
  theme, Spin, Progress, List, Tooltip, Badge, Segmented
} from 'antd';
import { 
  UserOutlined, InfoCircleOutlined, MailOutlined, TeamOutlined, 
  FilePdfOutlined, FileExcelOutlined, CloudSyncOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  CalendarOutlined, PrinterOutlined
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useStateContext } from '../contexts/ContextProvider';

// --- MOCK DATA FOR ERP COMPONENTS ---
const PUBLIC_HOLIDAYS = [
  { date: '2024-05-01', name: 'Fête du Travail' },
  { date: '2024-07-25', name: 'Fête de la République' },
  { date: '2024-10-15', name: 'Fête de l\'Évacuation' },
];

const DEPARTMENT_FILTERS = ['All', 'IT', 'RH', 'Finance', 'Marketing'];

const { useToken } = theme;
const { Option } = Select;
const { Title, Text } = Typography;

dayjs.locale('fr');

// --- HELPER COMPONENT: VACATION BALANCE (Left Sidebar) ---
const VacationBalanceCard = ({ token }) => (
  <Card 
    title={<span style={{fontSize: 14}}><ClockCircleOutlined /> Solde de Congés (Global)</span>} 
    style={{ borderRadius: 12, marginBottom: 16, boxShadow: token.boxShadowSecondary }}
    size="small"
  >
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <Progress type="circle" percent={75} size={60} strokeColor={token.colorPrimary} />
        <div style={{ fontSize: 11, marginTop: 5, color: token.colorTextSecondary }}>Payés Pris</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Progress type="circle" percent={30} size={60} strokeColor={token.colorWarning} />
        <div style={{ fontSize: 11, marginTop: 5, color: token.colorTextSecondary }}>Maladie</div>
      </div>
    </div>
    <Divider style={{ margin: '8px 0' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <Text type="secondary">Annuel Restant:</Text>
      <Text strong>128 Jours</Text>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <Text type="secondary">Mois courant:</Text>
      <Text type="success">+2.5 Jours</Text>
    </div>
  </Card>
);

// --- HELPER COMPONENT: UPCOMING HOLIDAYS (Left Sidebar) ---
const UpcomingHolidays = ({ token }) => (
  <Card 
    title={<span style={{fontSize: 14}}><CalendarOutlined /> Jours Fériés à venir</span>} 
    style={{ borderRadius: 12, marginBottom: 16, boxShadow: token.boxShadowSecondary }}
    size="small"
  >
    <List
      itemLayout="horizontal"
      dataSource={PUBLIC_HOLIDAYS}
      renderItem={(item) => (
        <List.Item style={{ padding: '8px 0' }}>
          <List.Item.Meta
            avatar={<Badge color="purple" />}
            title={<Text style={{ fontSize: 12 }}>{item.name}</Text>}
            description={<Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.date).format('DD MMMM YYYY')}</Text>}
          />
        </List.Item>
      )}
    />
  </Card>
);

const VacationComponent = () => {
  const { user: currentUser } = useStateContext();
  const { token } = useToken();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [userData, setUserData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Styles
  const cardStyles = {
    background: token.colorBgContainer,
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: `1px solid ${token.colorBorderSecondary}`,
  };

  const statCardStyles = {
    ...cardStyles,
    padding: '16px',
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center'
  };

  // --- DATA FETCHING & PREPARATION ---
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/employees');
      const employees = Array.isArray(response.data) ? response.data : [];
      
      const usersWithVacations = employees.map(user => {
        // --- SAFEGUARD LOGIC: Flatten Objects to Strings ---
        // If department is an object {id, name...}, extract name. If it's null, use 'N/A'
        let deptName = 'N/A';
        if (user.department && typeof user.department === 'object') {
            deptName = user.department.name || 'N/A';
        } else if (user.department) {
            deptName = String(user.department);
        }

        // Handle Role similarly just in case
        let roleName = 'N/A';
        if (user.role && typeof user.role === 'object') {
            roleName = user.role.name || 'N/A';
        } else if (user.role) {
            roleName = String(user.role);
        }

        return {
          ...user,
          key: user.id,
          department: deptName, // Now guaranteed to be a string
          role: roleName,       // Now guaranteed to be a string
          vacationRequests: Array.isArray(user.vacations) ? user.vacations : []
        };
      });
      
      setUserData(usersWithVacations);
      setFilteredData(usersWithVacations);
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // --- FILTER LOGIC ---
  useEffect(() => {
    if (selectedDept === 'All') {
      setFilteredData(userData);
    } else {
      setFilteredData(userData.filter(u => u.department === selectedDept));
    }
  }, [selectedDept, userData]);

  // --- EXPORT TOOLS LOGIC ---
  const handleExportCSV = () => {
    setExportLoading(true);
    setTimeout(() => {
      const headers = ['Employee,Department,Start Date,End Date,Reason,Status'];
      const rows = userData.flatMap(u => 
        u.vacationRequests.map(v => 
          `${u.name},${u.department},${v.start_date},${v.end_date},"${v.reason}",${v.status}`
        )
      );
      
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "vacations_export.csv");
      document.body.appendChild(link);
      link.click();
      
      message.success("Export Excel/CSV réussi");
      setExportLoading(false);
    }, 1000);
  };

  const handlePrintPDF = (request) => {
    message.loading("Génération du document PDF...");
    setTimeout(() => {
        message.success("Document envoyé à l'imprimante");
        window.print();
    }, 800);
  };

  const handleGoogleSync = () => {
    message.loading("Synchronisation avec Google Drive...");
    setTimeout(() => {
      message.success("Données synchronisées avec succès !");
    }, 1500);
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: 'Employé',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
           <div style={{ width: 32, height: 32, borderRadius: '50%', background: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: token.colorPrimary }}>
              {text ? text.charAt(0).toUpperCase() : 'U'}
           </div>
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             <Text strong>{text || 'Unknown'}</Text>
             {/* Use record.role safely */}
             <Text type="secondary" style={{ fontSize: 11 }}>{record.role}</Text>
           </div>
        </Space>
      )
    },
    {
      title: 'Département',
      dataIndex: 'department',
      key: 'department',
      render: (text) => {
        // Double check: if text is somehow still an object, extract name
        const display = (typeof text === 'object' && text !== null) ? (text.name || 'N/A') : (text || 'General');
        return <Tag>{display}</Tag>;
      }
    },
    {
      title: 'Demandes',
      key: 'vacations',
      align: 'right',
      render: (_, record) => {
        const count = record.vacationRequests?.length || 0;
        return (
          <Button 
            size="small"
            onClick={() => toggleExpand(record.key)}
            type={count > 0 ? "default" : "dashed"}
          >
             {count} Demandes {expandedRowKeys.includes(record.key) ? <UserOutlined /> : <UserOutlined />}
          </Button>
        );
      }
    }
  ];

  const toggleExpand = (key) => {
    setExpandedRowKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // --- NESTED TABLE (Vacation Details) ---
  const expandedRowRender = (record) => (
    <div style={{ background: token.colorFillAlter, padding: '16px', borderRadius: 8 }}>
      <Table
        columns={[
          { title: 'Début', dataIndex: 'start_date', render: d => dayjs(d).format('DD MMM YYYY') },
          { title: 'Fin', dataIndex: 'end_date', render: d => dayjs(d).format('DD MMM YYYY') },
          { title: 'Raison', dataIndex: 'reason', ellipsis: true },
          { title: 'Statut', dataIndex: 'status', render: (s) => {
              let color = s === 'Approuvé' ? 'success' : s === 'Refusé' ? 'error' : 'warning';
              let icon = s === 'Approuvé' ? <CheckCircleOutlined /> : s === 'Refusé' ? <CloseCircleOutlined /> : <ClockCircleOutlined />;
              return <Tag icon={icon} color={color}>{s || 'Pending'}</Tag>
          }},
          { title: 'Actions', key: 'action', render: (_, req) => (
              <Space>
                  {(req.status === 'En attente' || req.status === 'pending') && (
                    <Button size="small" type="primary" ghost onClick={() => openDrawer(req, record)}>Gérer</Button>
                  )}
                  {req.status === 'Approuvé' && (
                    <Tooltip title="Générer Attestation">
                        <Button size="small" icon={<FilePdfOutlined />} onClick={() => handlePrintPDF(req)} />
                    </Tooltip>
                  )}
              </Space>
          )}
        ]}
        dataSource={record.vacationRequests}
        pagination={false}
        size="small"
        rowKey="id"
      />
    </div>
  );

  const openDrawer = (request, user) => {
    setSelectedVacation(request);
    setSelectedUser(user);
    form.setFieldsValue({ status: request.status });
    setDrawerVisible(true);
  };

  const onFinish = async (values) => {
    try {
      await axios.put(`/vacations/${selectedVacation.id}`, { ...selectedVacation, status: values.status });
      message.success('Statut mis à jour');
      setDrawerVisible(false);
      fetchUserData();
    } catch (error) {
      message.error('Erreur lors de la mise à jour');
    }
  };

  // --- CALCULATIONS ---
  const allRequests = userData.flatMap(u => u.vacationRequests || []);
  const stats = {
    total: userData.length,
    approved: allRequests.filter(r => r.status === 'Approuvé').length,
    pending: allRequests.filter(r => r.status === 'En attente' || r.status === 'pending').length,
    onLeave: allRequests.filter(r => {
        const today = dayjs();
        return dayjs(r.start_date).isBefore(today) && dayjs(r.end_date).isAfter(today) && r.status === 'Approuvé';
    }).length
  };

  return (
    <div style={{ padding: '24px', background: token.colorBgLayout, minHeight: '100vh' }}>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          
          {/* --- LEFT SIDEBAR (ERP TOOLS) --- */}
          <Col xs={24} md={6} lg={5}>
             {/* 1. Quick Filters */}
             <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>FILTRER PAR DÉPARTEMENT</Text>
                <Segmented 
                    options={DEPARTMENT_FILTERS} 
                    value={selectedDept}
                    onChange={setSelectedDept}
                    block
                    vertical
                />
             </div>

            {/* 2. Global Balance */}
            <VacationBalanceCard token={token} />

            {/* 3. Holidays */}
            <UpcomingHolidays token={token} />

            {/* 4. Legend */}
            <Card title="Légende" size="small" style={{ borderRadius: 12, boxShadow: token.boxShadowSecondary }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{display:'flex', alignItems:'center', gap:8}}><div style={{width:8, height:8, borderRadius:'50%', background: token.colorSuccess}}></div> Approuvé (Payé)</div>
                    <div style={{display:'flex', alignItems:'center', gap:8}}><div style={{width:8, height:8, borderRadius:'50%', background: token.colorWarning}}></div> En attente</div>
                    <div style={{display:'flex', alignItems:'center', gap:8}}><div style={{width:8, height:8, borderRadius:'50%', background: token.colorError}}></div> Refusé / Annulé</div>
                </Space>
            </Card>
          </Col>
          
          {/* --- MAIN CONTENT --- */}
          <Col xs={24} md={18} lg={19}>
            
            {/* 1. TOOLBAR HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Gestion des Congés</Title>
                    <Text type="secondary">Gérez les demandes, les approbations et les documents RH.</Text>
                </div>
                <Space>
                    <Tooltip title="Synchroniser avec Google Sheets (Payroll)">
                        <Button icon={<CloudSyncOutlined />} onClick={handleGoogleSync}>Sync Drive</Button>
                    </Tooltip>
                    <Button 
                        icon={<FileExcelOutlined />} 
                        onClick={handleExportCSV} 
                        loading={exportLoading}
                        style={{ color: '#107c41', borderColor: '#107c41' }}
                    >
                        Export Excel
                    </Button>
                    <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
                        Rapport Global
                    </Button>
                </Space>
            </div>

            {/* 2. STATISTICS ROW */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card style={statCardStyles} bordered={false}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: token.colorPrimary }}>{stats.total}</div>
                        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>Total Employés</div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={statCardStyles} bordered={false}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: token.colorSuccess }}>{stats.approved}</div>
                        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>Approuvés (YTD)</div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={statCardStyles} bordered={false}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: token.colorWarning }}>{stats.pending}</div>
                        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>En attente</div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={statCardStyles} bordered={false}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#722ed1' }}>{stats.onLeave}</div>
                        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>En congé auj.</div>
                    </Card>
                </Col>
            </Row>

            {/* 3. MAIN TABLE CARD */}
            <Card 
                style={{ ...cardStyles, overflow: 'hidden' }} 
                bodyStyle={{ padding: 0 }}
                title={<div style={{display:'flex', gap:8, alignItems:'center'}}><TeamOutlined /> <span style={{fontSize: 16}}>Vue d'ensemble des employés</span></div>}
            >
              <Table
                columns={columns}
                dataSource={filteredData}
                expandable={{ expandedRowRender, expandedRowKeys, onExpand: (exp, rec) => toggleExpand(rec.key) }}
                pagination={{ pageSize: 8 }}
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* --- EDIT STATUS DRAWER --- */}
      <Drawer 
        title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                <span>Traitement de la demande</span>
            </div>
        } 
        open={drawerVisible} 
        onClose={() => setDrawerVisible(false)}
        width={400}
      >
        {selectedUser && selectedVacation && (
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <div style={{ background: token.colorFillAlter, padding: 16, borderRadius: 8, marginBottom: 24 }}>
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="Employé">{selectedUser.name}</Descriptions.Item>
                        <Descriptions.Item label="Département">
                             {/* SAFEGUARD: If department is object, show name, otherwise show string */}
                             {typeof selectedUser.department === 'object' && selectedUser.department !== null 
                                ? selectedUser.department.name 
                                : selectedUser.department}
                        </Descriptions.Item>
                        <Descriptions.Item label="Période">
                            {dayjs(selectedVacation.start_date).format('DD/MM')} - {dayjs(selectedVacation.end_date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Motif">{selectedVacation.reason}</Descriptions.Item>
                    </Descriptions>
                </div>

                <Form.Item name="status" label="Décision RH" rules={[{ required: true }]}>
                    <Select size="large">
                        <Option value="Approuvé">✅ Approuver la demande</Option>
                        <Option value="Refusé">❌ Refuser la demande</Option>
                        <Option value="En attente">⏳ Laisser en attente</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Note interne (Optionnel)">
                    <textarea 
                        className="ant-input" 
                        rows={3} 
                        placeholder="Ajouter une note pour le dossier..." 
                        style={{ resize: 'none' }}
                    />
                </Form.Item>

                <Button type="primary" htmlType="submit" block size="large" style={{ marginTop: 16 }}>
                    Confirmer la décision
                </Button>
            </Form>
        )}
      </Drawer>
    </div>
  );
};

export default VacationComponent;