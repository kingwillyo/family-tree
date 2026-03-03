import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "danger";
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "primary",
  loading = false,
  fullWidth = true,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = "rounded-2xl py-4 px-6";
  const widthStyles = fullWidth ? "w-full" : "";

  const variantStyles = {
    primary: "bg-emerald-600 active:bg-emerald-700",
    secondary: "bg-gray-100 active:bg-gray-200",
    outline: "bg-white border-2 border-emerald-600 active:bg-emerald-50",
    danger: "bg-white border-2 border-red-200 active:bg-red-50",
  };

  const textStyles = {
    primary: "text-white",
    secondary: "text-gray-900",
    outline: "text-emerald-600",
    danger: "text-red-600",
  };

  const disabledStyles = disabled || loading ? "opacity-50" : "";

  return (
    <TouchableOpacity
      className={`${baseStyles} ${widthStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#fff" : "#059669"}
        />
      ) : (
        <Text
          className={`${textStyles[variant]} text-center font-semibold text-base`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
