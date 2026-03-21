import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MemoryCard from '../../components/MemoryCard';

// Mock Data targeting the precise design from the reference image
const mockMemories = [
  {
    id: '1',
    type: 'photo',
    author: {
      name: 'Sarah Jenkins',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
      added: 'ADDED 2 DAYS AGO',
    },
    content: {
      image:
        'https://images.unsplash.com/photo-1548658826-b8ba5d164d7b?q=80&w=600&auto=format&fit=crop',
      date: 'June 1945',
      location: 'Brooklyn, NY',
      title: "Grandpa's first car after the war",
      tags: ['@Edward Jenkins Sr.'],
    },
  },
  {
    id: '2',
    type: 'audio',
    author: {
      name: 'Uncle Thomas',
      avatar:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
      added: 'AUDIO MEMORY',
    },
    content: {
      duration: '2:15',
      currentTime: '0:42',
      title: 'The Sunday Roast Tradition',
      tags: ['@Mary Jenkins', '@Thomas Jenkins Jr.'],
      location: 'London, UK',
    },
  },
  {
    id: '3',
    type: 'story',
    author: { name: 'Martha Jenkins', initial: 'MJ', added: 'WRITTEN STORY' },
    content: {
      excerpt:
        '"The lighthouse was the only thing we could see through the thick fog that night in 1952. Father held my hand so tight, his knuckles were white..."',
      tags: ['@George Jenkins'],
    },
  },
];

export default function MemoriesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Photos', 'Stories', 'Audio'];

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
        <Text className="text-[26px] font-bold text-gray-900">Memories</Text>
        <TouchableOpacity className="-mr-2 p-2">
          <Feather name="sliders" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Search Bar */}
        <View className="mb-4 px-6">
          <View className="flex-row items-center rounded-full border border-gray-200 bg-white px-4 py-3">
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput
              placeholder="Search family stories..."
              placeholderTextColor="#9ca3af"
              className="ml-3 flex-1 text-[15px] font-medium text-gray-900"
            />
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
                className={`flex-1 items-center justify-center rounded-full py-[10px] ${isActive ? 'bg-[#84cc16]' : 'bg-white'}`}>
                <Text
                  className={`text-[13px] font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feed */}
        <View className="px-6">
          {mockMemories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory as any} />
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push('/create-memory')}
        className="absolute bottom-[100px] right-6 z-50 h-14 w-14 items-center justify-center rounded-full bg-[#84cc16] shadow-lg shadow-green-600/30"
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
