import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthContext } from '../context/AuthContext';

// Pages
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { MemberPortal } from '../pages/MemberPortal';
import { Members } from '../pages/Members';
import { MemberDetailsPage } from '../pages/MemberDetailsPage';
import { Meals } from '../pages/Meals';
import { MarketCosts } from '../pages/MarketCosts';
import { Deposits } from '../pages/Deposits';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';

const RootRedirect = () => {
  const { isMember } = useAuthContext();
  return <Navigate to={isMember ? '/portal' : '/dashboard'} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route path="portal" element={<MemberPortal />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:memberId" element={<MemberDetailsPage />} />
        <Route path="meals" element={<Meals />} />
        <Route path="market-costs" element={<MarketCosts />} />
        <Route path="deposits" element={<Deposits />} />
        <Route path="reports" element={<Reports />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute requireAdmin>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};
