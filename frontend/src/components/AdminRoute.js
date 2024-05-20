import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ isAdmin, children }) => {
  if (!isAdmin) {
    return <Navigate to="/admin/login" />;
  }
  return children;
};

export default AdminRoute;
