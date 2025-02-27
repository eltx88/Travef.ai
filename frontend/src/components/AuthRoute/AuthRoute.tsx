// src/components/AuthRoute.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/firebase/firebase';

export interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-100">
        <div className="text-xl font-semibold">Checking authentication...</div>
      </div>
    );
  }

  // If authentication check is complete and user exists, render children
  return <>{user ? children : null}</>;
};

export default AuthRoute;