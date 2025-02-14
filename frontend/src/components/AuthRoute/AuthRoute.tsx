import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/firebase/firebase';

export interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FunctionComponent<AuthRouteProps> = (props) => {
  const { children } = props;
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default AuthRoute;