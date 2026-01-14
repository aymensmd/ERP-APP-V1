import React, { useState, useEffect } from 'react';
import { Tabs, Card, Table, Button, Upload, Modal, Form, Input, Select, DatePicker, Tag, message, Space, Popconfirm, Alert, Checkbox, Typography, Spin } from 'antd';
import {
  FileTextOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileOutlined
} from '@ant-design/icons';
import axios from '../axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const EmployeeProfileTabs = ({ userId, isOwnProfile = false }) => {
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/employees/${userId}/profile`);
      setDocuments(response.data.documents || []);
      setSkills(response.data.skills || []);
      setCertifications(response.data.certifications || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      message.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (values) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('type', values.type);
      formData.append('file', values.file.file);
      if (values.expiry_date) {
        formData.append('expiry_date', values.expiry_date.format('YYYY-MM-DD'));
      }
      if (values.description) {
        formData.append('description', values.description);
      }
      formData.append('is_confidential', values.is_confidential || false);

      await axios.post(`/employees/${userId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      message.success('Document uploaded successfully');
      setDocModalVisible(false);
      form.resetFields();
      fetchProfileData();
    } catch {
      message.error('Failed to upload document');
    }
  };

  const handleSkillSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        acquired_date: values.acquired_date ? values.acquired_date.format('YYYY-MM-DD') : null,
      };

      if (editingItem) {
        await axios.put(`/skills/${editingItem.id}`, payload);
        message.success('Skill updated successfully');
      } else {
        await axios.post(`/employees/${userId}/skills`, payload);
        message.success('Skill added successfully');
      }

      setSkillModalVisible(false);
      setEditingItem(null);
      form.resetFields();
      fetchProfileData();
    } catch {
      message.error('Failed to save skill');
    }
  };

  const handleCertificationSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('issuing_organization', values.issuing_organization);
      if (values.certificate_number) formData.append('certificate_number', values.certificate_number);
      formData.append('issue_date', values.issue_date.format('YYYY-MM-DD'));
      if (values.expiry_date) formData.append('expiry_date', values.expiry_date.format('YYYY-MM-DD'));
      if (values.credential_url) formData.append('credential_url', values.credential_url);
      if (values.file) formData.append('file', values.file.file);
      if (values.description) formData.append('description', values.description);
      formData.append('does_not_expire', values.does_not_expire || false);

      if (editingItem) {
        await axios.put(`/certifications/${editingItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Certification updated successfully');
      } else {
        await axios.post(`/employees/${userId}/certifications`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Certification added successfully');
      }

      setCertModalVisible(false);
      setEditingItem(null);
      form.resetFields();
      fetchProfileData();
    } catch {
      message.error('Failed to save certification');
    }
  };

  const handleDelete = async (type, id) => {
    try {
      const endpoint = type === 'document' ? `/documents/${id}` :
                      type === 'skill' ? `/skills/${id}` :
                      `/certifications/${id}`;
      
      await axios.delete(endpoint);
      message.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      fetchProfileData();
    } catch {
      message.error(`Failed to delete ${type}`);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const daysUntilExpiry = dayjs(expiryDate).diff(dayjs(), 'day');
    if (daysUntilExpiry < 0) return { color: 'error', text: 'Expired' };
    if (daysUntilExpiry <= 30) return { color: 'warning', text: `Expires in ${daysUntilExpiry} days` };
    return { color: 'success', text: 'Valid' };
  };

  const getFileUrl = (filePath) => {
    // Construct the full URL to the file
    // Laravel storage files are accessible via /storage/ path
    if (!filePath) return null;
    const baseURL = 'http://localhost:8000';
    // Remove 'public/' prefix if present, as Laravel serves from storage/app/public
    const cleanPath = filePath.startsWith('public/') ? filePath.replace('public/', '') : filePath;
    return `${baseURL}/storage/${cleanPath}`;
  };

  const getFileType = (mimeType, fileName) => {
    if (!mimeType && !fileName) return 'unknown';
    const mime = mimeType || '';
    const name = fileName || '';
    
    if (mime.includes('pdf') || name.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (mime.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(name)) return 'image';
    if (mime.includes('text') || /\.(txt|md|json|xml|html|css|js)$/i.test(name)) return 'text';
    return 'other';
  };

  const handlePreview = (document) => {
    setPreviewDocument(document);
    setPreviewModalVisible(true);
    setPreviewLoading(true);
  };

  const getFileIcon = (mimeType, fileName) => {
    const fileType = getFileType(mimeType, fileName);
    switch (fileType) {
      case 'pdf':
        return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
      case 'image':
        return <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
      default:
        return <FileOutlined style={{ fontSize: 24 }} />;
    }
  };

  const documentColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (date) => {
        if (!date) return '-';
        const status = getExpiryStatus(date);
        return (
          <Space>
            <span>{dayjs(date).format('YYYY-MM-DD')}</span>
            {status && <Tag color={status.color}>{status.text}</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size) => size ? `${(size / 1024).toFixed(2)} KB` : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            Preview
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => {
              const url = getFileUrl(record.file_path);
              if (url) {
                window.open(url, '_blank');
              }
            }}
          >
            Download
          </Button>
          {isOwnProfile && (
            <Popconfirm
              title="Delete this document?"
              onConfirm={() => handleDelete('document', record.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const skillColumns = [
    {
      title: 'Skill',
      dataIndex: 'skill_name',
      key: 'skill_name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => cat ? <Tag>{cat}</Tag> : '-'
    },
    {
      title: 'Proficiency',
      dataIndex: 'proficiency',
      key: 'proficiency',
      render: (prof) => {
        const colors = {
          beginner: 'default',
          intermediate: 'processing',
          advanced: 'success',
          expert: 'error'
        };
        return <Tag color={colors[prof]}>{prof.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Experience',
      dataIndex: 'years_of_experience',
      key: 'years_of_experience',
      render: (years) => years ? `${years} years` : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => isOwnProfile && (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingItem(record);
              form.setFieldsValue({
                ...record,
                acquired_date: record.acquired_date ? dayjs(record.acquired_date) : null,
              });
              setSkillModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this skill?"
            onConfirm={() => handleDelete('skill', record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const certificationColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Issuing Organization',
      dataIndex: 'issuing_organization',
      key: 'issuing_organization',
    },
    {
      title: 'Issue Date',
      dataIndex: 'issue_date',
      key: 'issue_date',
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (date, record) => {
        if (record.does_not_expire) return <Tag color="success">Does not expire</Tag>;
        if (!date) return '-';
        const status = getExpiryStatus(date);
        return (
          <Space>
            <span>{dayjs(date).format('YYYY-MM-DD')}</span>
            {status && <Tag color={status.color}>{status.text}</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.credential_url && (
            <Button
              type="link"
              onClick={() => window.open(record.credential_url, '_blank')}
            >
              View Credential
            </Button>
          )}
          {isOwnProfile && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingItem(record);
                  form.setFieldsValue({
                    ...record,
                    issue_date: dayjs(record.issue_date),
                    expiry_date: record.expiry_date ? dayjs(record.expiry_date) : null,
                  });
                  setCertModalVisible(true);
                }}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete this certification?"
                onConfirm={() => handleDelete('certification', record.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'documents',
      label: (
        <span>
          <FileTextOutlined />
          Documents ({documents.length})
        </span>
      ),
      children: (
          <Card
            title="Documents"
            extra={isOwnProfile && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null);
                  form.resetFields();
                  setDocModalVisible(true);
                }}
              >
                Upload Document
              </Button>
            )}
          >
            {documents.filter(d => d.is_expiring_soon || d.is_expired).length > 0 && (
              <Alert
                message="Some documents are expiring soon or have expired"
                type="warning"
                style={{ marginBottom: 16 }}
              />
            )}
            <Table
              dataSource={documents}
              columns={documentColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
      ),
    },
    {
      key: 'skills',
      label: (
        <span>
          <TrophyOutlined />
          Skills ({skills.length})
        </span>
      ),
      children: (
          <Card
            title="Skills"
            extra={isOwnProfile && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null);
                  form.resetFields();
                  setSkillModalVisible(true);
                }}
              >
                Add Skill
              </Button>
            )}
          >
            <Table
              dataSource={skills}
              columns={skillColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
      ),
    },
    {
      key: 'certifications',
      label: (
        <span>
          <SafetyCertificateOutlined />
          Certifications ({certifications.length})
        </span>
      ),
      children: (
          <Card
            title="Certifications"
            extra={isOwnProfile && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null);
                  form.resetFields();
                  setCertModalVisible(true);
                }}
              >
                Add Certification
              </Button>
            )}
          >
            {certifications.filter(c => {
              if (c.does_not_expire || !c.expiry_date) return false;
              const daysUntilExpiry = dayjs(c.expiry_date).diff(dayjs(), 'day');
              return daysUntilExpiry <= 30;
            }).length > 0 && (
              <Alert
                message="Some certifications are expiring soon or have expired"
                type="warning"
                style={{ marginBottom: 16 }}
              />
            )}
            <Table
              dataSource={certifications}
              columns={certificationColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
      ),
    },
  ];

  return (
    <>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Document Upload Modal */}
      <Modal
        title="Upload Document"
        open={docModalVisible}
        onCancel={() => {
          setDocModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleDocumentUpload} layout="vertical">
          <Form.Item name="name" label="Document Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Option value="contract">Contract</Option>
              <Option value="certificate">Certificate</Option>
              <Option value="id_card">ID Card</Option>
              <Option value="resume">Resume</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="file" label="File" rules={[{ required: true }]}>
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button>Select File</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="expiry_date" label="Expiry Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="is_confidential" valuePropName="checked">
            <Checkbox>Confidential</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Upload</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        title={
          <Space>
            {previewDocument && getFileIcon(previewDocument.mime_type, previewDocument.file_name)}
            <Text strong>{previewDocument?.name || 'Document Preview'}</Text>
          </Space>
        }
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewDocument(null);
          setPreviewLoading(false);
        }}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => {
            const url = getFileUrl(previewDocument?.file_path);
            if (url) window.open(url, '_blank');
          }}>
            Download
          </Button>,
          <Button key="close" onClick={() => {
            setPreviewModalVisible(false);
            setPreviewDocument(null);
            setPreviewLoading(false);
          }}>
            Close
          </Button>,
        ]}
        width={900}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, minHeight: '600px', maxHeight: '80vh', overflow: 'auto' }}
      >
        {previewDocument && (
          <div style={{ width: '100%', height: '100%' }}>
            <Spin spinning={previewLoading} tip="Loading document...">
              <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>File Information</Text>
                  <Space split="|">
                    <Text type="secondary">Type: {previewDocument.type}</Text>
                    <Text type="secondary">Size: {previewDocument.file_size ? `${(previewDocument.file_size / 1024).toFixed(2)} KB` : 'N/A'}</Text>
                    {previewDocument.mime_type && (
                      <Text type="secondary">MIME: {previewDocument.mime_type}</Text>
                    )}
                  </Space>
                  {previewDocument.description && (
                    <Text type="secondary">{previewDocument.description}</Text>
                  )}
                </Space>
              </div>
              <div style={{ 
                width: '100%', 
                height: '600px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                overflow: 'auto'
              }}>
                {(() => {
                  const fileUrl = getFileUrl(previewDocument.file_path);
                  const fileType = getFileType(previewDocument.mime_type, previewDocument.file_name);
                  
                  if (!fileUrl) {
                    return <Text type="secondary">File URL not available</Text>;
                  }

                  switch (fileType) {
                    case 'pdf':
                      return (
                        <iframe
                          src={fileUrl}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                          }}
                          onLoad={() => setPreviewLoading(false)}
                          title={previewDocument.name}
                        />
                      );
                    case 'image':
                      return (
                        <img
                          src={fileUrl}
                          alt={previewDocument.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                          onLoad={() => setPreviewLoading(false)}
                          onError={() => {
                            setPreviewLoading(false);
                            message.error('Failed to load image');
                          }}
                        />
                      );
                    case 'text':
                      return (
                        <iframe
                          src={fileUrl}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                          }}
                          onLoad={() => setPreviewLoading(false)}
                          title={previewDocument.name}
                        />
                      );
                    default:
                      return (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                          <FileOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                          <div>
                            <Text strong>Preview not available for this file type</Text>
                            <br />
                            <Text type="secondary">Please download the file to view it</Text>
                            <br />
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={() => window.open(fileUrl, '_blank')}
                              style={{ marginTop: 16 }}
                            >
                              Download File
                            </Button>
                          </div>
                        </div>
                      );
                  }
                })()}
              </div>
            </Spin>
          </div>
        )}
      </Modal>

      {/* Skill Modal */}
      <Modal
        title={editingItem ? "Edit Skill" : "Add Skill"}
        open={skillModalVisible}
        onCancel={() => {
          setSkillModalVisible(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSkillSubmit} layout="vertical">
          <Form.Item name="skill_name" label="Skill Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select>
              <Option value="technical">Technical</Option>
              <Option value="soft">Soft Skills</Option>
              <Option value="language">Language</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="proficiency" label="Proficiency" rules={[{ required: true }]}>
            <Select>
              <Option value="beginner">Beginner</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
              <Option value="expert">Expert</Option>
            </Select>
          </Form.Item>
          <Form.Item name="years_of_experience" label="Years of Experience">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="acquired_date" label="Acquired Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Certification Modal */}
      <Modal
        title={editingItem ? "Edit Certification" : "Add Certification"}
        open={certModalVisible}
        onCancel={() => {
          setCertModalVisible(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCertificationSubmit} layout="vertical">
          <Form.Item name="name" label="Certification Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="issuing_organization" label="Issuing Organization" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="certificate_number" label="Certificate Number">
            <Input />
          </Form.Item>
          <Form.Item name="issue_date" label="Issue Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiry_date" label="Expiry Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="does_not_expire" valuePropName="checked">
            <Checkbox>Does not expire</Checkbox>
          </Form.Item>
          <Form.Item name="credential_url" label="Credential URL">
            <Input type="url" />
          </Form.Item>
          <Form.Item name="file" label="Certificate File">
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button>Select File</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EmployeeProfileTabs;

