"use client";

import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const baseClasses = 'rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-solana-purple to-solana-blue text-white hover:opacity-90 focus:ring-solana-blue',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-opacity-90 focus:ring-secondary',
    ghost: 'bg-transparent hover:bg-muted focus:ring-muted-foreground',
  };
  
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
