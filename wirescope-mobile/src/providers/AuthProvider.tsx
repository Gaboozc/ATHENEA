import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const AuthProvider: React.FC<Props> = ({ children }) => {
  // TODO: Implement Auth0 integration
  // This should handle authentication flow and token management
  return <>{children}</>;
};

export default AuthProvider;