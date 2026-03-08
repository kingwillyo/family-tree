import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

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
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Photos', 'Stories', 'Audio'];

  // Array of heights for the audio visualizer mock
  const visualizerBars = [
    12, 16, 24, 18, 14, 28, 38, 33, 20, 16, 12, 22, 18, 14, 24, 20, 12, 15, 25, 18, 12,
  ];

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
          <View className="flex-row items-center rounded-[12px] border border-gray-200 bg-white px-4 py-3">
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
          {mockMemories.map((memory) => {
            // CARD 1: PHOTO MEMORY
            if (memory.type === 'photo') {
              return (
                <View key={memory.id} className="mb-6 rounded-[24px] bg-white p-4">
                  {/* Author Header */}
                  <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: memory.author.avatar }}
                        className="mr-3 h-10 w-10 rounded-full bg-gray-200"
                      />
                      <View>
                        <Text className="text-[15px] font-bold text-gray-900">
                          {memory.author.name}
                        </Text>
                        <Text className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {memory.author.added}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity>
                      <Feather name="more-horizontal" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>

                  {/* Image Content */}
                  <View className="mb-4 overflow-hidden rounded-[16px] bg-gray-100">
                    <Image
                      source={{ uri: memory.content.image }}
                      className="h-[220px] w-full"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Post Info */}
                  <View className="mb-2 flex-row items-center">
                    <Feather name="calendar" size={12} color="#6b7280" />
                    <Text className="ml-1.5 text-[13px] font-medium text-gray-500">
                      {memory.content.date}
                    </Text>
                    <Text className="mx-2 text-[13px] text-gray-400">•</Text>
                    <Feather name="map-pin" size={12} color="#6b7280" />
                    <Text className="ml-1.5 text-[13px] font-medium text-gray-500">
                      {memory.content.location}
                    </Text>
                  </View>

                  <Text className="mb-3 text-[18px] font-bold leading-6 text-gray-900">
                    {memory.content.title}
                  </Text>

                  {/* Tags */}
                  <View className="flex-row flex-wrap gap-2">
                    {memory.content.tags?.map((tag, idx) => (
                      <View key={idx} className="rounded-md bg-[#f0f9ed] px-3 py-1.5">
                        <Text className="text-[12px] font-bold text-[#65a30d]">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            }

            // CARD 2: AUDIO MEMORY
            if (memory.type === 'audio') {
              return (
                <View key={memory.id} className="mb-6 rounded-[24px] bg-white p-4">
                  {/* Author Header */}
                  <View className="mb-4 flex-row items-center">
                    <Image
                      source={{ uri: memory.author.avatar }}
                      className="mr-3 h-10 w-10 rounded-full bg-gray-200"
                    />
                    <View>
                      <Text className="text-[15px] font-bold text-gray-900">
                        {memory.author.name}
                      </Text>
                      <Text className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {memory.author.added}
                      </Text>
                    </View>
                  </View>

                  {/* Custom Audio Player */}
                  <View className="mb-4 flex-row items-center rounded-[16px] border border-[#f0f5ee] bg-[#fbfdf9] p-4">
                    {/* Play Button */}
                    <TouchableOpacity className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-[#84cc16]">
                      <Ionicons name="play" size={22} color="white" style={{ marginLeft: 3 }} />
                    </TouchableOpacity>

                    {/* Visualizer & Times */}
                    <View className="flex-1">
                      <View className="mb-2 h-[40px] flex-row items-end gap-1 px-1">
                        {visualizerBars.map((h, i) => {
                          // Make the first 6 bars colored green, the rest gray
                          const isActive = i < 6;
                          return (
                            <View
                              key={i}
                              style={{ height: h }}
                              className={`w-[4px] rounded-full ${isActive ? 'bg-[#84cc16]' : 'bg-[#e5e7eb]'}`}
                            />
                          );
                        })}
                      </View>
                      <View className="w-[90%] flex-row justify-between">
                        <Text className="text-[10px] font-bold text-gray-500">
                          {memory.content.currentTime}
                        </Text>
                        <Text className="text-[10px] font-bold text-gray-400">
                          {memory.content.duration}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text className="mb-3 text-[18px] font-bold leading-6 text-gray-900">
                    {memory.content.title}
                  </Text>

                  {/* Tags */}
                  <View className="mb-3 flex-row flex-wrap gap-2">
                    {memory.content.tags?.map((tag, idx) => (
                      <View key={idx} className="rounded-md bg-[#f0f9ed] px-3 py-1.5">
                        <Text className="text-[12px] font-bold text-[#65a30d]">{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row items-center">
                    <Feather name="map-pin" size={12} color="#6b7280" />
                    <Text className="ml-1.5 text-[13px] font-medium text-gray-500">
                      {memory.content.location}
                    </Text>
                  </View>
                </View>
              );
            }

            // CARD 3: WRITTEN STORY MEMORY
            if (memory.type === 'story') {
              return (
                <View key={memory.id} className="mb-6 rounded-[24px] bg-white p-5">
                  {/* Author Header */}
                  <View className="mb-5 flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#f0f9ed]">
                      <Text className="text-[15px] font-bold text-[#65a30d]">
                        {memory.author.initial}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[15px] font-bold text-gray-900">
                        {memory.author.name}
                      </Text>
                      <Text className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {memory.author.added}
                      </Text>
                    </View>
                  </View>

                  {/* Excerpt Content */}
                  <View className="mb-6 flex-row items-start pr-4">
                    {/* Stylized Quotation Marks */}
                    <Text className="mr-2 font-serif text-[42px] font-black leading-[42px] text-[#dcfce7]">
                      &quot;
                    </Text>
                    <Text className="pt-2 text-[16px] font-medium italic leading-7 text-gray-700">
                      {memory.content.excerpt}
                    </Text>
                  </View>

                  {/* Footer Row */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row flex-wrap gap-2">
                      {memory.content.tags?.map((tag, idx) => (
                        <View
                          key={idx}
                          className="cursor-pointer rounded-md bg-[#f0f9ed] px-3 py-1.5 transition-colors hover:bg-green-100">
                          <Text className="text-[12px] font-bold text-[#65a30d]">{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity>
                      <Text className="text-[14px] font-bold text-[#84cc16]">Read more</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return null;
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
