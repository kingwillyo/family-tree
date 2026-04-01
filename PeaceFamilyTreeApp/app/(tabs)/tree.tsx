import React, { useEffect, useMemo, useState } from 'react';
import { View, Dimensions, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { D3TreeNode } from '../../constants/mockTreeData';
import { useAuth } from '../../lib/auth-context';
import {
  fetchCurrentUserProfile,
  fetchTreeData,
  buildD3Tree,
} from '../../lib/treeService';
import LottieView from 'lottie-react-native';
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
import { Feather } from '@expo/vector-icons';

const NODE_SIZE = 76;
const NODE_SPACING_X = 320;
const NODE_SPACING_Y = 160;

type ButtonPos = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';

function getButtonPosition(
  isOldestAncestor: boolean,
  isLeafDescendant: boolean,
  isSpouse: boolean,
  hasSpouse: boolean,
  nodeX: number,
  originX: number
): ButtonPos {
  if (isOldestAncestor) return 'TOP';
  if (isLeafDescendant) return 'BOTTOM';
  if (isSpouse) return 'RIGHT';
  if (hasSpouse) return 'LEFT';
  if (nodeX < originX) return 'LEFT';
  return 'RIGHT';
}

const PersonNode = ({ data, nodeX, nodeY, onPress }: { data: any; nodeX: number; nodeY: number; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ position: 'absolute', left: nodeX - NODE_SIZE / 2, top: nodeY - NODE_SIZE / 2, width: NODE_SIZE, alignItems: 'center', zIndex: 10 }}>
    <View
      className="rounded-full bg-white items-center justify-center border-[3px]"
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderColor: data.admin ? '#FFD700' : 'white',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }}>
      {data.imageUrl ? (
        <Image source={{ uri: data.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: NODE_SIZE / 2 }} resizeMode="cover" />
      ) : (
        <Feather name="user" size={34} color="#9ca3af" />
      )}
    </View>
    <Text className="mt-2 text-[13px] font-bold text-gray-500 absolute w-32 text-center" style={{ top: NODE_SIZE }}>
      {data.name}
    </Text>
  </TouchableOpacity>
);

const PlusButton = ({ cx, cy, onPress }: { cx: number; cy: number; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ position: 'absolute', left: cx - 14, top: cy - 14, width: 28, height: 28, elevation: 4 }}
    className="items-center justify-center rounded-full bg-[#84cc16] shadow-sm z-20">
    <Feather name="plus" size={16} color="white" />
  </TouchableOpacity>
);

