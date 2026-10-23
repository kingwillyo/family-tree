import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { OptimizedImage as Image } from '../../../components/OptimizedImage';
import { GalleryPhoto, GalleryViewer } from '../../../components/GalleryViewer';

import { Memory, fetchMemberMedia, fetchProfileById, Profile } from '../../../lib/treeService';
import { useAuth } from '../../../lib/auth-context';
import { useColorScheme } from 'nativewind';

type GridItem =
  | { id: string; type: 'audio'; memory: Memory }
  | { id: string; type: 'photo'; memory: Memory; photo: GalleryPhoto; photoIndex: number };

export default function MemberGalleryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [p, m] = await Promise.all([fetchProfileById(id), fetchMemberMedia(id)]);
    setProfile(p);
    setMedia(m);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const { photos, gridItems } = useMemo(() => {
    const nextPhotos: GalleryPhoto[] = [];
    const nextGridItems: GridItem[] = [];

    media.forEach((memory) => {
      if (memory.type === 'audio') {
        nextGridItems.push({ id: `audio-${memory.id}`, type: 'audio', memory });
        return;
      }

      memory.image_urls?.forEach((uri, imageIndex) => {
        if (!uri) return;

        const photo: GalleryPhoto = {
          id: `${memory.id}-${imageIndex}`,
          uri,
          title: memory.title,
          location: memory.location,
          createdAt: memory.created_at,
          canEdit: memory.created_by === user?.id,
        };
        const photoIndex = nextPhotos.length;
        nextPhotos.push(photo);
        nextGridItems.push({
          id: `photo-${photo.id}`,
          type: 'photo',
          memory,
          photo,
          photoIndex,
        });
      });
    });

    return { photos: nextPhotos, gridItems: nextGridItems };
  }, [media, user?.id]);

  const itemSize = (width - 48 - 16) / 3;

  const renderItem = ({ item }: { item: GridItem }) => {
    if (item.type === 'audio') {
      return (
        <View
          style={{ width: itemSize, height: itemSize, margin: 4 }}
          className="items-center justify-center rounded-[24px] bg-[#f0f9ed] dark:bg-slate-800">
          <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-700">
            <Feather name="mic" size={18} color={isDarkMode ? '#6ee7b7' : '#059669'} />
          </View>
          <Text className="text-[9px] font-bold uppercase tracking-widest text-[#059669] dark:text-emerald-300">
            VOICENOTE
          </Text>
        </View>
      );
    }

    return (
      <View
        style={{ width: itemSize, height: itemSize, margin: 4 }}
        className="overflow-hidden rounded-[24px] bg-gray-200 dark:bg-slate-800">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Open photo ${item.photoIndex + 1} of ${photos.length}`}
          onPress={() => {
            setViewerIndex(item.photoIndex);
            setViewerVisible(true);
          }}
          activeOpacity={0.9}
          className="h-full w-full">
          <Image source={{ uri: item.photo.uri }} className="h-full w-full" contentFit="cover" />
        </TouchableOpacity>
        {item.photo.canEdit ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Edit memory"
            onPress={() => router.push(`/memory/edit/${item.memory.id}` as any)}
            className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60">
            <Feather name="edit-2" size={14} color="white" />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8] dark:bg-slate-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
          <Feather name="chevron-left" size={28} color={isDarkMode ? '#e2e8f0' : '#111827'} />
        </TouchableOpacity>
        <View className="ml-2">
          <Text className="text-[20px] font-bold text-gray-900 dark:text-white">Gallery</Text>
          {profile && (
            <Text className="text-[13px] font-medium text-gray-400 dark:text-slate-400">
              {profile.full_name}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={gridItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          initialNumToRender={12}
          maxToRenderPerBatch={9}
          windowSize={5}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-gray-400 dark:text-slate-500">No media found.</Text>
            </View>
          }
        />
      )}

      <GalleryViewer
        visible={viewerVisible}
        photos={photos}
        initialIndex={viewerIndex}
        ownerName={profile?.full_name}
        onClose={() => setViewerVisible(false)}
        onEdit={(photo) => {
          const selectedItem = gridItems.find(
            (item) => item.type === 'photo' && item.photo.id === photo.id
          );
          if (!selectedItem || selectedItem.type !== 'photo') return;
          setViewerVisible(false);
          router.push(`/memory/edit/${selectedItem.memory.id}` as any);
        }}
      />
    </SafeAreaView>
  );
}
