import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Feather>['name'];

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'brand' | 'danger-light' | 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  icon?: IconName;
  iconSize?: number;
}

export function Button({
  title,
  variant = 'brand',
  loading = false,
  icon,
  iconSize = 18,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const isBrand = variant === 'brand';
  const isDangerLight = variant === 'danger-light';

  const containerStyles = {
    brand: 'bg-[#8cc63f]',
    'danger-light': 'bg-[#fff1f2]',
    primary: 'bg-emerald-600',
    secondary: 'bg-gray-100',
    outline: 'bg-white border-2 border-emerald-600',
  };

  const textStyles = {
    brand: 'text-white font-extrabold uppercase tracking-[0.15em]',
    'danger-light': 'text-[#e11d48] font-bold',
    primary: 'text-white font-semibold',
    secondary: 'text-gray-900 font-semibold',
    outline: 'text-emerald-600 font-semibold',
  };

  const iconColors = {
    brand: 'white',
    'danger-light': '#e11d48',
    primary: 'white',
    secondary: '#111827',
    outline: '#059669',
  };

  return (
    <TouchableOpacity
      className={`h-[64px] w-full flex-row items-center justify-center gap-3 rounded-[24px] ${
        containerStyles[variant]
      } ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        isBrand ? styles.brandShadow : {},
        style
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={iconColors[variant]} />
      ) : (
        <>
          {icon && <Feather name={icon} size={iconSize} color={iconColors[variant]} />}
          <Text className={`text-[16px] text-center ${textStyles[variant]}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  brandShadow: {
    shadowColor: '#8cc63f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
});
