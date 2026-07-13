import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

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
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const isBrand = variant === 'brand';
  const isDangerLight = variant === 'danger-light';

  const containerStyles = {
    brand: 'bg-[#064e3b]',
    'danger-light': 'bg-[#fff1f2] dark:bg-red-950/20',
    primary: 'bg-[#064e3b]',
    secondary: 'bg-[#f3f4f6] dark:bg-slate-800',
    outline: 'bg-white dark:bg-slate-900 border-2 border-[#064e3b] dark:border-emerald-700',
  };

  const textStyles = {
    brand: 'text-white font-bold',
    'danger-light': 'text-[#e11d48] dark:text-red-400 font-bold',
    primary: 'text-white font-bold',
    secondary: 'text-[#111827] dark:text-white font-bold',
    outline: 'text-[#064e3b] dark:text-emerald-400 font-bold',
  };

  const iconColors = isDarkMode
    ? {
        brand: 'white',
        'danger-light': '#ef4444',
        primary: 'white',
        secondary: 'white',
        outline: '#34d399',
      }
    : {
        brand: 'white',
        'danger-light': '#e11d48',
        primary: 'white',
        secondary: '#111827',
        outline: '#064e3b',
      };

  const activeIconColor = iconColors[variant];

  return (
    <TouchableOpacity
      className={`h-[56px] w-full flex-row items-center justify-center gap-3 rounded-full ${
        containerStyles[variant]
      } ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[isBrand ? styles.brandShadow : {}, style]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={activeIconColor} />
      ) : (
        <>
          {icon && <Feather name={icon} size={iconSize} color={activeIconColor} />}
          <Text className={`text-center text-[16px] ${textStyles[variant]}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  brandShadow: {
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
});
