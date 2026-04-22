import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@store';
import { hasRole } from '@utils/helpers';
import UnauthorizedPage from '@pages/error/UnauthorizedPage';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(user, roles)) {
    return <UnauthorizedPage />;
  }

  return children;
};

export default ProtectedRoute;
