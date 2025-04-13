"use client";

import React from 'react';

type CardProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
  gradient?: boolean;
};

export const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  gradient = false,
}) => {
  return (
    <div 
      className={`bg-card rounded-xl shadow-md overflow-hidden ${
        gradient ? 'border-2 gradient-border' : 'border border-border'
      } ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;
