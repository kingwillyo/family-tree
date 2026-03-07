import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

export interface TreeSearchButtonProps {
  onPress?: () => void;
}

export function TreeSearchButton({ onPress }: TreeSearchButtonProps) {
  const isGlass = isLiquidGlassAvailable();

  const buttonContent = (
    <TouchableOpacity
      activeOpacity={0.7}
      className="h-14 w-14 items-center justify-center rounded-full border border-white/20"
      onPress={onPress}>
      <Feather name="search" size={24} color="#374151" />
    </TouchableOpacity>
  );

  return (
    <View
      className="absolute right-6 top-16 z-50 overflow-hidden rounded-full shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      }}>
      {isGlass ? (
        <GlassView glassEffectStyle="regular" colorScheme="light">
          {buttonContent}
        </GlassView>
      ) : (
        <BlurView
          intensity={70}
          tint="light"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}>
          {buttonContent}
        </BlurView>
      )}
    </View>
  );
}
