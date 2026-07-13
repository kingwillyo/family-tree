import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Memory, fetchMemberMedia, fetchProfileById, Profile } from '../../../lib/treeService';

const { width } = Dimensions.get('window');

interface ImagePreviewModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

function ImagePreviewModal({ visible, imageUrl, onClose }: ImagePreviewModalProps) {
  if (!imageUrl) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/90">
        <TouchableOpacity
          onPress={onClose}
          className="absolute right-6 top-12 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>
        <Image source={{ uri: imageUrl }} className="h-3/4 w-full" resizeMode="contain" />
      </View>
    </Modal>
  );
}

export default function MemberGalleryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [p, m] = await Promise.all([fetchProfileById(id), fetchMemberMedia(id)]);
    setProfile(p);
    setMedia(m);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const itemSize = (width - 48 - 16) / 3;

  const renderItem = ({ item }: { item: Memory }) => {
    if (item.type === 'audio') {
      return (
        <View
          style={{ width: itemSize, height: itemSize, margin: 4 }}
          className="items-center justify-center rounded-[24px] bg-[#f0f9ed]">
          <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-white">
            <Feather name="mic" size={18} color="#059669" />
          </View>
          <Text className="text-[9px] font-bold uppercase tracking-widest text-[#059669]">
            VOICENOTE
          </Text>
        </View>
      );
    }

    const imageUrl = item.image_urls?.[0];
    if (!imageUrl) return null;

    return (
      <TouchableOpacity
        onPress={() => setPreviewImage(imageUrl)}
        activeOpacity={0.9}
        style={{ width: itemSize, height: itemSize, margin: 4 }}
        className="overflow-hidden rounded-[24px] bg-gray-200">
        <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
          <Feather name="chevron-left" size={28} color="#111827" />
        </TouchableOpacity>
        <View className="ml-2">
          <Text className="text-[20px] font-bold text-gray-900">Gallery</Text>
          {profile && (
            <Text className="text-[13px] font-medium text-gray-400">{profile.full_name}</Text>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={media}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-gray-400">No media found.</Text>
            </View>
          }
        />
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={!!previewImage}
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </SafeAreaView>
  );
}
