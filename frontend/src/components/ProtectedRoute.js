import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUserToken } from '../utils/helpers';

const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();

  const token = getUserToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
