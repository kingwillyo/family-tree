import React, { useRef, useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TreeMockCard } from '../../components/TreeMockCard';
import { mockTreeData } from '../../constants/mockTreeData';
import { TreeFloatingControls } from '../../components/TreeFloatingControls';
import { TreeSearchButton } from '../../components/TreeSearchButton';

export default function TreeScreen() {
  const { width, height } = Dimensions.get('window');

  // Zoom state
  const [scale, setScale] = useState(1);
  const minScale = 0.5;
  const maxScale = 2.0;

  // Refs for scrolling
  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRef = useRef<ScrollView>(null);

  // Content dimensions (approximate based on mock cards)
  const contentWidth = 800;
  const contentHeight = 800;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, maxScale));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, minScale));
  };

  const currentScaleTransform = { transform: [{ scale }] };

  const centerTree = () => {
    // Scroll to the absolute middle of the canvas horizontally
    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollTo({
        x: (contentWidth - width) / 2,
        animated: true,
      });
    }
    if (verticalScrollRef.current) {
      // Offset heavily downwards to hit the child row (where current user acts as the root node for this viewpoint)
      verticalScrollRef.current.scrollTo({
        y: (contentHeight - height) / 2 + 150,
        animated: true,
      });
    }
    setScale(1); // Reset zoom
  };

  // Center on mount
  useEffect(() => {
    setTimeout(() => {
      centerTree();
    }, 100);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9f6]" edges={['top']}>
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ width: contentWidth, justifyContent: 'center' }}>
        <ScrollView
          ref={verticalScrollRef}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{
            height: contentHeight,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 100,
          }}>
          <Animated.View style={[currentScaleTransform, { alignItems: 'center' }]}>
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
                </View>

                {/* Right side node (Add) */}
                <View className="relative mx-3 items-center">
                  <View className="h-[30px] w-[2px] bg-[#d3d9d6]" />
                  <TreeMockCard variant="add" />
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </ScrollView>

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
