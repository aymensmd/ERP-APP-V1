import { Button, Card, Drawer, Typography, Flex, message } from 'antd';
import React, { useState, useEffect } from 'react';
import CongeForm from '../Form/CongeForm';
import VacData from '../data/VacData';
import axios from '../axios';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Text } = Typography;

const Banner = ({ userId }) => {
  const { theme } = useStateContext();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [secondDrawerVisible, setSecondDrawerVisible] = useState(false);
  const [vacationDays, setVacationDays] = useState(0);

  // Theme configuration
  const themeColors = {
    light: {
      cardBg: '#ffffff',
      textPrimary: '#000000',
      textSecondary: '#595959',
      primary: '#1890ff',
      secondaryBg: '#f0f5ff',
      border: '#d9d9d9',
      buttonBg: '#fafafa',
    },
    dark: {
      cardBg: '#1f1f1f',
      textPrimary: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      primary: '#177ddc',
      secondaryBg: '#111b26',
      border: '#303030',
      buttonBg: '#1d1d1d',
    }
  };

  const colors = themeColors[theme];

  useEffect(() => {
    fetchVacations();
    const interval = setInterval(fetchVacations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchVacations = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const userData = localStorage.getItem('USER') || localStorage.getItem('USER_DATA');
      
      if (!token) {
        message.error('User is not authenticated');
        return;
      }

      let userId = null;
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user.id || user.data?.id;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      // If no userId found, just fetch vacations (API will default to authenticated user)
      if (!userId) {
        // Try to get user info from API first
        try {
          const userResponse = await axios.get('/user');
          const userResponseData = userResponse.data?.data || userResponse.data;
          userId = userResponseData?.id;
          if (userId && userData) {
            try {
              const user = JSON.parse(userData);
              user.id = userId;
              localStorage.setItem('USER', JSON.stringify(user));
              localStorage.setItem('USER_ID', userId.toString());
            } catch (e) {
              // If parsing fails, just store the new user data
              localStorage.setItem('USER', JSON.stringify(userResponseData));
              localStorage.setItem('USER_ID', userId.toString());
            }
          }
        } catch (e) {
          console.error('Error fetching user:', e);
          // Still try to fetch vacations - API will use authenticated user
        }
      }

      // Fetch vacations - use query parameter for user_id
      const response = userId 
        ? await axios.get(`/vacations?user_id=${userId}`)
        : await axios.get('/vacations');
      
      // Handle Laravel API response format
      const vacations = Array.isArray(response.data) ? response.data : (response.data.data || []);
      calculateTotalVacationDays(vacations);
    } catch (error) {
      console.error('Failed to fetch vacations', error);
    }
  };

  const calculateTotalVacationDays = (vacations) => {
    let totalDays = 0;
    vacations
      .filter(vacation => vacation.status === 'Approuvé')
      .forEach(vacation => {
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        totalDays += days;
      });
    setVacationDays(totalDays);
  };

  const showDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);
  const showSecondDrawer = () => setSecondDrawerVisible(true);
  const closeSecondDrawer = () => setSecondDrawerVisible(false);

  return (
    <>
      <Card 
        style={{ 
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px',
          backgroundColor: colors.cardBg,
          borderColor: colors.border
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <Flex vertical align="flex-start" style={{ flex: 1, minWidth: 250 }}>
            <Title 
              level={2} 
              style={{ 
                color: colors.primary, 
                fontWeight: 'bold',
                marginBottom: 8
              }}
            >
              Demande de congé
            </Title>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: '16px',
                color: colors.textSecondary
              }}
            >
              Faire une demande de congé
            </Text>
            <Flex gap={16} style={{ marginTop: '20px' }}>
              <Button 
                type="primary" 
                size="large" 
                style={{ 
                  borderRadius: '5px',
                  backgroundColor: colors.primary
                }} 
                onClick={showDrawer}
              >
                Demande
              </Button>
              <Button 
                size="large" 
                style={{ 
                  borderRadius: '5px',
                  backgroundColor: colors.buttonBg,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }} 
                onClick={showSecondDrawer}
              >
                Consulter votre demande
              </Button>
            </Flex>
          </Flex>
          
          <Card
            variant="outlined"
            style={{
              width: 130,
              height: 130,
              textAlign: 'center',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderRadius: '10px',
              backgroundColor: colors.secondaryBg,
              borderColor: colors.border
            }}
          >
            <Title level={4} style={{ color: colors.primary, marginBottom: 8 }}>
              {vacationDays} / 25
            </Title>
            <Text style={{ fontSize: '14px', color: colors.textSecondary }}>
              Jours par an
            </Text>
          </Card>
        </Flex>
      </Card>

      <Drawer
        title="Faire une demande de congé"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        size={700}
        styles={{
          body: {
            backgroundColor: colors.cardBg,
            color: colors.textPrimary
          },
          header: {
            backgroundColor: colors.cardBg,
            borderBottomColor: colors.border
          }
        }}
      >
        <CongeForm />
      </Drawer>

      <Drawer
        title="Consulter ou modifier votre demande"
        placement="right"
        onClose={closeSecondDrawer}
        open={secondDrawerVisible}
        size={900}
        styles={{
          body: {
            backgroundColor: colors.cardBg,
            color: colors.textPrimary
          },
          header: {
            backgroundColor: colors.cardBg,
            borderBottomColor: colors.border
          }
        }}
      >
        <VacData setTotalVacationDays={setVacationDays} />
      </Drawer>
    </>
  );
};

export default Banner;