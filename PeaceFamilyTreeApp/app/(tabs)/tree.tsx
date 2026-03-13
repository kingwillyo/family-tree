import React, { useEffect, useMemo, useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TreeMockCard } from '../../components/TreeMockCard';
import { mockD3Descendants, mockD3Ancestors, D3TreeNode } from '../../constants/mockTreeData';
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
import * as d3 from 'd3-hierarchy';
import Svg, { Path } from 'react-native-svg';

// Custom dimensions based on the mock cards
const CARD_WIDTH = 280; // For main card, fallback to 160 for small
const SMALL_CARD_WIDTH = 160;
const CARD_HEIGHT = 200; // rough sizing
const PARENT_DISTANCE_Y = 160;

const injectDescendantPlaceholders = (node: D3TreeNode): D3TreeNode => {
  const children = node.children ? node.children.map(injectDescendantPlaceholders) : [];
  return {
    ...node,
    children: [...children, { id: `add-child-${node.id}`, name: 'Add Child', role: 'ADD_CHILD' }],
  };
};

const injectAncestorPlaceholders = (node: D3TreeNode): D3TreeNode => {
  const children = node.children ? node.children.map(injectAncestorPlaceholders) : [];
  if (children.length === 0 && node.id !== 'main-1-ancestors-root') {
    return {
      ...node,
      children: [{ id: `add-parent-${node.id}`, name: 'Add Parent', role: 'ADD_PARENT' }],
    };
  }
  return { ...node, children };
};

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

    // Render variables
    const [descendantNodes, setDescendantNodes] = useState<d3.HierarchyPointNode<D3TreeNode>[]>([]);
    const [descendantLinks, setDescendantLinks] = useState<d3.HierarchyPointLink<D3TreeNode>[]>([]);
    const [ancestorNodes, setAncestorNodes] = useState<d3.HierarchyPointNode<D3TreeNode>[]>([]);
    const [ancestorLinks, setAncestorLinks] = useState<d3.HierarchyPointLink<D3TreeNode>[]>([]);

    // Offset variables to center the current-user
    const [treeOffsetX, setTreeOffsetX] = useState(0);
    const [treeOffsetY, setTreeOffsetY] = useState(0);

    // Calculate layout
    useMemo(() => {
      // 1. Descendants Tree Layout
      const descData = injectDescendantPlaceholders(mockD3Descendants);
      const descRoot = d3.hierarchy(descData);
      const descTreeLayout = d3.tree<D3TreeNode>().nodeSize([400, 360]);
      const layout = descTreeLayout(descRoot);

      const nodes = layout.descendants();
      setDescendantNodes(nodes);
      setDescendantLinks(layout.links());

      const currentUserNode = nodes.find((n) => n.data.id === 'current-user');
      if (currentUserNode) {
        setTreeOffsetX(-currentUserNode.x);
        setTreeOffsetY(-currentUserNode.y);
      }

      // 2. Ancestors Tree Layout
      const ancData = injectAncestorPlaceholders(mockD3Ancestors);
      const ancRoot = d3.hierarchy(ancData);
      const ancTreeLayout = d3.tree<D3TreeNode>().nodeSize([400, PARENT_DISTANCE_Y + 100]);
      const ancLayout = ancTreeLayout(ancRoot);

      // Filter out the dummy root we created
      const parents = ancLayout.descendants().filter((node) => node.data.id !== 'main-1-ancestors-root');
      setAncestorNodes(parents);

      // Pass along ancestor links, including the origin link
      setAncestorLinks(ancLayout.links());
    }, []);

    // Pan limits
    const contentWidth = 2000;
    const contentHeight = 2000;

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

    const centerTree = React.useCallback(() => {
      scale.value = withSpring(1);
      savedScale.value = 1;
      // Since we aligned the 'current-user' mathematically to exact center of our content bounds
      // And our content view is absolutely centered on the screen initially
      // A translate of 0,0 focuses the screen exactly on the current user!
      translateX.value = withSpring(0);
      savedTranslateX.value = 0;
      translateY.value = withSpring(0);
      savedTranslateY.value = 0;
    }, [scale, savedScale, translateX, savedTranslateX, translateY, savedTranslateY]);

    // Center on mount
    useEffect(() => {
      const timer = setTimeout(centerTree, 100);
      return () => clearTimeout(timer);
    }, [centerTree]);

    // Canvas center point
    const originX = contentWidth / 2;
    const originY = contentHeight / 2;

    return (
      <SafeAreaView className="flex-1 bg-[#f8f9f6]" edges={['top']}>
        <GestureDetector gesture={composedGestures}>
          <Animated.View className="flex-1 overflow-hidden">
            <Animated.View
              style={[
                {
                  width: contentWidth,
                  height: contentHeight,
                  position: 'absolute',
                  left: (width - contentWidth) / 2,
                  top: (height - contentHeight) / 2,
                },
                animatedStyle,
              ]}>
              {/* SVG Background Layer for Relationships Lines */}
              <Svg width={contentWidth} height={contentHeight} style={StyleSheet.absoluteFill}>
                {/* Descendant Links */}
                {descendantLinks.map((link, index) => {
                  const isTargetMain = link.target.data.id === 'current-user';
                  const isSourceMain = link.source.data.id === 'current-user';

                  const sourceYOffset = isSourceMain ? 150 : 110;
                  const targetYOffset = isTargetMain ? 150 : 110;

                  const source = {
                    x: originX + link.source.x + treeOffsetX,
                    y: originY + link.source.y + treeOffsetY + sourceYOffset,
                  };
                  const target = {
                    x: originX + link.target.x + treeOffsetX,
                    y: originY + link.target.y + treeOffsetY - targetYOffset,
                  };

                  const d = `M${source.x},${source.y} C${source.x},${(source.y + target.y) / 2} ${target.x},${(source.y + target.y) / 2} ${target.x},${target.y}`;

                  return (
                    <Path key={`link-${index}`} d={d} fill="none" stroke="#d3d9d6" strokeWidth="2" />
                  );
                })}

                {/* Ancestors connecting to Main Descendant */}
                {ancestorLinks.map((link, index) => {
                  // Invert Y for parents to go up
                  const source = {
                    x: originX + link.source.x + treeOffsetX,
                    y: originY - link.source.y + treeOffsetY - 110
                  };
                  const target = {
                    x: originX + link.target.x + treeOffsetX,
                    y: originY - link.target.y + treeOffsetY + 110
                  };

                  const d = `M${source.x},${source.y} C${source.x},${(source.y + target.y) / 2} ${target.x},${(source.y + target.y) / 2} ${target.x},${target.y}`;

                  return (
                    <Path key={`anc-link-${index}`} d={d} fill="none" stroke="#d3d9d6" strokeWidth="2" />
                  )
                })}
              </Svg>

              {/* DOM Foreground Layer for Cards */}
              {/* Render Descendants */}
              {descendantNodes.map((node) => {
                const { data, x, y } = node;
                const isMain = data.id === 'current-user';
                const isPlaceholder = data.role?.startsWith('ADD');
                const cardW = isPlaceholder ? SMALL_CARD_WIDTH : (isMain ? CARD_WIDTH : SMALL_CARD_WIDTH);
                const cardH = isMain ? CARD_HEIGHT + 60 : CARD_HEIGHT;

                const nodeX = originX + x + treeOffsetX;
                const nodeY = originY + y + treeOffsetY;

                return (
                  <React.Fragment key={`desc-${data.id}`}>
                    <View
                      style={{
                        position: 'absolute',
                        left: nodeX - cardW / 2,
                        top: nodeY - cardH / 2,
                        width: cardW,
                      }}>
                      <TreeMockCard
                        variant={isPlaceholder ? (data.role === 'ADD_PARENT' ? 'add-parent' : 'add-child') : (isMain ? 'main' : 'child')}
                        id={data.id}
                        name={data.name}
                        role={data.role || (isMain ? 'CURRENT USER' : '')}
                        dates={data.dates}
                        imageUrl={data.imageUrl}
                        subTitle={data.subTitle}
                        admin={data.admin}
                      />
                    </View>
                    {!isPlaceholder && (
                      <>
                        <View
                          style={{
                            position: 'absolute',
                            left: nodeX + cardW / 2,
                            top: nodeY,
                            width: 40,
                            height: 2,
                            backgroundColor: '#d3d9d6',
                          }}
                        />
                        <View
                          style={{
                            position: 'absolute',
                            left: nodeX + cardW / 2 + 40,
                            top: nodeY - CARD_HEIGHT / 2,
                            width: SMALL_CARD_WIDTH,
                          }}>
                          {data.spouse ? (
                            <TreeMockCard
                              variant="child" // Using 'child' variant for small size cards like spouses
                              id={data.spouse.id}
                              name={data.spouse.name}
                              role={data.spouse.role}
                              dates={data.spouse.dates}
                              imageUrl={data.spouse.imageUrl}
                              admin={data.spouse.admin}
                            />
                          ) : (
                            <TreeMockCard variant="add-spouse" />
                          )}
                        </View>
                      </>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Render Ancestors */}
              {ancestorNodes.map((node) => {
                const { data, x, y } = node;
                const isPlaceholder = data.role?.startsWith('ADD');
                const cardW = SMALL_CARD_WIDTH;
                const cardH = CARD_HEIGHT;

                const nodeX = originX + x + treeOffsetX;
                const nodeY = originY - y + treeOffsetY;

                return (
                  <React.Fragment key={`anc-${data.id}`}>
                    <View
                      style={{
                        position: 'absolute',
                        left: nodeX - cardW / 2,
                        top: nodeY - cardH / 2,
                        width: cardW,
                      }}>
                      <TreeMockCard
                        variant={isPlaceholder ? (data.role === 'ADD_PARENT' ? 'add-parent' : 'add-child') : 'parent'}
                        id={data.id}
                        name={data.name}
                        role={data.role}
                        dates={data.dates}
                        imageUrl={data.imageUrl}
                        admin={data.admin}
                      />
                    </View>
                    {!isPlaceholder && (
                      <>
                        <View
                          style={{
                            position: 'absolute',
                            left: nodeX + cardW / 2,
                            top: nodeY,
                            width: 40,
                            height: 2,
                            backgroundColor: '#d3d9d6',
                          }}
                        />
                        <View
                          style={{
                            position: 'absolute',
                            left: nodeX + cardW / 2 + 40,
                            top: nodeY - CARD_HEIGHT / 2,
                            width: SMALL_CARD_WIDTH,
                          }}>
                          {data.spouse ? (
                            <TreeMockCard
                              variant="parent" // Using 'parent' variant for consistency in ancestor section
                              id={data.spouse.id}
                              name={data.spouse.name}
                              role={data.spouse.role}
                              dates={data.spouse.dates}
                              imageUrl={data.spouse.imageUrl}
                              admin={data.spouse.admin}
                            />
                          ) : (
                            <TreeMockCard variant="add-spouse" />
                          )}
                        </View>
                      </>
                    )}
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
        />

        <TreeSearchButton />
      </SafeAreaView>
    );
  }
