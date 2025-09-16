import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  const isInteractive = !!props.onClick;
  return (
    <div
      className={`glass-pane rounded-xl p-4 ${isInteractive ? 'card-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};