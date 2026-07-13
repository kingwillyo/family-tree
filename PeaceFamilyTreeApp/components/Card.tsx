import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-slate-900 rounded-3xl p-6',
    elevated: 'bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg',
    outlined:
      'bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-200 dark:border-slate-800',
  };

  return (
    <View className={`${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </View>
  );
}
