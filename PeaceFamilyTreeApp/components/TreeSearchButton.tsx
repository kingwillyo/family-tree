import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, Dimensions, StyleSheet } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const SEARCH_BAR_WIDTH = WINDOW_WIDTH - 48; // 24px margin on each side
const BUTTON_SIZE = 56;

export interface TreeSearchButtonProps {
  onSearch?: (query: string) => void;
}

export function TreeSearchButton({ onSearch }: TreeSearchButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const isGlass = isLiquidGlassAvailable();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const expanded = useSharedValue(0);

  useEffect(() => {
    expanded.value = withSpring(isExpanded ? 1 : 0, {
      damping: 25,
      stiffness: 120,
      mass: 0.8,
    });
    if (isExpanded) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
      setQuery('');
      onSearch?.('');
    }
  }, [isExpanded]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(expanded.value, [0, 1], [BUTTON_SIZE, SEARCH_BAR_WIDTH]),
      height: BUTTON_SIZE,
    };
  });

  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(expanded.value, [0, 0.5, 1], [0, 0, 1]),
      width: interpolate(expanded.value, [0, 1], [0, SEARCH_BAR_WIDTH - 100]),
    };
  });

  const handlePress = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  const content = (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      className="flex-1 flex-row items-center px-4"
      style={{ height: BUTTON_SIZE }}>
      <View className="h-10 w-10 items-center justify-center">
        <Feather name="search" size={22} color={isDarkMode ? '#ffffff' : '#374151'} />
      </View>

      <Animated.View style={[{ overflow: 'hidden' }, animatedInputStyle]}>
        <TextInput
          ref={inputRef}
          className="h-full text-base font-semibold text-gray-800 dark:text-white"
          placeholder="Find a relative..."
          placeholderTextColor={isDarkMode ? '#94a3b8' : '#6b7280'}
          value={query}
          onChangeText={handleSearch}
        />
      </Animated.View>

      {isExpanded && (
        <TouchableOpacity
          onPress={handleClose}
          className="ml-auto h-10 w-10 items-center justify-center">
          <Feather name="x" size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <Animated.View
      className="absolute right-6 top-16 z-50 overflow-hidden rounded-full shadow-lg"
      style={[
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 5,
        },
        animatedContainerStyle,
      ]}>
      {isGlass ? (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDarkMode ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}>
          {content}
        </GlassView>
      ) : (
        <BlurView
          intensity={70}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)' },
          ]}>
          {content}
        </BlurView>
      )}
      {!isGlass && content}
    </Animated.View>
  );
}
