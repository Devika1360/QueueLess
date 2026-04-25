import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Redirects unauthenticated visitors to login */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}