export default function TreeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width, height } = Dimensions.get('window');

  const [rootProfileId, setRootProfileId] = useState<string | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [rawDescendants, setRawDescendants] = useState<D3TreeNode | null>(null);
  const [rawAncestors, setRawAncestors] = useState<D3TreeNode | null>(null);

  const loadTree = React.useCallback(async () => {
    if (!user) return;
    setTreeLoading(true);
    setTreeError(null);
    try {
      const currentProfile = await fetchCurrentUserProfile(user.id);
      const rootId = currentProfile?.id ?? null;
      setRootProfileId(rootId);

      const { profiles, relationships } = await fetchTreeData();

      if (rootId) {
        const { descendants, ancestors } = buildD3Tree(profiles, relationships, rootId);
        setRawDescendants(descendants);
        setRawAncestors(ancestors);
      } else {
        setTreeError('No profile found for your account. Ask an admin to link your profile.');
      }
    } catch (e: any) {
      setTreeError(e?.message ?? 'Failed to load tree');
    } finally {
      setTreeLoading(false);
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      loadTree();
    }, [loadTree])
  );

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const minScale = 0.5;
  const maxScale = 2.0;

  const [descendantNodes, setDescendantNodes] = useState<d3.HierarchyPointNode<D3TreeNode>[]>([]);
  const [descendantLinks, setDescendantLinks] = useState<d3.HierarchyPointLink<D3TreeNode>[]>([]);
  const [ancestorNodes, setAncestorNodes] = useState<d3.HierarchyPointNode<D3TreeNode>[]>([]);
  const [ancestorLinks, setAncestorLinks] = useState<d3.HierarchyPointLink<D3TreeNode>[]>([]);

  const [treeOffsetX, setTreeOffsetX] = useState(0);
  const [treeOffsetY, setTreeOffsetY] = useState(0);

  useMemo(() => {
    if (!rawDescendants || !rawAncestors) return;

    const descRoot = d3.hierarchy(rawDescendants);
    const descTreeLayout = d3.tree<D3TreeNode>().nodeSize([NODE_SPACING_X, NODE_SPACING_Y]);
    const layout = descTreeLayout(descRoot);

    const nodes = layout.descendants();
    setDescendantNodes(nodes);
    setDescendantLinks(layout.links());

    const currentUserNode = nodes.find((n) => n.data.id === rootProfileId);
    if (currentUserNode) {
      setTreeOffsetX(-currentUserNode.x);
      setTreeOffsetY(-currentUserNode.y);
    }

    const ancRoot = d3.hierarchy(rawAncestors);
    const ancTreeLayout = d3.tree<D3TreeNode>().nodeSize([NODE_SPACING_X, NODE_SPACING_Y]);
    const ancLayout = ancTreeLayout(ancRoot);

    // Skip the root user in the ancestor tree if they are already the root of descendants
    const parents = ancLayout.descendants().filter((node) => node.depth > 0);
    setAncestorNodes(parents);
    setAncestorLinks(ancLayout.links().filter(l => l.source.depth > 0 || l.target.depth > 0));
  }, [rawDescendants, rawAncestors, rootProfileId]);

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

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const nextScale = clamp(savedScale.value * e.scale, minScale, maxScale);
      const focalX = e.focalX - width / 2;
      const focalY = e.focalY - height / 2;
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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    };
  });

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
  }, [scale, savedScale, translateX, savedTranslateX, translateY, savedTranslateY]);

  useEffect(() => {
    const timer = setTimeout(centerTree, 100);
    return () => clearTimeout(timer);
  }, [centerTree]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    const lowerQuery = query.toLowerCase();

    let found = descendantNodes.find((n) => n.data.name.toLowerCase().includes(lowerQuery));
    let isAncestor = false;

    if (!found) {
      found = ancestorNodes.find((n) => n.data.name.toLowerCase().includes(lowerQuery));
      isAncestor = !!found;
    }

    let isSpouse = false;
    let spouseHost: typeof found | undefined;
    if (!found) {
      const dHost = descendantNodes.find((n) => n.data.spouse?.name.toLowerCase().includes(lowerQuery));
      if (dHost) {
        found = dHost;
        isSpouse = true;
      }
    }

    if (!found && !spouseHost) {
      const aHost = ancestorNodes.find((n) => n.data.spouse?.name.toLowerCase().includes(lowerQuery));
      if (aHost) {
        found = aHost;
        isAncestor = true;
        isSpouse = true;
      }
    }

    if (found) {
      const nodeX = found.x + treeOffsetX + (isSpouse ? 140 : 0);
      const nodeY = (isAncestor ? -found.y : found.y) + treeOffsetY;

      scale.value = withSpring(1.0);
      savedScale.value = 1.0;
      translateX.value = withSpring(-nodeX);
      savedTranslateX.value = -nodeX;
      translateY.value = withSpring(-nodeY);
      savedTranslateY.value = -nodeY;
    }
  };

  const originX = contentWidth / 2;
  const originY = contentHeight / 2;

  if (treeLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9f6]">
        <LottieView
          source={{ uri: 'https://lottie.host/e80c1d31-b731-43b0-b47b-0db6d116b3d2/axUS3P5Rhp.lottie' }}
          autoPlay
          loop
          speed={2.0}
          style={{ width: 150, height: 150 }}
        />
      </SafeAreaView>
    );
  }

  if (treeError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9f6] px-10">
        <Text className="mb-2 text-center text-lg font-bold text-gray-800">Tree not found</Text>
        <Text className="text-center text-sm text-gray-400">{treeError}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fcf4]" edges={['top']}>
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
            <Svg width={contentWidth} height={contentHeight} style={StyleSheet.absoluteFill}>
              {descendantLinks.map((link, index) => {
                const sourceHasSpouse = !!link.source.data.spouse;
                const sourceX = originX + link.source.x + treeOffsetX + (sourceHasSpouse ? 66 : 0);
                const sourceY = originY + link.source.y + treeOffsetY + 38;

                const targetX = originX + link.target.x + treeOffsetX;
                const targetY = originY + link.target.y + treeOffsetY - 38;
                const midY = (sourceY + targetY) / 2;

                const d = `M${sourceX},${sourceY} L${sourceX},${midY} L${targetX},${midY} L${targetX},${targetY}`;
                return <Path key={`desc-link-${link.source.data.id}-${link.target.data.id}-${index}`} d={d} fill="none" stroke="#d1d5db" strokeWidth="2" />;
              })}

              {ancestorLinks.map((link, index) => {
                const sourceX = originX + link.source.x + treeOffsetX;
                const sourceY = originY - link.source.y + treeOffsetY - 38;

                const targetX = originX + link.target.x + treeOffsetX;
                const targetY = originY - link.target.y + treeOffsetY + 38;

                const midY = (sourceY + targetY) / 2;

                const d = `M${sourceX},${sourceY} L${sourceX},${midY} L${targetX},${midY} L${targetX},${targetY}`;
                return <Path key={`anc-link-${link.source.data.id}-${link.target.data.id}-${index}`} d={d} fill="none" stroke="#d1d5db" strokeWidth="2" />;
              })}
            </Svg>

            {descendantNodes.map((node) => {
              const { data, x, y } = node;
              const nodeX = originX + x + treeOffsetX;
              const nodeY = originY + y + treeOffsetY;

              const isLeaf = !node.children || node.children.length === 0;
              const pos = getButtonPosition(false, isLeaf, false, !!data.spouse, nodeX, originX);
              let bx = 0, by = 0;
              if (pos === 'TOP') by = -62;
              if (pos === 'BOTTOM') by = 86; // Ensures uniform gap between name text and button
              if (pos === 'LEFT') bx = -62;
              if (pos === 'RIGHT') bx = 62;

              return (
                <View key={`desc-${data.id}-${node.x}-${node.y}`}>
                  <PersonNode data={data} nodeX={nodeX} nodeY={nodeY} onPress={() => router.push(`/member/${data.id}`)} />
                  <PlusButton cx={nodeX + bx} cy={nodeY + by} onPress={() => router.push({ pathname: '/member/add', params: { relativeId: data.id, relativeName: data.name } })} />

                  {data.spouse && (
                    <>
                      <View style={{ position: 'absolute', left: nodeX + NODE_SIZE / 2, top: nodeY - 1, width: 56, height: 2, backgroundColor: '#d1d5db', zIndex: 1 }} />
                      <PersonNode data={data.spouse} nodeX={nodeX + 132} nodeY={nodeY} onPress={() => router.push(`/member/${data.spouse!.id}`)} />
                      <PlusButton cx={nodeX + 132 + 62} cy={nodeY} onPress={() => router.push({ pathname: '/member/add', params: { relativeId: data.spouse!.id, relativeName: data.spouse!.name } })} />
                    </>
                  )}
                </View>
              );
            })}

            {ancestorNodes.map((node) => {
              const { data, x, y } = node;
              const nodeX = originX + x + treeOffsetX;
              const nodeY = originY - y + treeOffsetY;

              const isOldest = !node.children || node.children.length === 0;
              const pos = getButtonPosition(isOldest, false, false, !!data.spouse, nodeX, originX);
              let bx = 0, by = 0;
              if (pos === 'TOP') by = -62;
              if (pos === 'BOTTOM') by = 86; 
              if (pos === 'LEFT') bx = -62;
              if (pos === 'RIGHT') bx = 62;

              return (
                <View key={`anc-${data.id}-${node.x}-${node.y}`}>
                  {/* We pass a modified data object without the spouse to avoid double rendering in the ancestor tree */}
                  <PersonNode 
                    data={{ ...data, spouse: undefined }} 
                    nodeX={nodeX} 
                    nodeY={nodeY} 
                    onPress={() => router.push(`/member/${data.id}`)} 
                  />
                  <PlusButton cx={nodeX + bx} cy={nodeY + by} onPress={() => router.push({ pathname: '/member/add', params: { relativeId: data.id, relativeName: data.name } })} />
                </View>
              );
            })}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <TreeFloatingControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenter={centerTree}
        onAddMember={() => router.push('/member/add')}
        onInvite={() => router.push('/invite')}
      />

      <TreeSearchButton onSearch={handleSearch} />
    </SafeAreaView>
  );
}
