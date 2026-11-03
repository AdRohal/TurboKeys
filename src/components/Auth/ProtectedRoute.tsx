'use client';

import React, { useEffect } from 'react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
  </div>
);

/** Pages for signed-in people. Signed out goes to login; a Google/GitHub account with no username yet goes to finish its profile. */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const needsProfile = !!user && user.profileCompleted === false;

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login', { replace: true });
    else if (needsProfile) navigate('/complete-profile', { replace: true });
  }, [loading, user, needsProfile, navigate]);

  if (loading || !user || needsProfile) return <Spinner />;
  return <>{children}</>;
};

export default ProtectedRoute;
