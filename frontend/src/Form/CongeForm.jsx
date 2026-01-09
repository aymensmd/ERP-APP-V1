import React, { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Select, DatePicker, message, ConfigProvider } from 'antd';
import axios from '../axios';
import dayjs from 'dayjs';
import { useStateContext } from '../contexts/ContextProvider';
import { useNavigate } from 'react-router-dom';
const { Option } = Select;

const DayOffRequestForm = ({ onSuccess }) => {
const { theme, token: contextToken, user } = useStateContext(); // Get user from context
  const navigate = useNavigate(); // Initialize navigate
  const [hasPendingVacation, setHasPendingVacation] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Theme configuration
  const themeStyles = {
    light: {
      containerBg: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      formBg: 'rgba(255,255,255,0.95)',
      textColor: '#2d3a4b',
      borderColor: '#d9d9d9',
      cardShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      formShadow: '0 2px 8px rgba(0,0,0,0.07)',
      dividerColor: '#f0f0f0',
    },
    dark: {
      containerBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      formBg: 'rgba(30, 30, 46, 0.95)',
      textColor: 'rgba(255, 255, 255, 0.85)',
      borderColor: '#434343',
      cardShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      formShadow: '0 2px 8px rgba(0,0,0,0.2)',
      dividerColor: '#303030',
    }
  };

  const currentTheme = themeStyles[theme];


   const verifyAuthentication = () => {
    // Use token from context first, fallback to localStorage
    const token = contextToken || localStorage.getItem('ACCESS_TOKEN');
    const userId = user?.id || localStorage.getItem('USER_ID');
    
    if (!token) {
      console.error('Authentication error: No token found');
      message.error('Please login to access this feature');
      navigate('/login');
      return false;
    }
    
    if (!userId) {
      console.error('Authentication error: No user ID found');
      message.error('User session incomplete');
      navigate('/login');
      return false;
    }
    
    return { token, userId };
  };

  useEffect(() => {
    const fetchPendingVacation = async () => {
      const auth = verifyAuthentication();
      if (!auth) return;

      try {
        const response = await axios.get('/vacations', {
          params: {
            user_id: auth.userId,
            status: 'Pending'
          }
        });

        setHasPendingVacation(response.data.length > 0);
      } catch (error) {
        console.error('API Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.response?.status === 401) {
          message.error('Session expired. Please login again.');
          navigate('/login');
        } else {
          message.error(error.response?.data?.message || 'Failed to check pending vacations');
        }
      }
    };

    fetchPendingVacation();
  }, [navigate, contextToken, user]); // Add dependencies

  const onFinish = async (values) => {
    const auth = verifyAuthentication();
    if (!auth) return;
    
    if (hasPendingVacation) {
      message.error('You already have a pending vacation request.');
      return;
    }

    try {
      setLoading(true);
      
      // Log what we're about to send
      const requestData = {
        type: values.dayOffType,
        start_date: values.startDate.format('YYYY-MM-DD'),
        end_date: values.endDate.format('YYYY-MM-DD'),
        reason: values.reason,
        status: 'Pending'
      };
      
      console.log('Sending vacation request:', requestData);
      console.log('Type value:', JSON.stringify(requestData.type));
      console.log('Type length:', requestData.type?.length);
      
      const response = await axios.post('/vacations', requestData);

      message.success('Request submitted successfully');
      setHasPendingVacation(true);
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Submission Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 422) {
        // Handle validation errors - Laravel returns errors in 'errors' key
        const validationErrors = error.response?.data?.errors || {};
        console.error('Full validation response:', error.response?.data);
        console.error('Validation errors object:', validationErrors);
        
        // Log what was sent
        console.error('Data sent:', {
          type: values.dayOffType,
          start_date: values.startDate?.format('YYYY-MM-DD'),
          end_date: values.endDate?.format('YYYY-MM-DD'),
          reason: values.reason,
          status: 'Pending'
        });
        
        const errorMessages = Object.values(validationErrors).flat();
        if (errorMessages.length > 0) {
          // Display first error message
          const firstError = Array.isArray(errorMessages[0]) ? errorMessages[0][0] : errorMessages[0];
          message.error(firstError || 'Validation failed. Please check your input.');
        } else {
          message.error(error.response?.data?.message || 'Validation failed. Please check your input.');
        }
      } else {
        message.error(error.response?.data?.message || 'Submission failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const disabledStartDate = (current) => {
    return current && current < dayjs().startOf('day');
  };

  const disabledEndDate = (current) => {
    if (!startDate) return current && current < dayjs().startOf('day');
    return current && current < dayjs(startDate).startOf('day');
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: currentTheme.formBg,
          colorBorder: currentTheme.borderColor,
          colorText: currentTheme.textColor,
          colorTextHeading: currentTheme.textColor,
          colorTextLabel: currentTheme.textColor,
          colorPrimary: theme === 'dark' ? '#177ddc' : '#1890ff',
        },
      }}
    >
      <div style={{
        background: currentTheme.containerBg,
        borderRadius: '16px',
        boxShadow: currentTheme.cardShadow,
        padding: '32px 24px',
        margin: '24px auto',
        maxWidth: 600,
        minWidth: 320,
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}> 
        <h2 style={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '2rem',
          color: currentTheme.textColor,
          marginBottom: 8,
          letterSpacing: 1,
        }}>
          Demande de congé
        </h2>
        <Divider style={{ 
          margin: '12px 0 24px 0',
          borderColor: currentTheme.dividerColor 
        }} />
        <Form 
          {...formItemLayout} 
          form={form}
          onFinish={onFinish} 
          style={{ 
            width: '100%', 
            background: currentTheme.formBg, 
            borderRadius: '12px', 
            padding: '24px 16px', 
            boxShadow: currentTheme.formShadow 
          }}
        >
          <Form.Item
            label="Type Congé"
            name="dayOffType"
            rules={[{ required: true, message: 'Please select type of day off' }]}
          >
            <Select 
              size="large" 
              placeholder="Sélectionner le type de congé"
            >
              <Option value="Annuel">Annuel</Option>
              <Option value="Maladie">Maladie</Option>
              <Option value="Sans solde">Sans solde</Option>
              <Option value="Maternité">Maternité</Option>
              <Option value="Paternité">Paternité</Option>
              <Option value="Autre">Autre</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Date début"
            name="startDate"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              size="large" 
              disabledDate={disabledStartDate}
              onChange={(date) => setStartDate(date)} 
              placeholder="Choisir la date de début"
            />
          </Form.Item>
          <Form.Item
            label="Date fin"
            name="endDate"
            rules={[
              { required: true, message: 'Please select end date' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('startDate') || 
                      dayjs(value).isAfter(getFieldValue('startDate')) || 
                      dayjs(value).isSame(getFieldValue('startDate'))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('End date must be after start date'));
                },
              }),
            ]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              size="large" 
              disabledDate={disabledEndDate} 
              placeholder="Choisir la date de fin"
            />
          </Form.Item>
          <Form.Item
            label="Raison"
            name="reason"
            rules={[
              { required: true, message: 'Please provide reason for day off' },
              { min: 10, message: 'Reason must be at least 10 characters' }
            ]}
          >
            <Input.TextArea 
              size="large" 
              placeholder="Décrivez la raison de votre congé" 
              autoSize={{ minRows: 3, maxRows: 6 }} 
            />
          </Form.Item>
          <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              disabled={hasPendingVacation} 
              loading={loading}
              size="large"
              style={{ 
                width: '100%', 
                maxWidth: '220px', 
                fontWeight: 600, 
                fontSize: '1.1rem', 
                height: 48, 
                borderRadius: 8 
              }}
            >
              {hasPendingVacation ? 'Request Pending' : 'Envoyer'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </ConfigProvider>
  );
};

export default DayOffRequestForm;