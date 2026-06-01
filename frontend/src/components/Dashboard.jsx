import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // Redirect to login if no user is found in local storage
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!currentUser) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h2>Welcome to your Dashboard, {currentUser.name}!</h2>
      <p><strong>Email:</strong> {currentUser.email}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
};

export default Dashboard;