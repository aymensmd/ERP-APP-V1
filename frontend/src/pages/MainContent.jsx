import React, { useState, useEffect } from 'react';
import { Card, notification, Modal, Avatar, Divider, Spin, ConfigProvider, Typography } from 'antd';
import Banner from './Banner';
import axios from '../axios';
import { useStateContext } from '../contexts/ContextProvider';

const { Text } = Typography;
const EVENTS_PER_PAGE = 4;

const MainContent = () => {
  const { theme } = useStateContext();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [endedEventIds, setEndedEventIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Theme configuration
  const themeStyles = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#222',
      textSecondary: '#555',
      border: '#f0f0f0',
      primary: '#277dfe',
      ongoingBg: '#f6ffed',
      ongoingBorder: '#b7eb8f',
      endedBg: '#fff1f0',
      endedBorder: '#ffa39e',
      modalBg: '#ffffff',
      paginationActiveBg: '#277dfe',
      paginationText: '#277dfe',
      cardShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      cardHoverShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    },
    dark: {
      cardBg: '#1a1a1a',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.65)',
      border: '#303030',
      primary: '#177ddc',
      ongoingBg: '#162312',
      ongoingBorder: '#274916',
      endedBg: '#2a1215',
      endedBorder: '#58181c',
      modalBg: '#1a1a1a',
      paginationActiveBg: '#177ddc',
      paginationText: '#177ddc',
      cardShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      cardHoverShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    }
  };

  const colors = themeStyles[theme];
  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const paginatedEvents = events.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!loading && events.length > 0) {
      const now = new Date();
      const newlyEnded = events.filter(event => {
        return (
          event.end_date &&
          new Date(event.end_date) < now &&
          !endedEventIds.includes(event.id)
        );
      });
      if (newlyEnded.length > 0) {
        newlyEnded.forEach(event => {
          notification.info({
            title: `Event Ended`,
            description: `The event "${event.title}" has ended.`,
            duration: 5,
          });
        });
        setEndedEventIds(prev => [...prev, ...newlyEnded.map(e => e.id)]);
      }
    }
  }, [events, loading, endedEventIds]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/events');
      // Handle Laravel API response format
      const events = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setEvents(events);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      notification.error({
        title: 'Error',
        description: 'Failed to fetch events!',
      });
      setLoading(false);
    }
  };

  const openModal = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setModalVisible(false);
  };

  const getEventStatus = (event) => {
    const hasEnded = event.end_date && new Date(event.end_date) < new Date();
    return {
      text: hasEnded ? 'Ended' : 'Ongoing',
      bg: hasEnded ? colors.endedBg : colors.ongoingBg,
      border: hasEnded ? colors.endedBorder : colors.ongoingBorder,
      color: hasEnded ? '#cf1322' : '#389e0d'
    };
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: colors.cardBg,
          colorBorder: colors.border,
          colorText: colors.textPrimary,
          colorTextHeading: colors.textPrimary,
          colorPrimary: colors.primary,
        },
      }}
    >
      <div style={{ flex: 1, padding: '0 16px' }}>
        <Banner />
        <Divider style={{ margin: '16px 0', borderColor: colors.border }} />
        
        <Card 
          variant="outlined"
          style={{ 
            borderRadius: '8px', 
            boxShadow: colors.cardShadow,
            background: colors.cardBg, 
            borderColor: colors.border,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          styles={{ 
            body: { 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 0
            }
          }}
        >
          <div style={{ 
            padding: '16px 24px',
            borderBottom: `1px solid ${colors.border}`
          }}>
            <Text strong style={{ 
              color: colors.primary, 
              fontSize: 16 
            }}>
              Recent Notifications
            </Text>
          </div>
          
          <div style={{ 
            padding: '16px 24px', 
            flex: 1,
            overflow: 'auto',
            minHeight: '400px'
          }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <Spin size="large" />
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
                alignItems: 'stretch'
              }}>
                {paginatedEvents.map(event => {
                  const status = getEventStatus(event);
                  return (
                    <Card
                      key={event.id}
                      hoverable
                      onClick={() => openModal(event)}
                      style={{ 
                        transition: 'all 0.3s',
                        borderColor: colors.border,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        ':hover': {
                          boxShadow: colors.cardHoverShadow,
                          transform: 'translateY(-2px)'
                        }
                      }}
                      styles={{ 
                        header: { 
                          background: theme === 'dark' ? '#141414' : '#f0f5ff', 
                          borderRadius: '7px 7px 0 0', 
                          padding: '12px 16px',
                          borderBottomColor: colors.border
                        }, 
                        body: { 
                          padding: '16px', 
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column'
                        } 
                      }}
                      title={
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          overflow: 'hidden'
                        }}>
                          <Text strong ellipsis style={{ 
                            maxWidth: '180px', 
                            color: colors.textPrimary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {event.title}
                          </Text>
                          <div style={{
                            fontSize: 12,
                            color: status.color,
                            fontWeight: 500,
                            background: status.bg,
                            border: `1px solid ${status.border}`,
                            borderRadius: 4,
                            padding: '2px 8px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}>
                            {status.text}
                          </div>
                        </div>
                      }
                    >
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        flex: 1,
                        gap: '12px'
                      }}>
                        <div style={{ 
                          fontSize: 13, 
                          color: colors.textSecondary
                        }}>
                          <Text type="secondary">Date: </Text>
                          {event.start_date}
                        </div>
                        
                        <div style={{ 
                          fontSize: 13, 
                          color: colors.textSecondary,
                          flex: 1 
                        }}>
                          <Text type="secondary">Description: </Text>
                          <Text style={{ display: 'inline' }}>
                            {event.description && event.description.length > 80
                              ? event.description.slice(0, 80) + '...'
                              : event.description}
                          </Text>
                        </div>
                        
                        <div>
                          <Text type="secondary" style={{ 
                            fontSize: 13, 
                            display: 'block',
                            marginBottom: 8 
                          }}>
                            Users Assigned:
                          </Text>
                          <div style={{ 
                            display: 'flex', 
                            gap: 8, 
                            flexWrap: 'wrap' 
                          }}>
                            {(event.users || event.participants || []).length > 0 ? (
                              (event.users || event.participants || []).map(user => (
                                <div 
                                  key={user.id} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <Avatar 
                                    size={24} 
                                    src={user.avatar} 
                                    style={{ 
                                      marginRight: 4, 
                                      background: theme === 'dark' ? '#1a1a1a' : '#e6f0ff', 
                                      color: colors.primary 
                                    }}
                                  >
                                    {user.name ? user.name.charAt(0) : '?'}
                                  </Avatar>
                                  <Text style={{ 
                                    fontSize: 12, 
                                    color: colors.textSecondary,
                                    maxWidth: '80px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {user.name}
                                  </Text>
                                </div>
                              ))
                            ) : (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                No users assigned
                              </Text>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div style={{ 
              padding: '16px 24px',
              borderTop: `1px solid ${colors.border}`,
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center'
            }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                style={{ 
                  padding: '4px 12px',
                  marginRight: 8,
                  color: colors.textPrimary,
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  ':hover': {
                    borderColor: colors.primary
                  },
                  ':disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed'
                  }
                }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{
                    padding: '4px 12px',
                    margin: '0 4px',
                    fontWeight: currentPage === i + 1 ? 'bold' : 'normal',
                    background: currentPage === i + 1 ? colors.paginationActiveBg : 'transparent',
                    color: currentPage === i + 1 ? '#fff' : colors.textPrimary,
                    border: `1px solid ${currentPage === i + 1 ? colors.paginationActiveBg : colors.border}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    minWidth: '32px',
                    ':hover': {
                      borderColor: colors.primary
                    }
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                style={{ 
                  padding: '4px 12px',
                  marginLeft: 8,
                  color: colors.textPrimary,
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  ':hover': {
                    borderColor: colors.primary
                  },
                  ':disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed'
                  }
                }}
              >
                Next
              </button>
            </div>
          )}
        </Card>

        <Modal
          title={
            <Text strong style={{ color: colors.textPrimary }}>
              {selectedEvent ? selectedEvent.title : ''}
            </Text>
          }
          open={modalVisible}
          onCancel={closeModal}
          footer={null}
          styles={{ 
            body: { 
              background: colors.modalBg, 
              padding: 24 
            },
            header: {
              background: colors.modalBg,
              borderBottom: `1px solid ${colors.border}`,
              padding: '16px 24px'
            },
            content: {
              borderRadius: 8
            }
          }}
          width={600}
        >
          {selectedEvent && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: colors.primary }}>Date: </Text>
                <Text style={{ color: colors.textPrimary }}>
                  {selectedEvent.start_date}
                  {selectedEvent.end_date && ` to ${selectedEvent.end_date}`}
                </Text>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: colors.primary }}>Description: </Text>
                <Text style={{ color: colors.textPrimary }}>
                  {selectedEvent.description}
                </Text>
              </div>
              
              <Divider style={{ 
                margin: '16px 0', 
                borderColor: colors.border 
              }} />
              
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ color: colors.primary }}>Users Assigned: </Text>
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 12,
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: 8
              }}>
                {(selectedEvent.users || selectedEvent.participants || []).length > 0 ? (
                  (selectedEvent.users || selectedEvent.participants || []).map(user => (
                    <div 
                      key={user.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: theme === 'dark' ? '#141414' : '#f0f5ff', 
                        borderRadius: 6, 
                        padding: '8px 12px', 
                        width: 'calc(50% - 6px)',
                        boxSizing: 'border-box'
                      }}
                    >
                      <Avatar 
                        size={32} 
                        src={user.avatar} 
                        style={{ 
                          marginRight: 12, 
                          background: theme === 'dark' ? '#1a1a1a' : '#fff', 
                          color: colors.primary, 
                          fontWeight: 600 
                        }}
                      >
                        {user.name ? user.name.charAt(0) : '?'}
                      </Avatar>
                      <div>
                        <Text strong style={{ 
                          display: 'block', 
                          color: colors.textPrimary 
                        }}>
                          {user.name}
                        </Text>
                        {user.role && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {typeof user.role === 'string' ? user.role : (user.role?.name || 'N/A')}
                          </Text>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <Text type="secondary">
                    No users assigned to this event
                  </Text>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default MainContent;