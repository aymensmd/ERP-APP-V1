import React, { useState, useEffect } from 'react';
import {
  Badge, Button, Card, Drawer, Form, Input, Space, Table,
  DatePicker, Select, Popconfirm, Typography, Spin, message
} from 'antd';
import axios from '../axios';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useStateContext } from '../contexts/ContextProvider';

const { Title } = Typography;
const { Option } = Select;

dayjs.locale('fr');

const vacationTypes = [
  'Annuel', 'Maladie', 'Sans solde', 'Maternité', 'Paternité', 'Autre',
];

const VacData = ({ setTotalVacationDays }) => {
  const { token, user } = useStateContext();
  const [vacationData, setVacationData] = useState([]);
  const [updateDrawerVisible, setUpdateDrawerVisible] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (token && user?.id) {
      fetchVacations();
    } else {
      message.error('Authentication required');
    }
  }, [token, user]);

  const fetchVacations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/vacations?user_id=${user.id}`);

      if (response.data && Array.isArray(response.data)) {
        setVacationData(response.data);
        calculateTotalVacationDays(response.data);
      } else {
        message.warning('No vacation data found');
        setVacationData([]);
      }
    } catch (error) {
      console.error('Failed to fetch vacations:', error);
      message.error(error.response?.data?.message || 'Failed to fetch vacations');
      setVacationData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalVacationDays = (vacations) => {
    let totalDays = 0;
    vacations
      .filter(vacation => vacation.status === 'Approuvé')
      .forEach(vacation => {
        const startDate = dayjs(vacation.start_date);
        const endDate = dayjs(vacation.end_date);
        const days = endDate.diff(startDate, 'day') + 1;
        totalDays += days;
      });
    setTotalVacationDays(totalDays);
  };

  const validateDates = (_, value) => {
    const startDate = form.getFieldValue('start_date');
    if (startDate && value && value.isBefore(startDate, 'day')) {
      return Promise.reject('End date must be after start date');
    }
    return Promise.resolve();
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <span style={{ fontWeight: 500 }}>{type?.name || type || '-'}</span>,
    },
    {
      title: 'Raison',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => <span style={{ color: '#888' }}>{reason || '-'}</span>,
    },
    {
      title: 'Date de début',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-',
    },
    {
      title: 'Date de fin',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-',
    },
    {
      title: 'Statut',
      key: 'status',
      render: (_, record) => (
        <Space size="middle">
          <Badge
            status={
              record.status === 'Approuvé' ? 'success' :
              record.status === 'Refusé' ? 'error' : 'processing'
            }
            text={record.status || 'Pending'}
          />
          {record.status === 'Pending' ? (
            <Button type="link" onClick={() => showUpdateDrawer(record)}>Modifier</Button>
          ) : (
            <span style={{ color: 'rgba(0, 0, 0, 0.25)' }}>Non modifiable</span>
          )}
        </Space>
      ),
    },
  ];

  const showUpdateDrawer = (vacation) => {
    setSelectedVacation(vacation);
    setUpdateDrawerVisible(true);
    form.setFieldsValue({
      ...vacation,
      start_date: vacation.start_date ? dayjs(vacation.start_date) : null,
      end_date: vacation.end_date ? dayjs(vacation.end_date) : null,
      type: typeof vacation.type === 'object' ? vacation.type.name : vacation.type,
    });
  };

  const closeUpdateDrawer = () => {
    setUpdateDrawerVisible(false);
    setSelectedVacation(null);
    form.resetFields();
  };

  const handleUpdateFormSubmit = async (values) => {
    try {
      await axios.put(
        `/vacations/${selectedVacation.id}`,
        {
          ...values,
          start_date: values.start_date.format('YYYY-MM-DD'),
          end_date: values.end_date.format('YYYY-MM-DD'),
        }
      );

      message.success('Demande mise à jour avec succès');
      closeUpdateDrawer();
      fetchVacations();
    } catch (error) {
      console.error('Update error:', error);
      message.error(error.response?.data?.message || 'Échec de la mise à jour');
    }
  };

  const handleDeleteVacation = async () => {
    try {
      await axios.delete(`/vacations/${selectedVacation.id}`);
      message.success('Demande supprimée avec succès');
      closeUpdateDrawer();
      fetchVacations();
    } catch (error) {
      console.error('Delete error:', error);
      message.error(error.response?.data?.message || 'Échec de la suppression');
    }
  };

  return (
    <Card
      style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        borderRadius: '16px',
        border: 'none'
      }}
      styles={{ 
        body: { padding: '32px' },
        header: { 
          padding: '24px 32px',
          borderBottom: '1px solid #f0f0f0',
          borderRadius: '16px 16px 0 0'
        }
      }}
      title={
        <Title level={3} style={{ margin: 0, color: '#1890ff', fontWeight: 600, fontSize: '24px' }}>
          Mes Vacances
        </Title>
      }
      variant="outlined"
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={vacationData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} demandes`,
            style: { marginTop: '16px' }
          }}
          rowKey={(record) => record.id}
          style={{ 
            marginTop: 0,
            background: 'transparent'
          }}
          size="middle"
          locale={{ emptyText: 'Aucune demande de vacances trouvée' }}
          className="vacation-table"
        />
      </Spin>

      <Drawer
        title={
          <span style={{ 
            color: '#1890ff', 
            fontSize: '20px', 
            fontWeight: 600 
          }}>
            Modifier la demande de congé
          </span>
        }
        placement="right"
        onClose={closeUpdateDrawer}
        open={updateDrawerVisible}
        destroyOnClose
        width={480}
        styles={{ 
          body: { padding: '24px' },
          header: { 
            padding: '20px 24px',
            borderBottom: '1px solid #f0f0f0'
          }
        }}
      >
        {selectedVacation && (
          <Form layout="vertical" form={form} onFinish={handleUpdateFormSubmit}>
            <Form.Item
              name="start_date"
              label="Date de début"
              rules={[{ required: true, message: 'Veuillez sélectionner une date de début' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>

            <Form.Item
              name="end_date"
              label="Date de fin"
              rules={[
                { required: true, message: 'Veuillez sélectionner une date de fin' },
                { validator: validateDates },
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Veuillez sélectionner un type' }]}
            >
              <Select placeholder="Sélectionner le type">
                {vacationTypes.map((type) => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="reason" label="Raison">
              <Input.TextArea rows={2} placeholder="Raison du congé" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">Modifier</Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer cette demande ?"
                  onConfirm={handleDeleteVacation}
                  okText="Oui"
                  cancelText="Non"
                >
                  <Button danger>Supprimer</Button>
                </Popconfirm>
                <Button onClick={closeUpdateDrawer}>Annuler</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </Card>
  );
};

export default VacData;
