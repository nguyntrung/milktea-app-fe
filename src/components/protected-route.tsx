import React from 'react';
import { Navigate, useLocation } from 'react-router';

// Định nghĩa các role và quyền truy cập
const ROLE_PERMISSIONS = {
  admin: [
    '/admin',
    '/admin/categories',
    '/admin/orders',
    '/admin/products',
    '/admin/suppliers',
    '/admin/toppings',
    '/admin/ingredients',
    '/admin/warehouse',
    '/admin/order-ingredients',
    '/admin/design',
    '/admin/marketing',
    '/admin/store-setting',
    '/admin/users'
  ],
  employee: [
    '/admin/orders'
  ],
  shipper: [
    '/admin/orders'
  ],
  'nhan-vien-kho': [
    '/admin/warehouse',
    '/admin/order-ingredients'
  ]
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPath }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role') as keyof typeof ROLE_PERMISSIONS;

  // Sử dụng current path nếu không có requiredPath
  const pathToCheck = requiredPath || location.pathname;

  // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  // Nếu không có role hoặc role không hợp lệ
  if (!userRole || !(userRole in ROLE_PERMISSIONS)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Kiểm tra quyền truy cập
  const allowedPaths = ROLE_PERMISSIONS[userRole];
  
  // Hàm kiểm tra có quyền truy cập không
  const hasPermission = () => {
    return allowedPaths.some(allowedPath => {
      // Exact match
      if (allowedPath === pathToCheck) return true;
      
      // Check if current path starts with allowed path (for sub routes)
      if (pathToCheck.startsWith(allowedPath + '/')) return true;
      
      // Special case: if checking /admin and user has /admin/orders, allow access to /admin
      if (pathToCheck === '/admin' && allowedPath.startsWith('/admin/')) return true;
      
      return false;
    });
  };

  // Debug log
  console.log('🔐 Permission Check:', {
    userRole,
    pathToCheck,
    allowedPaths,
    hasAccess: hasPermission()
  });

  if (!hasPermission()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
