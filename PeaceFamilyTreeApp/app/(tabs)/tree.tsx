import React, { useEffect, useMemo, useState } from 'react';
import { View, Dimensions, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { D3TreeNode } from '../../constants/mockTreeData';
import { useAuth } from '../../lib/auth-context';
import { fetchCurrentUserProfile, fetchTreeData, buildD3Tree } from '../../lib/treeService';
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

const PersonNode = ({
  data,
  nodeX,
  nodeY,
  onPress,
  isDarkMode,
}: {
  data: any;
  nodeX: number;
  nodeY: number;
  onPress: () => void;
  isDarkMode: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      position: 'absolute',
      left: nodeX - NODE_SIZE / 2,
      top: nodeY - NODE_SIZE / 2,
      width: NODE_SIZE,
      alignItems: 'center',
      zIndex: 10,
    }}>
    <View
      className="items-center justify-center rounded-full border-[3px] bg-white dark:bg-slate-900"
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderColor: data.admin ? '#FFD700' : isDarkMode ? '#1e293b' : 'white',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }}>
      {data.imageUrl ? (
        <Image
          source={{ uri: data.imageUrl }}
          style={{ width: '100%', height: '100%', borderRadius: NODE_SIZE / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Feather name="user" size={34} color={isDarkMode ? '#475569' : '#9ca3af'} />
      )}
    </View>
    <Text
      className="absolute mt-2 w-32 text-center text-[13px] font-bold text-gray-500 dark:text-slate-400"
      style={{ top: NODE_SIZE }}>
      {data.name}
    </Text>
  </TouchableOpacity>
);

const PlusButton = ({ cx, cy, onPress }: { cx: number; cy: number; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      position: 'absolute',
      left: cx - 14,
      top: cy - 14,
      width: 28,
      height: 28,
      elevation: 4,
    }}
    className="z-20 items-center justify-center rounded-full bg-[#84cc16] shadow-sm">
    <Feather name="plus" size={16} color="white" />
  </TouchableOpacity>
);

