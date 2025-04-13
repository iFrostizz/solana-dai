"use client";

import React from 'react';

type InputProps = {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'password';
  suffix?: string;
  prefixComponent?: React.ReactNode;
  suffixComponent?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  className?: string;
  min?: number;
  max?: number;
};

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  suffix,
  prefixComponent,
  suffixComponent,
  disabled = false,
  error,
  className = '',
  min,
  max,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <div
        className={`flex items-center w-full rounded-lg border ${
          error ? 'border-error' : 'border-border'
        } bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-solana-purple focus-within:border-transparent ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {prefixComponent && (
          <div className="mr-2 flex-shrink-0">{prefixComponent}</div>
        )}
        <input
          type={type}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          className="w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0 text-foreground"
        />
        {suffix && (
          <div className="ml-2 text-muted-foreground text-sm">{suffix}</div>
        )}
        {suffixComponent && (
          <div className="ml-2 flex-shrink-0">{suffixComponent}</div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Input;
