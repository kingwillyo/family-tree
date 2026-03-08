import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TreeMockCard } from '../../components/TreeMockCard';
import { mockTreeData } from '../../constants/mockTreeData';
import { TreeFloatingControls } from '../../components/TreeFloatingControls';
import { TreeSearchButton } from '../../components/TreeSearchButton';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  clamp,
} from 'react-native-reanimated';

export default function TreeScreen() {
  const { width, height } = Dimensions.get('window');

  // Reanimated Shared Values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const minScale = 0.5;
  const maxScale = 2.0;

  // Content dimensions (approximate based on mock cards)
  const contentWidth = 800;
  const contentHeight = 1000;

  // Limits for panning so it doesn't drag infinitely into empty space
  const getPanBoundaries = (currentScale: number) => {
    'worklet';
    const scaledWidth = contentWidth * currentScale;
    const scaledHeight = contentHeight * currentScale;
    const maxX = Math.max(0, (scaledWidth - width) / 2) + 200;
    const maxY = Math.max(0, (scaledHeight - height) / 2) + 300;
    return { maxX, maxY };
  };

  // PAN GESTURE
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const bounds = getPanBoundaries(scale.value);
      translateX.value = clamp(savedTranslateX.value + e.translationX, -bounds.maxX, bounds.maxX);
      translateY.value = clamp(savedTranslateY.value + e.translationY, -bounds.maxY, bounds.maxY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // PINCH GESTURE
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, minScale, maxScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Floating controls handlers (animates nicely via shared values)
  const handleZoomIn = () => {
    const nextScale = clamp(scale.value + 0.25, minScale, maxScale);
    scale.value = withTiming(nextScale);
    savedScale.value = nextScale;
  };

  const handleZoomOut = () => {
    const nextScale = clamp(scale.value - 0.25, minScale, maxScale);
    scale.value = withTiming(nextScale);
    savedScale.value = nextScale;
  };

  const centerTree = () => {
    // Reset scale
    scale.value = withSpring(1);
    savedScale.value = 1;
    // We want the viewport centered horizontally
    translateX.value = withSpring(0);
    savedTranslateX.value = 0;
    // We want the focal point biased towards the bottom (the User's node)
    const yOffset = -250; 
    translateY.value = withSpring(yOffset);
    savedTranslateY.value = yOffset;
  };

  // Center on mount
  useEffect(() => {
    setTimeout(centerTree, 100);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9f6]" edges={['top']}>
      <GestureDetector gesture={composedGestures}>
        {/* Fill screen to capture gestures anywhere */}
        <Animated.View className="flex-1 overflow-hidden">
          <Animated.View
            style={[
              {
                width: contentWidth,
                height: contentHeight,
                alignItems: 'center',
                justifyContent: 'center',
                // Center the large view itself initially in the screen layout
                position: 'absolute',
                left: (width - contentWidth) / 2,
                top: (height - contentHeight) / 2,
              },
              animatedStyle,
            ]}>
            <View style={{ alignItems: 'center' }}>
              {/* ROW 1: PARENTS */}
              <View className="z-10 flex-row items-center justify-center">
                <TreeMockCard
                  variant="parent"
                  name={mockTreeData.parents[0].name}
                  role={mockTreeData.parents[0].role}
                  dates={mockTreeData.parents[0].dates}
                  imageUrl={mockTreeData.parents[0].imageUrl}
                />

                <View className="relative h-[2px] w-16 bg-[#d3d9d6]">
                  <View className="absolute left-[50%] top-0 -ml-[1px] h-[60px] w-[2px] bg-[#d3d9d6]" />
                </View>

                <TreeMockCard
                  variant="parent"
                  name={mockTreeData.parents[1].name}
                  role={mockTreeData.parents[1].role}
                  dates={mockTreeData.parents[1].dates}
                  imageUrl={mockTreeData.parents[1].imageUrl}
                />
              </View>

              {/* ROW 2: MAIN ANCESTOR */}
              <View className="z-10 mt-[60px] items-center">
                <TreeMockCard
                  variant="child"
                  name={mockTreeData.mainAncestor.name}
                  role={mockTreeData.mainAncestor.role}
                  subTitle={mockTreeData.mainAncestor.subTitle}
                  dates={mockTreeData.mainAncestor.dates}
                  imageUrl={mockTreeData.mainAncestor.imageUrl}
                />

                <View className="h-[60px] w-[2px] bg-[#d3d9d6]" />
              </View>

              {/* ROW 3: CHILDREN / CURRENT USER */}
              <View className="z-10 items-center">
                <View className="h-[2px] w-[368px] bg-[#d3d9d6]" />

                <View className="mt-[0px] flex-row items-start justify-center">
                  {/* Left side node (George) */}
                  <View className="relative mx-3 items-center">
                    <View className="h-[30px] w-[2px] bg-[#d3d9d6]" />
                    <TreeMockCard
                      variant="child"
                      name={mockTreeData.children[0].name}
                      dates={mockTreeData.children[0].dates}
                      imageUrl={mockTreeData.children[0].imageUrl}
                    />
                  </View>

                  {/* Center node (Current User) */}
                  <View className="relative mx-3 items-center">
                    <View className="h-[30px] w-[2px] bg-[#d3d9d6]" />
                    <TreeMockCard
                      variant="main"
                      name={mockTreeData.children[1].name}
                      role="CURRENT USER"
                      dates={mockTreeData.children[1].dates}
                      imageUrl={mockTreeData.children[1].imageUrl}
                    />

                    {/* ROW 4: GRANDCHILDREN */}
                    <View className="items-center">
                      <View className="h-[30px] w-[2px] bg-[#d3d9d6]" />
                      <View className="h-[2px] w-[180px] bg-[#d3d9d6]" />

                      <View className="flex-row items-start justify-center mt-[0px]">
                        {/* Left side node */}
                        <View className="relative mx-2 items-center">
                          <View className="h-[30px] w-[2px] bg-[#d3d9d6]" />
                          <TreeMockCard
                            variant="child"
                            name={mockTreeData.grandchildren[0].name}
                            dates={mockTreeData.grandchildren[0].dates}
                            imageUrl={mockTreeData.grandchildren[0].imageUrl}
                          />
                        </View>

                        {/* Right side node */}
                        <View className="relative mx-2 items-center">
                          <View className="h-[30px] w-[2px] bg-[#d3d9d6]" />
                          <TreeMockCard variant="add" />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Right side node (Add) */}
                  <View className="relative mx-3 items-center">
                    <View className="h-[30px] w-[2px] bg-[#d3d9d6]" />
                    <TreeMockCard variant="add" />
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <TreeFloatingControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenter={centerTree}
      />

      {/* FLOATING GLASS SEARCH ICON */}
      <TreeSearchButton />
    </SafeAreaView>
  );
}
