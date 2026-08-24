import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { isOwner } from './business-roles';

// ── Auth Telemetry Helper (remove in Phase 5) ────────────────────────────────
function logAuthCheck(guard, profile, location, result) {
  console.warn(`[AUTH:${guard}]`, {
    route: location?.pathname,
    result,
    app_role: profile?.app_role,
    role: profile?.role,
    user_type: profile?.user_type,
  });
}

export const RequireSuperadmin = ({ children }) => {
  const { profile, isSuperadmin: authIsSuperadmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!authIsSuperadmin) {
    logAuthCheck('RequireSuperadmin', profile, location, 'DENIED');
    return <Navigate to="/beranda" state={{ from: location }} replace />;
  }

  logAuthCheck('RequireSuperadmin', profile, location, 'ALLOWED');
  return children;
};

export const RequireOwner = ({ children }) => {
  const { profile, isSuperadmin: authIsSuperadmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isOwner(profile) && !authIsSuperadmin) {
    logAuthCheck('RequireOwner', profile, location, 'DENIED');
    return <Navigate to="/beranda" state={{ from: location }} replace />;
  }

  logAuthCheck('RequireOwner', profile, location, 'ALLOWED');
  return children;
};

export const RequireCapability = ({ children, capabilityCheck, capabilityName = 'unknown' }) => {
  const { profile, isSuperadmin: authIsSuperadmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!authIsSuperadmin && !capabilityCheck(profile)) {
    logAuthCheck(`RequireCapability:${capabilityName}`, profile, location, 'DENIED');
    return <Navigate to="/beranda" state={{ from: location }} replace />;
  }

  logAuthCheck(`RequireCapability:${capabilityName}`, profile, location, 'ALLOWED');
  return children;
};
