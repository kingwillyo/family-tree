import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export interface MemoryData {
  id: string;
  type: string;
  author: {
    name: string;
    avatar?: string;
    added?: string;
    initial?: string;
  };
  content: {
    image?: string;
    date?: string;
    location?: string;
    title?: string;
    tags?: string[];
    duration?: string;
    currentTime?: string;
    excerpt?: string;
  };
}

interface MemoryCardProps {
  memory: MemoryData;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  // Array of heights for the audio visualizer mock
  const visualizerBars = [
    12, 16, 24, 18, 14, 28, 38, 33, 20, 16, 12, 22, 18, 14, 24, 20, 12, 15, 25, 18, 12,
  ];

  // CARD 1: PHOTO MEMORY
  if (memory.type === 'photo') {
    return (
      <View className="mb-6 rounded-3xl bg-white p-4">
        {/* Author Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={{ uri: memory.author.avatar }}
              className="mr-3 h-10 w-10 rounded-full bg-gray-200"
            />
            <View>
              <Text className="text-[15px] font-bold text-gray-900">{memory.author.name}</Text>
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
        <View className="mb-4 overflow-hidden rounded-2xl bg-gray-100">
          <Image
            source={{ uri: memory.content.image }}
            className="h-[220px] w-full"
            resizeMode="cover"
          />
        </View>

        {/* Post Info */}
        <View className="mb-2 flex-row items-center">
          <Feather name="calendar" size={12} color="#6b7280" />
          <Text className="ml-1.5 text-[13px] font-medium text-gray-500">{memory.content.date}</Text>
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
            <View key={idx} className="rounded-full bg-[#f0f9ed] px-3 py-1.5">
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
      <View className="mb-6 rounded-3xl bg-white p-4">
        {/* Author Header */}
        <View className="mb-4 flex-row items-center">
          <Image
            source={{ uri: memory.author.avatar }}
            className="mr-3 h-10 w-10 rounded-full bg-gray-200"
          />
          <View>
            <Text className="text-[15px] font-bold text-gray-900">{memory.author.name}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {memory.author.added}
            </Text>
          </View>
        </View>

        {/* Custom Audio Player */}
        <View className="mb-4 flex-row items-center rounded-2xl border border-[#f0f5ee] bg-[#fbfdf9] p-4">
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
            <View key={idx} className="rounded-full bg-[#f0f9ed] px-3 py-1.5">
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
      <View className="mb-6 rounded-3xl bg-white p-5">
        {/* Author Header */}
        <View className="mb-5 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#f0f9ed]">
            <Text className="text-[15px] font-bold text-[#65a30d]">{memory.author.initial}</Text>
          </View>
          <View>
            <Text className="text-[15px] font-bold text-gray-900">{memory.author.name}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {memory.author.added}
            </Text>
          </View>
        </View>

        {/* Excerpt Content */}
        <View className="mb-6 flex-row items-start pr-4">
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
                className="cursor-pointer rounded-full bg-[#f0f9ed] px-3 py-1.5 transition-colors hover:bg-green-100">
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
}
