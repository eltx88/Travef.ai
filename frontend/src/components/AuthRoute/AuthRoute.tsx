// src/components/AuthRoute.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/firebase/firebase';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebase';

export interface AuthRouteProps {
  children: React.ReactNode;
  timeoutMinutes?: number; // Optional timeout in minutes
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children, timeoutMinutes = 30 }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const lastActivityRef = React.useRef<number>(Date.now());
  
  // Update last activity time on user interactions
  const updateActivity = React.useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);
  
  // Check for inactivity timeout
  React.useEffect(() => {
    if (!user) return;
    
    const intervalId = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivityRef.current;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      
      if (inactiveTime > timeoutMs) {
        console.log(`User inactive for ${timeoutMinutes} minutes, signing out`);
        signOut(auth).then(() => {
          navigate('/');
        });
      }
    }, 60000); // Check every minute
    
    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });
    
    return () => {
      clearInterval(intervalId);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [user, timeoutMinutes, navigate, updateActivity]);
  
  // Original authentication check
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