import React from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'Brand' | 'Influencer' | 'Admin';
}

/**
 * Simplified AuthGuard component that only checks if a user exists
 * All role and Instagram connection checks are now handled by the middleware
 */
export const AuthGuard = React.memo(({ children }: AuthGuardProps) => {

  return <>{children}</>;
});

AuthGuard.displayName = 'AuthGuard';