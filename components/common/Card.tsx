import React, { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className = '', ...props }, ref) => {
  const isInteractive = !!props.onClick;
  return (
    <div
      ref={ref}
      className={`glass-pane rounded-xl p-4 ${isInteractive ? 'card-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});