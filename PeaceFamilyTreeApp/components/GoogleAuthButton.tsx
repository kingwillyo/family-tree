import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface GoogleAuthButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export function GoogleAuthButton({
  title,
  loading = false,
  disabled,
  className = '',
  ...props
}: GoogleAuthButtonProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      activeOpacity={0.8}
      disabled={disabled || loading}
      className={`h-14 w-full flex-row items-center justify-center rounded-full border border-gray-200 bg-white px-5 dark:border-slate-700 dark:bg-slate-900 ${
        disabled || loading ? 'opacity-50' : ''
      } ${className}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <>
          <FontAwesome name="google" size={20} color="#4285F4" />
          <Text className="ml-3 text-center text-[16px] font-bold text-gray-800 dark:text-white">
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
