import React, { ReactNode } from 'react';

/**
 * @deprecated This component's functionality has been removed from the application
 * as part of a codebase audit. It now acts as a simple pass-through component
 * and should be removed from any files that still import it.
 */
export const ErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
