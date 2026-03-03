import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={`w-full bg-white border ${
          error ? "border-red-300" : "border-gray-200"
        } rounded-xl px-4 py-4 text-base ${className}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
