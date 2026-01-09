import React from 'react';
import { Card, Spin, Alert, Empty } from 'antd';
import { useVacationPolling } from '../hooks/useVacationPolling';
import { useAuth } from '../context/AuthContext';
import './Banner.css'; // Import CSS for animations

const Banner = () => {
  const { user } = useAuth();
  const { vacations, error, isLoading } = useVacationPolling(user?.id);

  if (isLoading) {
    return (
      <Card className="fade-in" style={{ textAlign: 'center', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', background: 'linear-gradient(135deg, #f5f7fa, #e6f0ff)' }}>
        <Spin size="large" />
        <p style={{ marginTop: '10px', fontSize: '16px', color: '#555' }}>Loading vacation requests...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="fade-in" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', background: 'linear-gradient(135deg, #ffe6e6, #fff)' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!vacations || vacations.length === 0) {
    return (
      <Card className="fade-in" style={{ textAlign: 'center', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', background: 'linear-gradient(135deg, #f5f7fa, #e6f0ff)' }}>
        <Empty
          description="No vacation requests found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card className="fade-in" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', background: 'linear-gradient(135deg, #f5f7fa, #e6f0ff)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px', color: '#333' }}>Vacation Requests</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {vacations.map((vacation) => (
          <li key={vacation.id} className="fade-in" style={{ marginBottom: '10px', padding: '10px', borderRadius: '8px', background: '#fff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <strong>{vacation.type}</strong> from {vacation.start_date} to {vacation.end_date}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default Banner;