export default function TreeScreen() {
  const router = useRouter();
  const { user, familyId } = useAuth();
  const { width, height } = Dimensions.get('window');
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [rootProfileId, setRootProfileId] = useState<string | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [treeRoot, setTreeRoot] = useState<D3TreeNode | null>(null);
  const [extraLinks, setExtraLinks] = useState<{ sourceId: string; targetId: string }[]>([]);

  const loadTree = React.useCallback(async () => {
    if (!user) return;
    setTreeLoading(true);
    setTreeError(null);
    try {
      const currentProfile = await fetchCurrentUserProfile(user.id);
      const rootId = currentProfile?.id ?? null;
      setRootProfileId(rootId);

      if (!familyId) {
        setTreeError('You must finalize your profile setup to view your tree.');
        setTreeLoading(false);
        return;
      }

      const { profiles, relationships } = await fetchTreeData(familyId);

      if (rootId) {
        const { tree, extraLinks } = buildD3Tree(profiles, relationships, rootId);
        setTreeRoot(tree);
        setExtraLinks(extraLinks);
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

  const [treeNodes, setTreeNodes] = useState<d3.HierarchyPointNode<D3TreeNode>[]>([]);
  const [treeLinks, setTreeLinks] = useState<d3.HierarchyPointLink<D3TreeNode>[]>([]);

  const [treeOffsetX, setTreeOffsetX] = useState(0);
  const [treeOffsetY, setTreeOffsetY] = useState(0);

  useMemo(() => {
    if (!treeRoot) return;

    const root = d3.hierarchy(treeRoot);
    const treeLayout = d3.tree<D3TreeNode>().nodeSize([NODE_SPACING_X, NODE_SPACING_Y]);
    const layout = treeLayout(root);

    const nodes = layout.descendants().filter((n) => n.data.id !== 'VIRTUAL_ROOT');
    const links = layout.links().filter((l) => l.source.data.id !== 'VIRTUAL_ROOT');

    setTreeNodes(nodes);
    setTreeLinks(links);

    const currentUserNode = nodes.find((n) => n.data.id === rootProfileId);
    if (currentUserNode) {
      setTreeOffsetX(-currentUserNode.x);
      setTreeOffsetY(-currentUserNode.y);
    }
  }, [treeRoot, rootProfileId]);

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
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
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

    let found = treeNodes.find((n) => n.data.name.toLowerCase().includes(lowerQuery));

    let isSpouse = false;
    if (!found) {
      const dHost = treeNodes.find((n) => n.data.spouse?.name.toLowerCase().includes(lowerQuery));
      if (dHost) {
        found = dHost;
        isSpouse = true;
      }
    }

    if (found) {
      const nodeX = found.x + treeOffsetX + (isSpouse ? 140 : 0);
      const nodeY = found.y + treeOffsetY;

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
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9f6] dark:bg-slate-950">
        <LottieView
          source={{
            uri: 'https://lottie.host/e80c1d31-b731-43b0-b47b-0db6d116b3d2/axUS3P5Rhp.lottie',
          }}
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
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9f6] px-10 dark:bg-slate-950">
        <Text className="mb-2 text-center text-lg font-bold text-gray-800 dark:text-white">
          Tree not found
        </Text>
        <Text className="text-center text-sm text-gray-400 dark:text-slate-500">{treeError}</Text>
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
                width: contentWidth,
                height: contentHeight,
                position: 'absolute',
                left: (width - contentWidth) / 2,
                top: (height - contentHeight) / 2,
              },
              animatedStyle,
            ]}>
            <Svg width={contentWidth} height={contentHeight} style={StyleSheet.absoluteFill}>
              {treeLinks.map((link, index) => {
                const sourceHasSpouse = !!link.source.data.spouse;
                const sourceX = originX + link.source.x + treeOffsetX + (sourceHasSpouse ? 66 : 0);
                const sourceY = originY + link.source.y + treeOffsetY + 38;

                const targetX = originX + link.target.x + treeOffsetX;
                const targetY = originY + link.target.y + treeOffsetY - 38;
                const midY = (sourceY + targetY) / 2;

                const d = `M${sourceX},${sourceY} L${sourceX},${midY} L${targetX},${midY} L${targetX},${targetY}`;
                return (
                  <Path
                    key={`tree-link-${link.source.data.id}-${link.target.data.id}-${index}`}
                    d={d}
                    fill="none"
                    stroke={isDarkMode ? '#1e293b' : '#d1d5db'}
                    strokeWidth="2"
                  />
                );
              })}

              {extraLinks.map((link, index) => {
                const sourceNode = treeNodes.find((n) => n.data.id === link.sourceId);
                const targetHostNode = treeNodes.find((n) => n.data.spouse?.id === link.targetId);

                if (!sourceNode || !targetHostNode) return null;

                const sourceHasSpouse = !!sourceNode.data.spouse;
                const sourceX = originX + sourceNode.x + treeOffsetX + (sourceHasSpouse ? 66 : 0);
                const sourceY = originY + sourceNode.y + treeOffsetY + 38;

                const targetX = originX + targetHostNode.x + treeOffsetX + 132;
                const targetY = originY + targetHostNode.y + treeOffsetY - 38;
                const midY = (sourceY + targetY) / 2;

                const d = `M${sourceX},${sourceY} L${sourceX},${midY} L${targetX},${midY} L${targetX},${targetY}`;
                return (
                  <Path
                    key={`extra-link-${index}`}
                    d={d}
                    fill="none"
                    stroke={isDarkMode ? '#1e293b' : '#d1d5db'}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </Svg>

            {treeNodes.map((node) => {
              const { data, x, y } = node;
              const nodeX = originX + x + treeOffsetX;
              const nodeY = originY + y + treeOffsetY;

              const isLeaf = !node.children || node.children.length === 0;
              const isOldest = node.parent?.data.id === 'VIRTUAL_ROOT' || !node.parent;
              const pos = getButtonPosition(isOldest, isLeaf, false, !!data.spouse, nodeX, originX);
              let bx = 0,
                by = 0;
              if (pos === 'TOP') by = -62;
              if (pos === 'BOTTOM') by = 86; // Ensures uniform gap between name text and button
              if (pos === 'LEFT') bx = -62;
              if (pos === 'RIGHT') bx = 62;

              return (
                <View key={`tree-${data.id}-${node.x}-${node.y}`}>
                  <PersonNode
                    data={data}
                    nodeX={nodeX}
                    nodeY={nodeY}
                    onPress={() => router.push(`/member/${data.id}`)}
                    isDarkMode={isDarkMode}
                  />
                  <PlusButton
                    cx={nodeX + bx}
                    cy={nodeY + by}
                    onPress={() =>
                      router.push({
                        pathname: '/member/add',
                        params: { relativeId: data.id, relativeName: data.name },
                      })
                    }
                  />

                  {data.spouse && (
                    <>
                      <View
                        style={{
                          position: 'absolute',
                          left: nodeX + NODE_SIZE / 2,
                          top: nodeY - 1,
                          width: 56,
                          height: 2,
                          backgroundColor: isDarkMode ? '#1e293b' : '#d1d5db',
                          zIndex: 1,
                        }}
                      />
                      <PersonNode
                        data={data.spouse}
                        nodeX={nodeX + 132}
                        nodeY={nodeY}
                        onPress={() => router.push(`/member/${data.spouse!.id}`)}
                        isDarkMode={isDarkMode}
                      />
                      <PlusButton
                        cx={nodeX + 132 + 62}
                        cy={nodeY}
                        onPress={() =>
                          router.push({
                            pathname: '/member/add',
                            params: {
                              relativeId: data.spouse!.id,
                              relativeName: data.spouse!.name,
                            },
                          })
                        }
                      />
                    </>
                  )}
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
        onInvite={() => router.push('/invite')}
      />

      <TreeSearchButton onSearch={handleSearch} />
    </SafeAreaView>
  );
}
