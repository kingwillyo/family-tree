import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-400">
          {label}
        </Text>
      )}
      <TextInput
        className={`w-full bg-gray-100 text-gray-900 dark:bg-slate-900 dark:text-white ${
          error ? 'border border-red-300' : 'border border-transparent'
        } rounded-2xl px-5 py-4 text-base ${className}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
