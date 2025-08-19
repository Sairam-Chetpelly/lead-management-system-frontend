import React from 'react';

interface AccessControlProps {
  requiredRole?: string;
  children: React.ReactNode;
}

const AccessControl: React.FC<AccessControlProps> = ({ requiredRole, children }) => {
  // For now, just render children - implement role checking later
  return <>{children}</>;
};

export default AccessControl;