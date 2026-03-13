import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="mb-2 text-sm font-semibold text-gray-700">{label}</Text>}
      <TextInput
        className={`w-full border bg-white ${
          error ? 'border-red-300' : 'border-gray-200'
        } rounded-full px-4 py-4 text-base ${className}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
