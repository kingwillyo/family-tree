import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import MemoryCard, { MemoryData } from '../../components/MemoryCard';
import { fetchMemoriesWithProfiles, MemoryWithProfile } from '../../lib/memoryService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Map a DB memory row → MemoryCard's MemoryData shape
// ─────────────────────────────────────────────
function toMemoryData(m: MemoryWithProfile): MemoryData {
  const authorName = m.profile?.full_name ?? 'Family Member';
  const authorAvatar = m.profile?.avatar_url ?? undefined;
  const addedLabel = new Date(m.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const base = {
    id: m.id,
    type: m.type,
    author: {
      name: authorName,
      avatar: authorAvatar,
      initial: authorName.charAt(0).toUpperCase(),
      added: addedLabel.toUpperCase(),
    },
  };

  if (m.type === 'photo') {
    return {
      ...base,
      content: {
        images: m.image_urls?.length ? m.image_urls : undefined,
        title: m.title || 'Family Photo',
        location: m.location ?? undefined,
        date: addedLabel,
      },
    };
  }

  if (m.type === 'audio') {
    return {
      ...base,
      author: { ...base.author, added: 'AUDIO MEMORY' },
      content: {
        title: m.title || 'Audio Memory',
        location: m.location ?? undefined,
        date: addedLabel,
        duration: '—',
        currentTime: '0:00',
      },
    };
  }

  // story
  const storyTitle = m.title || (m.body ? (m.body.split('\n')[0].slice(0, 40) + (m.body.length > 40 ? '...' : '')) : 'Family Story');
  
  return {
    ...base,
    author: { ...base.author, added: 'WRITTEN STORY' },
    content: {
      title: storyTitle,
      excerpt: m.body ?? m.title ?? '',
      location: m.location ?? undefined,
      date: addedLabel,
    },
  };
}

export default function MemoriesScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [activeFilter, setActiveFilter] = useState('All');
  const [memories, setMemories] = useState<MemoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<MemoryData | null>(null);
  const filters = ['All', 'Photos', 'Stories', 'Audio'];

  const loadMemories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    const data = await fetchMemoriesWithProfiles();
    setMemories(data.map(toMemoryData));

    if (isRefresh) setIsRefreshing(false);
    else setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const typeMap: Record<string, string> = {
    Photos: 'photo',
    Stories: 'story',
    Audio: 'audio',
  };

  const filtered = memories.filter((m) => {
    const matchesFilter = activeFilter === 'All' || m.type === typeMap[activeFilter];
    const matchesSearch =
      !search.trim() ||
      (m.content.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.content.excerpt ?? '').toLowerCase().includes(search.toLowerCase()) ||
      m.author.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8] dark:bg-slate-950" edges={['top']}>
      {/* Detail Modal */}
      <Modal
        visible={!!selectedMemory}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedMemory(null)}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSelectedMemory(null)}
            className="absolute inset-0"
          />
          <View
            className="w-full overflow-hidden rounded-t-[32px] bg-[#fcFAF8] dark:bg-slate-950"
            style={{ maxHeight: SCREEN_HEIGHT * 0.9 }}>
            {/* Handle bar */}
            <View className="items-center pt-3">
              <View className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-slate-800" />
            </View>

            <View className="flex-row items-center justify-between bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <Text className="flex-1 text-[17px] font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                {selectedMemory?.content.title || 'Memory Detail'}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedMemory(null)}
                className="ml-4 h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                <Feather name="x" size={18} color={isDarkMode ? '#ffffff' : "#4b5563"} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="p-4">
              {selectedMemory && <MemoryCard memory={selectedMemory} isFullView={true} />}
              <View className="h-10" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
        <Text className="text-[26px] font-bold text-gray-900 dark:text-white">Memories</Text>
        <TouchableOpacity className="-mr-2 p-2">
          <Feather name="sliders" size={20} color={isDarkMode ? '#ffffff' : "#6b7280"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadMemories(true)}
            tintColor="#84cc16"
          />
        }>
        {/* Search Bar */}
        <View className="mb-4 px-6">
          <View className="flex-row items-center rounded-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search family stories..."
              placeholderTextColor="#9ca3af"
              className="ml-3 flex-1 text-[15px] font-medium text-gray-900 dark:text-white"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View className="mb-6 flex-row gap-x-2 px-6 pt-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`flex-1 items-center justify-center rounded-full py-[10px] ${isActive ? 'bg-[#84cc16]' : 'bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800'}`}>
                <Text
                  className={`text-[13px] font-bold ${isActive ? 'text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feed */}
        <View className="px-6">
          {isLoading ? (
            <View className="mt-16 items-center">
              <ActivityIndicator size="large" color="#84cc16" />
              <Text className="mt-4 text-[14px] font-medium text-gray-400 dark:text-slate-500">
                Loading memories...
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="mt-16 items-center">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#f0f9ed] dark:bg-emerald-950/20">
                <Feather name="image" size={28} color="#84cc16" />
              </View>
              <Text className="text-[18px] font-bold text-gray-800 dark:text-white">No memories yet</Text>
              <Text className="mt-2 text-center text-[14px] font-medium text-gray-400 dark:text-slate-500">
                {search
                  ? 'No memories match your search.'
                  : "Start capturing your family's precious moments."}
              </Text>
            </View>
          ) : (
            filtered.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onPress={() => setSelectedMemory(memory)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push('/create-memory')}
        className="absolute bottom-[100px] right-6 z-50 h-14 w-14 items-center justify-center rounded-full bg-[#84cc16] shadow-lg"
        style={{
          shadowColor: '#65a30d',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 6,
        }}>
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
