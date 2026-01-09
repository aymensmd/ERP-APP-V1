import React from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import axios from '../axios';
import { Link, useNavigate } from 'react-router-dom';
import { ConfigProvider, Card } from 'antd';

const { Option } = Select;

export default function SignUp() {
  const navigate = useNavigate();
  const onFinish = async (values) => {
    try {
      const response = await axios.post('/register', {
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        genre: values.genre,
      });

      console.log('Registration successful', response.data);

      // You can handle the registration success logic here
      message.success('Registration successful');

      // Redirect to the login page after successful registration
      navigate('/login');
    } catch (error) {
      console.error('Registration failed', error);
      message.error('Registration failed');

      // Display the error message received from the server
      if (error.response.data && error.response.data.message) {
        message.error(`Registration failed: ${error.response.data.message}`);
      } else {
        message.error('Registration failed');
      }
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <ConfigProvider form={{ validateMessages: { required: 'Please input ${label}!' } }}>
      <Card >
      <h2 style={{ color: "#1677ff" }}>Sign Up!</h2>
   
      <Form
        name="register"
        labelCol={{
          span: 8,
        }}
        wrapperCol={{
          span: 16,
        }}
        style={{
          maxWidth: 400,
          margin: 'auto',
          marginTop: 50,
        }}
        initialValues={{
          remember: true,
        }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[
            {
              required: true,
              message: 'Please input your name!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              type: 'email',
              message: 'The input is not a valid email!',
            },
            {
              required: true,
              message: 'Please input your email!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Gender"
          name="genre"
          rules={[
            {
              required: true,
              message: 'Please select your gender!',
            },
          ]}
        >
          <Select>
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: 'Please input your password!',
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="password_confirmation"
          rules={[
            {
              required: true,
              message: 'Please confirm your password!',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject('The two passwords do not match!');
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          wrapperCol={{
            offset: 8,
            span: 16,
          }}
        >
          <Button type="primary" htmlType="submit">
            Register
          </Button>
          <div style={{ marginTop: 10 }}>
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </Form.Item>
      </Form>
      </Card>
      
    </ConfigProvider>
  );
};



