// This file handles OAuth token processing when user returns from OAuth provider
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Get token from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        console.error('No token found in OAuth callback');
        navigate('/login');
        return;
      }

      try {
        // Store the token first
        localStorage.setItem('token', token);
        
        // Get user info with the token
        const response = await api.get('/auth/me');
        const user = response.data;
        
        // Check if profile completion is needed
        if (!user.profileCompleted) {
          navigate('/complete-profile');
        } else {
          // User profile is complete, log them in
          login(user);
          navigate('/');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [navigate, login]);

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-primary-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Processing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
