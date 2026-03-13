import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock Data
const mockProfile = {
  name: 'Edward Jenkins Sr.',
  dates: '1942 — 2021',
  avatar:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Golde33443.jpg/640px-Golde33443.jpg', // placeholder
  badges: ['PATRIARCH', '54 CONNECTIONS'],
  stats: [
    { label: 'MEMORIES', value: '128' },
    { label: 'EVENTS', value: '14' },
    { label: 'CHILDREN', value: '8' },
  ],
  timeline: [
    {
      id: '1',
      icon: 'droplet',
      year: '1942',
      title: 'Born in Manchester, UK',
      date: 'SEPTEMBER 12',
      description:
        'The third son of Martha and William Jenkins. Born during the height of the autumn harvest.',
    },
    {
      id: '2',
      icon: 'heart',
      year: '1968',
      title: 'Married Alice Thorne',
      date: 'JUNE 20 • LONDON',
      description:
        "A small ceremony at St. Mary's Cathedral followed by a reception in the family garden.",
    },
    {
      id: '3',
      icon: 'corner-up-right',
      year: '1974',
      title: 'Relocated to New York',
      date: 'AUGUST 15',
      description: '',
    },
  ],
  gallery: [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1555431189-0fabf2667795?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }, // old couple
    { type: 'voice', url: '' },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }, // old landscape
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }, // manuscript
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1501167733279-4bc7856d56ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }, // pocket watch
  ],
  connections: [
    { name: 'Alice', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Edward Jr.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { name: 'Sarah', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  ],
};

export default function MemberProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
          <Feather name="chevron-left" size={28} color="#111827" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity>
            <Feather name="share" size={24} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Feather name="more-horizontal" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <View className="mt-2 items-center px-4">
          {/* Avatar Area */}
          <View className="relative mb-6">
            <View className="h-[140px] w-[140px] overflow-hidden rounded-full border-4 border-[#fcFAF8] bg-orange-100">
              <Image
                source={{ uri: mockProfile.avatar }}
                className="h-full w-full"
                style={{ backgroundColor: '#eccdae' }}
              />
            </View>
            <TouchableOpacity 
              onPress={() => router.push(`/member/edit/${id}`)}
              activeOpacity={0.7}
              className="absolute -bottom-1 -right-1 h-12 w-12 items-center justify-center rounded-full border-4 border-[#fcFAF8] bg-[#8cc63f]">
              <Feather name="edit-2" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Name & Dates */}
          <Text className="mb-2 px-8 text-center text-[32px] font-extrabold leading-[38px] text-[#111827]">
            {mockProfile.name}
          </Text>
          <Text className="mb-6 text-[17px] font-medium text-gray-400">{mockProfile.dates}</Text>

          {/* Role Badges */}
          <View className="mb-8 flex-row items-center justify-center gap-3">
            {mockProfile.badges.map((badge, idx) => (
              <View key={idx} className="rounded-full border border-gray-100 bg-white px-4 py-2">
                <Text className="text-[11px] font-bold tracking-widest text-gray-500">{badge}</Text>
              </View>
            ))}
          </View>

          {/* Stats Row */}
          <View className="mb-10 w-full flex-row justify-center gap-3 px-6">
            {mockProfile.stats.map((stat, idx) => (
              <View
                key={idx}
                className="flex-[0.33] items-center rounded-[28px] border border-gray-100 bg-white py-4">
                <Text className="mb-1 text-2xl font-bold text-gray-900">{stat.value}</Text>
                <Text className="text-[9px] font-bold tracking-wider text-gray-400">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Life Timeline Section */}
        <View className="mb-12 px-6">
          <View className="mb-8 flex-row items-center justify-between">
            <Text className="text-[22px] font-bold text-gray-900">Life Timeline</Text>
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-[#f0f9ed]">
              <Feather name="plus" size={20} color="#059669" />
            </TouchableOpacity>
          </View>

          <View className="pl-[20px]">
            {mockProfile.timeline.map((item, index) => {
              const isLast = index === mockProfile.timeline.length - 1;
              return (
                <View key={item.id} className="relative mb-6">
                  {/* Vertical Line */}
                  {!isLast && (
                    <View className="absolute bottom-[-40px] left-[3px] top-[40px] w-[2px] bg-gray-200" />
                  )}

                  {/* Timeline Node Icon */}
                  <View className="absolute left-[-20px] top-6 z-10 h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white">
                    <Feather
                      name={(item.icon as any) || 'circle'}
                      size={16}
                      color={index === 0 ? '#059669' : '#d1d5db'}
                    />
                  </View>

                  {/* Content Card */}
                  <View className="ml-[36px] rounded-[24px] border border-gray-100 bg-white p-5">
                    <View className="mb-1 flex-row items-start justify-between">
                      <Text className="flex-1 pr-2 text-[17px] font-bold text-gray-900">
                        {item.title}
                      </Text>
                      <Text className="text-[13px] font-semibold text-gray-300">{item.year}</Text>
                    </View>
                    <Text className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#059669]">
                      {item.date}
                    </Text>
                    {item.description ? (
                      <Text className="text-[15px] leading-[22px] text-gray-500">
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Media Gallery Section */}
        <View className="mb-12 px-6">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-[22px] font-bold text-gray-900">Media Gallery</Text>
            <Text className="text-[12px] font-bold uppercase tracking-wider text-[#059669]">
              VIEW ALL
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-4">
            {mockProfile.gallery.map((media, idx) => {
              const itemSize = (width - 48 - 16) / 3; // roughly 3 columns
              if (media.type === 'voice') {
                return (
                  <View
                    key={idx}
                    style={{ width: itemSize, height: itemSize }}
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

              return (
                <View
                  key={idx}
                  style={{ width: itemSize, height: itemSize }}
                  className="overflow-hidden rounded-[24px] bg-gray-200">
                  <Image source={{ uri: media.url }} className="h-full w-full" resizeMode="cover" />
                </View>
              );
            })}

            {/* Add Card */}
            <TouchableOpacity
              style={{ width: (width - 48 - 16) / 3, height: (width - 48 - 16) / 3 }}
              className="items-center justify-center rounded-[24px] border-2 border-dashed border-gray-200">
              <Feather name="plus" size={24} color="#d1d5db" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Connections Section */}
        <View className="overflow-visible px-6">
          <Text className="mb-6 text-[22px] font-bold text-gray-900">Family Connections</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 overflow-visible px-6">
            {mockProfile.connections.map((conn, idx) => (
              <View key={idx} className="mr-6 items-center">
                <View className="mb-3 h-[80px] w-[80px] overflow-hidden rounded-full border-[3px] border-white bg-white">
                  <Image source={{ uri: conn.avatar }} className="h-full w-full" />
                </View>
                <Text className="text-[14px] font-bold text-gray-900">{conn.name}</Text>
              </View>
            ))}

            {/* Add Connection */}
            <View className="mr-6 items-center">
              <TouchableOpacity className="mb-3 h-[80px] w-[80px] items-center justify-center rounded-full border-2 border-dashed border-gray-300">
                <Text className="font-bold text-gray-300">+</Text>
              </TouchableOpacity>
              <Text className="text-[14px] font-bold text-gray-300">Add</Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
