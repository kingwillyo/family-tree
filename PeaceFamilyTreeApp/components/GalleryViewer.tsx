import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Share,
  StyleSheet,
  StatusBar as NativeStatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptimizedImage as Image } from './OptimizedImage';

export interface GalleryPhoto {
  id: string;
  uri: string;
  title?: string | null;
  location?: string | null;
  createdAt?: string | null;
  canEdit?: boolean;
}

interface GalleryViewerProps {
  visible: boolean;
  photos: GalleryPhoto[];
  initialIndex: number;
  ownerName?: string;
  onClose: () => void;
  onEdit?: (photo: GalleryPhoto) => void;
}

function formatPhotoDate(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface ZoomablePhotoProps {
  active: boolean;
  photo: GalleryPhoto;
  width: number;
}

function ZoomablePhoto({ active, photo, width }: ZoomablePhotoProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      scale.value = 1;
      savedScale.value = 1;
    }
  }, [active, savedScale, scale]);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((event) => {
          scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
        })
        .onEnd(() => {
          if (scale.value < 1.05) {
            scale.value = withTiming(1);
            savedScale.value = 1;
          } else {
            savedScale.value = scale.value;
          }
        }),
    [savedScale, scale]
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onEnd((_event, success) => {
          if (!success) return;
          const nextScale = scale.value > 1 ? 1 : 2.5;
          scale.value = withTiming(nextScale, { duration: 180 });
          savedScale.value = nextScale;
        }),
    [savedScale, scale]
  );

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ width }} className="flex-1 items-center justify-center overflow-hidden">
      <GestureDetector gesture={Gesture.Simultaneous(pinch, doubleTap)}>
        <Animated.View style={[{ width, height: '100%' }, imageStyle]}>
          <Image
            source={{ uri: photo.uri }}
            style={{ width, height: '100%' }}
            contentFit="contain"
            allowDownscaling={false}
            onLoadStart={() => {
              setLoading(true);
              setFailed(false);
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        </Animated.View>
      </GestureDetector>

      {loading ? (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <ActivityIndicator color="white" />
        </View>
      ) : null}

      {failed ? (
        <View className="absolute inset-0 items-center justify-center px-8" pointerEvents="none">
          <Feather name="image" size={36} color="#6b7280" />
          <Text className="mt-3 text-center text-sm text-gray-400">
            This photo could not be loaded.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function GalleryViewerModal({
  photos,
  initialIndex,
  ownerName,
  onClose,
  onEdit,
}: Omit<GalleryViewerProps, 'visible'>) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // A React Native Modal gets its own native root on iOS. On some devices that
  // makes the context inset report 0, so retain the app's initial inset and a
  // conservative platform fallback instead of drawing beneath the status bar.
  const topInset = Math.max(
    insets.top,
    initialWindowMetrics?.insets.top ?? 0,
    Platform.OS === 'ios' && height > width ? 44 : (NativeStatusBar.currentHeight ?? 0)
  );
  const startIndex = Math.min(Math.max(initialIndex, 0), photos.length - 1);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const mainListRef = useRef<FlatList<GalleryPhoto>>(null);
  const thumbnailListRef = useRef<FlatList<GalleryPhoto>>(null);
  const currentPhoto = photos[activeIndex] ?? photos[0];
  const dismissOffset = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      mainListRef.current?.scrollToIndex({ index: startIndex, animated: false });
    }, 0);

    return () => clearTimeout(timeout);
  }, [startIndex, width]);

  useEffect(() => {
    if (photos.length < 2) return;
    thumbnailListRef.current?.scrollToIndex({
      index: activeIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [activeIndex, photos.length]);

  const selectPhoto = useCallback((index: number) => {
    setActiveIndex(index);
    mainListRef.current?.scrollToIndex({ index, animated: false });
  }, []);

  const shareCurrentPhoto = useCallback(async () => {
    if (!currentPhoto) return;

    await Share.share({
      message: currentPhoto.uri,
      url: currentPhoto.uri,
      title: currentPhoto.title ?? 'Photo',
    });
  }, [currentPhoto]);

  const dismissGesture = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY(10)
        .failOffsetX([-24, 24])
        .onUpdate((event) => {
          dismissOffset.value = Math.max(0, event.translationY);
        })
        .onEnd((event) => {
          const shouldDismiss =
            dismissOffset.value > height * 0.16 ||
            (dismissOffset.value > 24 && event.velocityY > 900);

          if (shouldDismiss) {
            dismissOffset.value = withTiming(
              height,
              { duration: 220 },
              (finished) => finished && runOnJS(onClose)()
            );
            return;
          }

          dismissOffset.value = withSpring(0, {
            damping: 22,
            stiffness: 240,
            mass: 0.8,
          });
        }),
    [dismissOffset, height, onClose]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dismissOffset.value, [0, height * 0.55], [1, 0], Extrapolation.CLAMP),
  }));

  const photoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: dismissOffset.value },
      {
        scale: interpolate(dismissOffset.value, [0, height], [1, 0.82], Extrapolation.CLAMP),
      },
    ],
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dismissOffset.value, [0, 90], [1, 0], Extrapolation.CLAMP),
  }));

  const dateLabel = formatPhotoDate(currentPhoto?.createdAt);
  const detailLabel = [dateLabel, currentPhoto?.location].filter(Boolean).join('  •  ');

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onRequestClose={onClose}>
      <StatusBar style="light" backgroundColor="black" />
      <View className="flex-1">
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'black' }, backdropStyle]}
        />

        <GestureDetector gesture={dismissGesture}>
          <Animated.View style={[{ flex: 1 }, photoContainerStyle]}>
            <FlatList
              ref={mainListRef}
              data={photos}
              horizontal
              pagingEnabled
              bounces={false}
              initialScrollIndex={startIndex}
              initialNumToRender={Math.min(3, photos.length)}
              maxToRenderPerBatch={3}
              windowSize={3}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(photo) => photo.id}
              getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                setActiveIndex(Math.min(Math.max(nextIndex, 0), photos.length - 1));
              }}
              renderItem={({ item, index }) => (
                <ZoomablePhoto photo={item} width={width} active={index === activeIndex} />
              )}
            />
          </Animated.View>
        </GestureDetector>

        <Animated.View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFillObject, controlsStyle]}>
          <View
            className="absolute left-0 right-0 top-0 bg-black/55 px-3 pb-3"
            style={{ paddingTop: topInset + 4 }}>
            <View className="flex-row items-center">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close gallery viewer"
                onPress={onClose}
                hitSlop={10}
                className="h-11 w-11 items-center justify-center rounded-full">
                <Feather name="chevron-left" size={30} color="white" />
              </TouchableOpacity>

              <View className="ml-1 flex-1">
                <Text className="text-[15px] font-semibold text-white" numberOfLines={1}>
                  {ownerName || 'Gallery'}
                </Text>
                <Text className="mt-0.5 text-[12px] text-white/70">
                  {activeIndex + 1} of {photos.length}
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Share photo"
                onPress={shareCurrentPhoto}
                hitSlop={8}
                className="h-11 w-11 items-center justify-center rounded-full">
                <Feather name="share" size={21} color="white" />
              </TouchableOpacity>

              {currentPhoto?.canEdit && onEdit ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Edit photo memory"
                  onPress={() => onEdit(currentPhoto)}
                  hitSlop={8}
                  className="h-11 w-11 items-center justify-center rounded-full">
                  <Feather name="edit-2" size={20} color="white" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View
            className="absolute bottom-0 left-0 right-0 bg-black/65 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            {currentPhoto?.title || detailLabel ? (
              <View className="mb-3 px-5">
                {currentPhoto.title ? (
                  <Text className="text-[15px] font-medium text-white" numberOfLines={2}>
                    {currentPhoto.title}
                  </Text>
                ) : null}
                {detailLabel ? (
                  <Text className="mt-1 text-[12px] text-white/65" numberOfLines={1}>
                    {detailLabel}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {photos.length > 1 ? (
              <FlatList
                ref={thumbnailListRef}
                data={photos}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(photo) => `thumbnail-${photo.id}`}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                getItemLayout={(_data, index) => ({ length: 56, offset: 56 * index, index })}
                onScrollToIndexFailed={({ index }) => {
                  thumbnailListRef.current?.scrollToOffset({
                    offset: Math.max(0, index * 56 - width / 2),
                    animated: true,
                  });
                }}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`View photo ${index + 1}`}
                    onPress={() => selectPhoto(index)}
                    activeOpacity={0.8}
                    className={`mr-2 h-12 w-12 overflow-hidden rounded-lg border-2 ${
                      index === activeIndex ? 'border-white' : 'border-transparent opacity-60'
                    }`}>
                    <Image
                      source={{ uri: item.uri }}
                      className="h-full w-full"
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                )}
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function GalleryViewer({ visible, photos, ...props }: GalleryViewerProps) {
  if (!visible || photos.length === 0) return null;

  return <GalleryViewerModal {...props} photos={photos} />;
}
