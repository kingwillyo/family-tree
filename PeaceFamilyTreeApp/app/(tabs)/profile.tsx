import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../../components/Button';

const { width } = Dimensions.get('window');

// Mock Data targeting the precise design from the reference image
const mockProfile = {
  name: 'Edward Jenkins Sr.',
  dates: '1942 \u2013 2021',
  avatar:
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop', // placeholder
  badge: 'Beloved Patriarch',
  stats: [
    { label: 'MEMORIES', value: '24' },
    { label: 'EVENTS', value: '12' },
    { label: 'CHILDREN', value: '4' },
  ],
  timeline: [
    {
      id: '1',
      icon: 'file-text',
      year: '1942',
      title: 'Born in Manchester',
      date: 'June 12, 1942',
      description: "St. Mary's Hospital, United Kingdom.",
    },
    {
      id: '2',
      icon: 'heart',
      year: '1965',
      title: 'Married Alice Thorne',
      date: 'August 24, 1965',
      description: 'A beautiful ceremony at the village chapel.',
    },
    {
      id: '3',
      icon: 'navigation',
      year: '1972',
      title: 'Relocated to New York',
      date: 'May 10, 1972',
      description: 'Pursued a career in architecture in the United States.',
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
};

export default function TabProfileScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <View className="mt-4 items-center px-4">
          {/* Avatar Area */}
          <View className="relative mb-4">
            <View className="h-[140px] w-[140px] overflow-hidden rounded-full border-4 border-white bg-gray-200">
              <Image source={{ uri: mockProfile.avatar }} className="h-full w-full" />
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/member/edit/current-user')}
              className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full border-4 border-[#fcFAF8] bg-[#32CD32]">
              <Feather name="edit-2" size={14} color="white" />
            </TouchableOpacity>
          </View>

          {/* Name & Dates */}
          <Text className="mb-1 text-center text-[28px] font-extrabold text-[#111827]">
            {mockProfile.name}
          </Text>
          <Text className="mb-3 text-[15px] font-medium text-[#6b7280]">{mockProfile.dates}</Text>

          {/* Role Badge */}
          <View className="mb-8 rounded-full bg-[#ebf5ef] px-4 py-1.5">
            <Text className="text-[13px] font-bold text-[#458c61]">{mockProfile.badge}</Text>
          </View>

          {/* Stats Row */}
          <View className="mb-10 w-full flex-row justify-center gap-3 px-4">
            {mockProfile.stats.map((stat, idx) => (
              <View
                key={idx}
                className="flex-[0.33] items-center rounded-[16px] border border-gray-100 bg-white py-4">
                <Text className="mb-1 text-[22px] font-bold text-gray-900">{stat.value}</Text>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-[#8ba592]">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Life Timeline Section */}
        <View className="mb-12 px-6">
          <View className="mb-8 flex-row items-center justify-between">
            <Text className="text-[20px] font-bold text-gray-900">Life Timeline</Text>
            <TouchableOpacity className="flex-row items-center gap-1">
              <View className="h-5 w-5 items-center justify-center rounded-full bg-[#32CD32]/20">
                <Feather name="plus" size={12} color="#32CD32" />
              </View>
              <Text className="text-[14px] font-bold text-[#32CD32]">Add Event</Text>
            </TouchableOpacity>
          </View>

          <View className="pl-[20px]">
            {mockProfile.timeline.map((item, index) => {
              const isLast = index === mockProfile.timeline.length - 1;
              return (
                <View key={item.id} className="relative mb-8">
                  {/* Vertical Line */}
                  {!isLast && (
                    <View className="absolute bottom-[-40px] left-[8px] top-[30px] w-[1px] bg-[#d3d9d6]" />
                  )}

                  {/* Timeline Node Icon (Solid Green, Gray, Grayish Green based on index) */}
                  <View
                    className="absolute left-[-10px] top-1 z-10 h-[20px] w-[20px] items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        index === 0 ? '#32cd32' : index === 1 ? '#d6e0db' : '#cfd9d4',
                    }}>
                    <Feather
                      name={(item.icon as any) || 'circle'}
                      size={10}
                      color={index === 0 ? 'white' : index === 1 ? '#707371' : '#707371'}
                    />
                  </View>

                  {/* Content Container */}
                  <View className="ml-[28px]">
                    <Text className="mb-[2px] text-[12px] font-bold text-[#5e826b]">
                      {item.date}
                    </Text>
                    <Text className="mb-1 text-[16px] font-bold text-gray-900">{item.title}</Text>
                    {item.description ? (
                      <Text className="text-[14px] font-medium leading-[20px] text-[#7d8c82]">
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
            <Text className="text-[20px] font-bold text-gray-900">Media Gallery</Text>
            <Text className="text-[12px] font-bold uppercase tracking-wider text-[#6366f1]">
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
                    className="items-center justify-center rounded-[24px] bg-[#f0efff]">
                    <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-white">
                      <Feather name="mic" size={18} color="#6366f1" />
                    </View>
                    <Text className="text-[9px] font-bold uppercase tracking-widest text-[#6366f1]">
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

        {/* Sign Out Button */}
        <View className="mb-4 mt-2 px-6">
          <Button
            title="Sign Out"
            onPress={signOut}
            variant="danger-light"
            icon="log-out"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
