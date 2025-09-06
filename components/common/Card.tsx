import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`glass-pane rounded-xl p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};