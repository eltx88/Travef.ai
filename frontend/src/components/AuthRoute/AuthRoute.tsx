import React from 'react';
import { auth } from '../../firebase/firebase.ts';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
export interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FunctionComponent<AuthRouteProps> = (props) => {
  const { children } = props;
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    AuthCheck();
  }, [auth]);

  const AuthCheck = () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(false);
      } else {
        navigate('/');
      }
    });
  }
  
  return children;
}

export default AuthRoute;