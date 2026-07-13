import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export interface TreeFloatingControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onInvite?: () => void;
}

export function TreeFloatingControls({
  onZoomIn,
  onZoomOut,
  onCenter,
  onInvite,
}: TreeFloatingControlsProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Base offset above tabs. A typical native tab bar height is around 50-60 on android, 50 + insets on iOS.
  const bottomOffset = Platform.OS === 'ios' ? insets.bottom + 74 : 84;

  return (
    <>
      {/* FLOATING CONTROLS - LEFT */}
      <View className="absolute left-6 gap-y-4" style={{ bottom: bottomOffset }}>
        <View
          className="elevation-3 w-14 overflow-hidden rounded-[20px] border border-gray-100/50 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
          }}>
          <TouchableOpacity onPress={onZoomIn} className="items-center justify-center py-4">
            <Feather name="plus" size={24} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
          </TouchableOpacity>
          <View className="h-[1px] w-full bg-gray-100 dark:bg-slate-800" />
          <TouchableOpacity onPress={onZoomOut} className="items-center justify-center py-4">
            <Feather name="minus" size={24} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onCenter}
          className="elevation-3 h-14 w-14 items-center justify-center rounded-[20px] border border-gray-100/50 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
          }}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={24}
            color={isDarkMode ? '#94a3b8' : '#6b7280'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onInvite}
          className="elevation-3 h-14 w-14 items-center justify-center rounded-[20px] border border-gray-100/50 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
          }}>
          <Feather name="send" size={22} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
        </TouchableOpacity>
      </View>
    </>
  );
}
