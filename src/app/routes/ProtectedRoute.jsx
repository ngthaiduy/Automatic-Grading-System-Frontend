import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext.js';
import { ROLE_HOME_MAP } from '../../constants/routes.js';

const normalizeRole = (role) =>
  typeof role === 'string' ? role.trim().toUpperCase() : '';

const getHomeRouteByRole = (roleName) =>
  ROLE_HOME_MAP[normalizeRole(roleName)] || '/login';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Chờ AuthProvider khôi phục session từ localStorage xong
  if (loading) {
    return null;
  }

  const currentRole = normalizeRole(user?.roleName);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  // Chưa đăng nhập hoặc session không hợp lệ
  if (!user || !currentRole) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Có đăng nhập nhưng không đúng quyền
  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(currentRole)
  ) {
    return (
      <Navigate
        to={getHomeRouteByRole(currentRole)}
        replace
      />
    );
  }

  return children;
}