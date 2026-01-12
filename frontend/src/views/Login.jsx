import React, { useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { Button, Card, Checkbox, Form, Input, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider';
import { useCompany } from '../contexts/CompanyContext';
import axios from '../axios';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import AnyNamecrm from '../assets/AnyNamecrm.png';
import crm from '../assets/crm.png';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setToken, setUser } = useStateContext();
  const { loadCompanies } = useCompany();

  const onFinish = async (values) => {
    try {
      setLoading(true);

      const response = await axios.post('/login', {
        email: values.email,
        password: values.password,
      });

      // Handle Laravel API response format
      const responseData = response.data.data || response.data;
      const { token, user } = responseData;

      storage.set(STORAGE_KEYS.TOKEN, token);
      storage.set(STORAGE_KEYS.USER_DATA, user);
      storage.set(STORAGE_KEYS.USER, user);
      if (user?.id) {
        storage.set(STORAGE_KEYS.USER_ID, user.id.toString());
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setToken(token);
      setUser(user);

      // Load companies after login
      try {
        await loadCompanies();
      } catch (error) {
        console.error('Error loading companies:', error);
      }

      navigate('/dashboard');
      message.success('Welcome back!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card">
          <div className="login-header">
            <img src={AnyNamecrm} alt="AnyName CRM" className="login-logo" />
            <h1 className="login-title">Welcome to AnyName</h1>
            <p className="login-subtitle">Your business communication hub</p>
          </div>

          <Form
            name="login-form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            className="login-form"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined className="input-icon" />}
                placeholder="Email address"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="Password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <div className="login-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="login-button"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <div className="animated-background">
        <div className="water-blob water-blob-1"></div>
        <div className="water-blob water-blob-2"></div>

        <div className="water-blob water-blob-3"></div>
        <div className="water-blob water-blob-4"></div>
      </div>
    </div>
  );
}