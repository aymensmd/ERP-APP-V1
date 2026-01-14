import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Menu, 
  List, 
  Input, 
  Button, 
  Avatar, 
  Typography, 
  Badge, 
  Drawer,
  Dropdown,
  Space,
  Tooltip,
  Popover
} from 'antd';
import { 
  DeleteOutlined ,
  BlockOutlined ,
  PictureOutlined ,
  FileOutlined ,
  EnvironmentOutlined ,
  UserOutlined, 
  MessageOutlined, 
  SendOutlined, 
  MoreOutlined,
  SearchOutlined,
  MenuOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
  SmileOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  EllipsisOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './messageComponent.css';

dayjs.extend(relativeTime);

const { Header, Content, Footer, Sider } = Layout;
const { Text, Title } = Typography;

// Sample data
const users = [
  { id: '1', name: 'John Doe', avatar: 'JD', status: 'online', lastSeen: null, unread: 0 },
  { id: '2', name: 'Jane Smith', avatar: 'JS', status: 'offline', lastSeen: dayjs().subtract(30, 'minutes').toISOString(), unread: 3 },
  { id: '3', name: 'Mike Johnson', avatar: 'MJ', status: 'online', lastSeen: null, unread: 0 },
  { id: '4', name: 'Sarah Williams', avatar: 'SW', status: 'away', lastSeen: dayjs().subtract(2, 'hours').toISOString(), unread: 1 },
];

const initialMessages = {
  '1': [
    { id: '1', text: 'Hello there!', sender: '1', timestamp: dayjs().subtract(15, 'minutes').toISOString(), status: 'read' },
    { id: '2', text: 'Hi! How are you?', sender: '2', timestamp: dayjs().subtract(14, 'minutes').toISOString(), status: 'read' },
    { id: '3', text: 'I\'m doing great, thanks for asking!', sender: '1', timestamp: dayjs().subtract(10, 'minutes').toISOString(), status: 'read' },
  ],
  '2': [
    { id: '1', text: 'Meeting at 3pm tomorrow', sender: '2', timestamp: dayjs().subtract(1, 'day').toISOString(), status: 'read' },
    { id: '2', text: 'Got it, I\'ll be there', sender: '1', timestamp: dayjs().subtract(1, 'day').toISOString(), status: 'read' },
  ],
  '3': [
    { id: '1', text: 'Did you see the latest update?', sender: '3', timestamp: dayjs().subtract(3, 'hours').toISOString(), status: 'read' },
  ],
  '4': [
    { id: '1', text: 'Please review the documents', sender: '4', timestamp: dayjs().subtract(5, 'hours').toISOString(), status: 'read' },
  ]
};

const MessageComponent = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  const msgIdRef = useRef(0);
  const generateId = () => {
    msgIdRef.current += 1;
    return String(msgIdRef.current);
  };

  const handleSend = () => {
    if (newMessage.trim() !== "") {
      const newMsg = {
        id: generateId(),
        text: newMessage,
        sender: '1', // current user
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg]
      }));
      
      setNewMessage("");
      
      // Simulate message delivery
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [selectedUser.id]: prev[selectedUser.id].map(msg => 
            msg.id === newMsg.id ? {...msg, status: 'delivered'} : msg
          )
        }));
      }, 1000);

      // Simulate reply after fixed delay
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyMsg = {
          id: generateId(),
          text: getRandomReply(),
          sender: selectedUser.id,
          timestamp: new Date().toISOString(),
          status: 'delivered'
        };
        
        setMessages(prev => ({
          ...prev,
          [selectedUser.id]: [...(prev[selectedUser.id] || []), replyMsg]
        }));
      }, 1500);
    }
  };

  const getRandomReply = () => {
    const replies = [
      "Sounds good!",
      "I'll get back to you on that.",
      "Thanks for letting me know.",
      "Can we discuss this later?",
      "I appreciate your message!",
      "Let me think about it.",
      "That's interesting.",
      "Got it, thanks!"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = messages[selectedUser.id] || [];

  // Removed unused getStatusIndicator

  const getMessageStatusIcon = (msg) => {
    switch (msg.status) {
      case 'read': return <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 4 }} />;
      case 'delivered': return <CheckCircleOutlined style={{ color: '#888', marginLeft: 4 }} />;
      case 'sent': return <ClockCircleOutlined style={{ color: '#888', marginLeft: 4 }} />;
      default: return null;
    }
  };

  const userMenu = [
    { key: "profile", icon: <UserOutlined />, label: "View Profile" },
    { key: "mute", icon: <CloseOutlined />, label: "Mute Notifications" },
    { key: "clear", icon: <DeleteOutlined />, label: "Clear Chat" },
    { type: "divider" },
    { key: "block", danger: true, icon: <BlockOutlined />, label: "Block User" }
  ];

  const attachmentMenu = (
    <Menu>
      <Menu.Item key="photo" icon={<PictureOutlined />}>Photo</Menu.Item>
      <Menu.Item key="document" icon={<FileOutlined />}>Document</Menu.Item>
      <Menu.Item key="location" icon={<EnvironmentOutlined />}>Location</Menu.Item>
    </Menu>
  );

  return (
    <Layout className="chat-app-layout" style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Desktop Sidebar */}
      <Sider 
        width={320}
        className="chat-sidebar"
        breakpoint="lg"
        collapsedWidth="0"
        style={{ 
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="sidebar-header" style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0 }}>Messages</Title>
        </div>
        
        <div className="search-container" style={{ padding: '12px 16px' }}>
          <Input 
            placeholder="Search contacts..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: 20 }}
          />
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[selectedUser.id]}
          className="contacts-menu"
          style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}
        >
          {filteredUsers.map(user => (
            <Menu.Item 
              key={user.id} 
              onClick={() => setSelectedUser(user)}
              className="contact-item"
              style={{ padding: '12px 16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Badge dot={user.status === 'online'} offset={[-5, 30]}>
                  <Avatar 
                    size={40} 
                    style={{ 
                      backgroundColor: '#1890ff',
                      marginRight: 12,
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    {user.avatar}
                  </Avatar>
                </Badge>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong ellipsis style={{ maxWidth: '70%' }}>{user.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(user.lastSeen).fromNow()}
                    </Text>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text 
                      type="secondary" 
                      ellipsis 
                      style={{ 
                        maxWidth: '80%',
                        fontSize: 13,
                        color: user.unread > 0 ? '#000' : undefined
                      }}
                    >
                      {messages[user.id]?.[0]?.text || 'No messages yet'}
                    </Text>
                    
                    {user.unread > 0 && (
                      <Badge 
                        count={user.unread} 
                        style={{ 
                          backgroundColor: '#1890ff',
                          marginLeft: 8
                        }} 
                      />
                    )}
                  </div>
                </div>
              </div>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title="Contacts"
        placement="left"
        closable={true}
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={300}
        styles={{ 
          body: { padding: 0 },
          header: { borderBottom: '1px solid #f0f0f0' }
        }}
      >
        <div style={{ padding: '16px' }}>
          <Input 
            placeholder="Search contacts..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: 20 }}
          />
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[selectedUser.id]}
          style={{ height: '100%', overflowY: 'auto' }}
        >
          {filteredUsers.map(user => (
            <Menu.Item 
              key={user.id} 
              onClick={() => {
                setSelectedUser(user);
                setMobileMenuVisible(false);
              }}
              style={{ padding: '12px 16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Badge dot={user.status === 'online'} offset={[-5, 30]}>
                  <Avatar 
                    size={40} 
                    style={{ 
                      backgroundColor: '#1890ff',
                      marginRight: 12,
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    {user.avatar}
                  </Avatar>
                </Badge>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong ellipsis>{user.name}</Text>
                  <Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                    {messages[user.id]?.[0]?.text || 'No messages yet'}
                  </Text>
                </div>
                
                {user.unread > 0 && (
                  <Badge 
                    count={user.unread} 
                    style={{ 
                      backgroundColor: '#1890ff',
                      marginLeft: 8
                    }} 
                  />
                )}
              </div>
            </Menu.Item>
          ))}
        </Menu>
      </Drawer>

      {/* Main Chat Area */}
      <Layout className="chat-main" style={{ background: '#fff' }}>
        {/* Chat Header */}
        <Header 
          className="chat-header"
          style={{ 
            background: '#fff',
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 9
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              type="text" 
              icon={<MenuOutlined />} 
              onClick={() => setMobileMenuVisible(true)}
              className="mobile-menu-button"
              style={{ marginRight: 16 }}
            />
            
            <Avatar 
              size={40} 
              style={{ 
                backgroundColor: '#1890ff',
                marginRight: 12,
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {selectedUser.avatar}
            </Avatar>
            
            <div>
              <Text strong style={{ fontSize: 16 }}>{selectedUser.name}</Text>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.2 }}>
                {isTyping ? (
                  <span style={{ color: '#1890ff' }}>typing...</span>
                ) : (
                  selectedUser.status === 'online' ? 'Online' : 
                  selectedUser.lastSeen ? `Last seen ${dayjs(selectedUser.lastSeen).fromNow()}` : 'Away'
                )}
              </div>
            </div>
          </div>
          
          <Space size="middle">
            <Tooltip title="Voice Call">
              <Button type="text" icon={<PhoneOutlined />} shape="circle" />
            </Tooltip>
            <Tooltip title="Video Call">
              <Button type="text" icon={<VideoCameraOutlined />} shape="circle" />
            </Tooltip>
            <Tooltip title="Conversation Info">
              <Button type="text" icon={<InfoCircleOutlined />} shape="circle" />
            </Tooltip>
            <Dropdown menu={{ items: userMenu }} trigger={['click']}>
              <Button type="text" icon={<EllipsisOutlined />} shape="circle" />
            </Dropdown>
          </Space>
        </Header>

        {/* Messages Area */}
        <Content
          className="messages-container"
          style={{
            padding: '16px',
            background: '#f5f7fa',
            overflowY: 'auto',
            height: 'calc(100vh - 128px)',
            backgroundImage: 'linear-gradient(rgba(245,247,250,0.9), rgba(245,247,250,0.9))',
            position: 'relative'
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
              <List
                dataSource={currentMessages}
                renderItem={(item, idx) => {
                  const isMine = item.sender === '1';
                  const prev = currentMessages[idx - 1];
                  const showDate = !prev || !dayjs(item.timestamp).isSame(prev.timestamp, 'day');

                  return (
                    <div style={{ width: '100%' }}>
                      {showDate && (
                        <div style={{ textAlign: 'center', margin: '12px 0' }}>
                          <span style={{ background: '#f0f2f5', padding: '6px 12px', borderRadius: 16, fontSize: 12, color: '#666' }}>
                            {dayjs(item.timestamp).format('MMMM D, YYYY')}
                          </span>
                        </div>
                      )}

                      <List.Item
                        style={{
                          padding: '8px 0',
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end'
                        }}
                      >
                        {!isMine && (
                          <div style={{ marginRight: 12 }}>
                            <Avatar size={36} style={{ backgroundColor: '#1890ff', fontWeight: 600 }}>{selectedUser.avatar}</Avatar>
                          </div>
                        )}

                        <div className={`message-bubble ${isMine ? 'message-bubble-sent' : 'message-bubble-received'}`}>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{item.text}</div>
                          <div className="message-time" style={{ marginTop: 6 }}>
                            <span>{dayjs(item.timestamp).format('h:mm A')}</span>
                            {isMine && (
                              <span style={{ marginLeft: 6 }}>{getMessageStatusIcon(item)}</span>
                            )}
                          </div>
                        </div>

                        {isMine && (
                          <div style={{ marginLeft: 12, width: 36 }} />
                        )}
                      </List.Item>
                    </div>
                  );
                }}
              />

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '6px 0' }}>
                  <div style={{ marginRight: 12 }}>
                    <Avatar size={36} style={{ backgroundColor: '#1890ff', fontWeight: 600 }}>{selectedUser.avatar}</Avatar>
                  </div>
                  <div className="typing-indicator" style={{ background: '#fff', padding: '8px 12px', borderRadius: 18, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        </Content>

        {/* Message Input Area */}
        <Footer 
          className="message-input-area"
          style={{ 
            padding: '12px 16px', 
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            position: 'sticky',
            bottom: 0,
            zIndex: 9
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end',
            gap: 8,
            maxWidth: 800,
            margin: '0 auto',
            width: '100%'
          }}>
            <Popover 
              content={attachmentMenu} 
              placement="topLeft" 
              trigger="click"
              overlayClassName="attachment-popover"
            >
              <Button 
                type="text" 
                icon={<PaperClipOutlined style={{ fontSize: 18 }} />} 
                style={{ marginRight: 4 }}
              />
            </Popover>
            
            <Button 
              type="text" 
              icon={<SmileOutlined style={{ fontSize: 18 }} />} 
              style={{ marginRight: 4 }}
            />
            
            <Input.TextArea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Simulate typing indicator
                if (e.target.value && !isTyping) {
                  setIsTyping(true);
                } else if (!e.target.value && isTyping) {
                  setIsTyping(false);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ 
                flex: 1,
                borderRadius: 20,
                padding: '8px 16px',
                resize: 'none'
              }}
            />
            
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSend}
              disabled={!newMessage.trim()}
              shape="circle"
              size="large"
              style={{ 
                backgroundColor: '#1890ff',
                border: 'none',
                marginLeft: 8
              }}
            />
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default MessageComponent;
