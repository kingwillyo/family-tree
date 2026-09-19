import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { TreeFloatingControls } from '../../components/TreeFloatingControls';
import { TreeSearchButton } from '../../components/TreeSearchButton';
import { useAuth } from '../../lib/auth-context';
import {
  FAMILY_NODE_SIZE,
  FamilyLayoutPerson,
  FamilyTreeLayout,
  buildFamilyTreeLayout,
} from '../../lib/familyTreeLayout';
import { fetchCurrentUserProfile, fetchTreeData } from '../../lib/treeService';

const CONTENT_PADDING = 440;

interface PersonNodeProps {
  person: FamilyLayoutPerson;
  originX: number;
  originY: number;
  isDarkMode: boolean;
  onPress: () => void;
}

function PersonNode({ person, originX, originY, isDarkMode, onPress }: PersonNodeProps) {
  const nodeX = originX + person.x;
  const nodeY = originY + person.y;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open ${person.name}'s profile`}
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        position: 'absolute',
        left: nodeX - FAMILY_NODE_SIZE / 2,
        top: nodeY - FAMILY_NODE_SIZE / 2,
        width: FAMILY_NODE_SIZE,
        alignItems: 'center',
        zIndex: 10,
      }}>
      <View
        className="items-center justify-center overflow-hidden rounded-full bg-white dark:bg-slate-900"
        style={{
          width: FAMILY_NODE_SIZE,
          height: FAMILY_NODE_SIZE,
          borderWidth: person.isCurrentUser ? 4 : 3,
          borderColor: person.isCurrentUser
            ? '#059669'
            : person.admin
              ? '#facc15'
              : isDarkMode
                ? '#1e293b'
                : '#ffffff',
          elevation: person.isCurrentUser ? 7 : 4,
          shadowColor: person.isCurrentUser ? '#059669' : '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: person.isCurrentUser ? 0.24 : 0.13,
          shadowRadius: person.isCurrentUser ? 8 : 4,
        }}>
        {person.imageUrl ? (
          <Image
            source={{ uri: person.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Feather name="user" size={32} color={isDarkMode ? '#64748b' : '#9ca3af'} />
        )}
      </View>

      <View className="absolute w-[118px] items-center" style={{ top: FAMILY_NODE_SIZE + 7 }}>
        <Text
          numberOfLines={2}
          className={`text-center text-[13px] font-bold leading-[16px] ${
            person.isCurrentUser
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-gray-600 dark:text-slate-300'
          }`}>
          {person.name}
        </Text>
        {person.dates ? (
          <Text className="mt-0.5 text-center text-[10px] font-medium text-gray-400 dark:text-slate-500">
            {person.dates}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function TreeScreen() {
  const router = useRouter();
  const { user, familyId } = useAuth();
  const { width, height } = Dimensions.get('window');
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [layout, setLayout] = useState<FamilyTreeLayout | null>(null);

  const loadTree = React.useCallback(async () => {
    if (!user) return;
    setTreeLoading(true);
    setTreeError(null);

    try {
      const currentProfile = await fetchCurrentUserProfile(user.id);
      if (!familyId) {
        setTreeError('You must finalize your profile setup to view your tree.');
        return;
      }
      if (!currentProfile) {
        setTreeError('No profile was found for your account. Ask an admin to link your profile.');
        return;
      }

      const { profiles, relationships } = await fetchTreeData(familyId);
      const nextLayout = buildFamilyTreeLayout(profiles, relationships, currentProfile.id);
      if (!nextLayout.units.length) {
        setTreeError('We could not arrange your family tree.');
        return;
      }
      setLayout(nextLayout);
    } catch (error: any) {
      setTreeError(error?.message ?? 'Failed to load tree');
    } finally {
      setTreeLoading(false);
    }
  }, [familyId, user]);

  useFocusEffect(
    React.useCallback(() => {
      loadTree();
    }, [loadTree])
  );

  const contentSize = useMemo(() => {
    const people = layout?.people ?? [];
    const horizontalExtent = people.length
      ? Math.max(...people.map((person) => Math.abs(person.x)))
      : 0;
    const verticalExtent = people.length
      ? Math.max(...people.map((person) => Math.abs(person.y)))
      : 0;

    return {
      width: Math.max(2000, horizontalExtent * 2 + CONTENT_PADDING * 2),
      height: Math.max(2000, verticalExtent * 2 + CONTENT_PADDING * 2),
    };
  }, [layout]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const minScale = 0.45;
  const maxScale = 2;

  const getPanBoundaries = (currentScale: number) => {
    'worklet';
    const scaledWidth = contentSize.width * currentScale;
    const scaledHeight = contentSize.height * currentScale;
    const maxX = Math.max(0, (scaledWidth - width) / 2) + 180;
    const maxY = Math.max(0, (scaledHeight - height) / 2) + 240;
    return { maxX, maxY };
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const bounds = getPanBoundaries(scale.value);
      translateX.value = clamp(savedTranslateX.value + event.translationX, -bounds.maxX, bounds.maxX);
      translateY.value = clamp(savedTranslateY.value + event.translationY, -bounds.maxY, bounds.maxY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clamp(savedScale.value * event.scale, minScale, maxScale);
      const focalX = event.focalX - width / 2;
      const focalY = event.focalY - height / 2;
      const scaleChange = nextScale / scale.value;

      translateX.value = focalX - (focalX - translateX.value) * scaleChange;
      translateY.value = focalY - (focalY - translateY.value) * scaleChange;
      scale.value = nextScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const zoomAt = (nextScale: number, focalX: number, focalY: number) => {
    'worklet';
    const scaleChange = nextScale / scale.value;
    translateX.value = withTiming(focalX - (focalX - translateX.value) * scaleChange);
    translateY.value = withTiming(focalY - (focalY - translateY.value) * scaleChange);
    scale.value = withTiming(nextScale, {}, () => {
      savedScale.value = nextScale;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });
  };

  const handleZoomIn = () => zoomAt(clamp(scale.value + 0.25, minScale, maxScale), 0, 0);
  const handleZoomOut = () => zoomAt(clamp(scale.value - 0.25, minScale, maxScale), 0, 0);

  const centerTree = React.useCallback(() => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    savedTranslateX.value = 0;
    translateY.value = withSpring(0);
    savedTranslateY.value = 0;
  }, [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

  useEffect(() => {
    if (!layout) return;
    const timer = setTimeout(centerTree, 100);
    return () => clearTimeout(timer);
  }, [centerTree, layout]);

  const handleSearch = (query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || !layout) return;

    const person = layout.people.find((item) => item.name.toLowerCase().includes(normalizedQuery));
    if (!person) return;

    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(-person.x);
    savedTranslateX.value = -person.x;
    translateY.value = withSpring(-person.y);
    savedTranslateY.value = -person.y;
  };

  const originX = contentSize.width / 2;
  const originY = contentSize.height / 2;

  if (treeLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9f6] dark:bg-slate-950">
        <LottieView
          source={{ uri: 'https://lottie.host/e80c1d31-b731-43b0-b47b-0db6d116b3d2/axUS3P5Rhp.lottie' }}
          autoPlay
          loop
          speed={2}
          style={{ width: 150, height: 150 }}
        />
      </SafeAreaView>
    );
  }

  if (treeError || !layout) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9f6] px-10 dark:bg-slate-950">
        <Text className="mb-2 text-center text-lg font-bold text-gray-800 dark:text-white">Tree not found</Text>
        <Text className="text-center text-sm text-gray-400 dark:text-slate-500">
          {treeError ?? 'Your family tree is unavailable.'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fcf4] dark:bg-slate-950" edges={['top']}>
      <GestureDetector gesture={composedGestures}>
        <Animated.View className="flex-1 overflow-hidden">
          <Animated.View
            style={[
              {
                width: contentSize.width,
                height: contentSize.height,
                position: 'absolute',
                left: (width - contentSize.width) / 2,
                top: (height - contentSize.height) / 2,
              },
              animatedStyle,
            ]}>
            <Svg width={contentSize.width} height={contentSize.height} style={StyleSheet.absoluteFill}>
              {layout.links.map((link) => {
                const sourceX = originX + link.sourceX;
                const sourceY = originY + link.sourceY;
                const targetX = originX + link.targetX;
                const targetY = originY + link.targetY;
                const midpointY = (sourceY + targetY) / 2;
                const path = `M${sourceX},${sourceY} L${sourceX},${midpointY} L${targetX},${midpointY} L${targetX},${targetY}`;

                return (
                  <Path
                    key={link.id}
                    d={path}
                    fill="none"
                    stroke={isDarkMode ? '#334155' : '#cbd5d1'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
            </Svg>

            {layout.units.map((unit) => {
              const firstMember = unit.members[0];
              const secondMember = unit.members[1];

              return (
                <React.Fragment key={unit.id}>
                  {secondMember ? (
                    <View
                      style={{
                        position: 'absolute',
                        left: originX + firstMember.x + FAMILY_NODE_SIZE / 2,
                        top: originY + unit.y - 1,
                        width: secondMember.x - firstMember.x - FAMILY_NODE_SIZE,
                        height: 2,
                        backgroundColor: isDarkMode ? '#475569' : '#b9c4be',
                        zIndex: 1,
                      }}
                    />
                  ) : null}

                  {unit.members.map((person) => (
                    <PersonNode
                      key={person.id}
                      person={person}
                      originX={originX}
                      originY={originY}
                      isDarkMode={isDarkMode}
                      onPress={() => router.push(`/member/${person.id}`)}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <TreeFloatingControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenter={centerTree}
        onInvite={() => router.push('/invite')}
        onAddMember={() => router.push('/member/add')}
      />

      <TreeSearchButton onSearch={handleSearch} />
    </SafeAreaView>
  );
}
