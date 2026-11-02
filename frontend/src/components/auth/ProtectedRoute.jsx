import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, authLoading, profileStatus } = useAuth();
  const location = useLocation();

  const isCheckingAuth = (authLoading !== undefined ? authLoading : loading)
    || profileStatus === 'loading';

  if (isCheckingAuth) {
    return <LoadingSpinner message="Checking authentication..." fullPage />;
  }

  if (!currentUser) {
    // Redirect to login while saving the intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <React.Fragment key={currentUser.uid}>{children}</React.Fragment>;
};
