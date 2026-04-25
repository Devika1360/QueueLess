import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Only allows users with role === 'admin' */
export default function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return <Navigate to="/user" replace />;
  return children;
}
