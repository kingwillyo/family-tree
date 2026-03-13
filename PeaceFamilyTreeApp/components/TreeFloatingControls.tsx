import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TreeFloatingControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onAddMember?: () => void;
}

export function TreeFloatingControls({ 
  onZoomIn, 
  onZoomOut, 
  onCenter,
  onAddMember 
}: TreeFloatingControlsProps) {
  const insets = useSafeAreaInsets();

  // Base offset above tabs. A typical native tab bar height is around 50-60 on android, 50 + insets on iOS.
  const bottomOffset = Platform.OS === 'ios' ? insets.bottom + 74 : 84;

  return (
    <>
      {/* FLOATING CONTROLS - LEFT */}
      <View className="absolute left-6 gap-y-4" style={{ bottom: bottomOffset }}>
        <View
          className="elevation-3 w-14 overflow-hidden rounded-[20px] border border-gray-100/50 bg-white shadow-sm"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
          }}>
          <TouchableOpacity onPress={onZoomIn} className="items-center justify-center py-4">
            <Feather name="plus" size={24} color="#6b7280" />
          </TouchableOpacity>
          <View className="h-[1px] w-full bg-gray-100" />
          <TouchableOpacity onPress={onZoomOut} className="items-center justify-center py-4">
            <Feather name="minus" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onCenter}
          className="elevation-3 h-14 w-14 items-center justify-center rounded-[20px] border border-gray-100/50 bg-white shadow-sm"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
          }}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* FLOATING FAB - RIGHT */}
      <TouchableOpacity
        onPress={onAddMember}
        activeOpacity={0.8}
        className="elevation-4 absolute right-6 z-50 h-16 w-16 items-center justify-center rounded-[20px] bg-[#3cd52e]"
        style={{
          bottom: bottomOffset,
          shadowColor: '#3cd52e',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        }}>
        <Feather name="user-plus" size={28} color="white" />
      </TouchableOpacity>
    </>
  );
}
