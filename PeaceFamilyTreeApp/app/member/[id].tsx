import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock Data
const mockProfile = {
  name: "Edward Jenkins Sr.",
  dates: "1942 — 2021",
  avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Golde33443.jpg/640px-Golde33443.jpg", // placeholder
  badges: ["PATRIARCH", "54 CONNECTIONS"],
  stats: [
    { label: "MEMORIES", value: "128" },
    { label: "EVENTS", value: "14" },
    { label: "CHILDREN", value: "8" },
  ],
  timeline: [
    {
      id: "1",
      icon: "droplet",
      year: "1942",
      title: "Born in Manchester, UK",
      date: "SEPTEMBER 12",
      description: "The third son of Martha and William Jenkins. Born during the height of the autumn harvest.",
    },
    {
      id: "2",
      icon: "heart",
      year: "1968",
      title: "Married Alice Thorne",
      date: "JUNE 20 • LONDON",
      description: "A small ceremony at St. Mary's Cathedral followed by a reception in the family garden.",
    },
    {
      id: "3",
      icon: "corner-up-right",
      year: "1974",
      title: "Relocated to New York",
      date: "AUGUST 15",
      description: "",
    }
  ],
  gallery: [
    { type: 'image', url: 'https://images.unsplash.com/photo-1555431189-0fabf2667795?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' }, // old couple
    { type: 'voice', url: '' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' }, // old landscape
    { type: 'image', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' }, // manuscript
    { type: 'image', url: 'https://images.unsplash.com/photo-1501167733279-4bc7856d56ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' }, // pocket watch
  ],
  connections: [
    { name: "Alice", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Edward Jr.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Sarah", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
  ]
};

export default function MemberProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8]">
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Hero Section */}
        <View className="items-center px-4 mt-2">
          {/* Avatar Area */}
          <View className="relative mb-6">
            <View className="h-[140px] w-[140px] rounded-full overflow-hidden bg-orange-100 border-4 border-[#fcFAF8] shadow-sm">
                <Image 
                  source={{ uri: mockProfile.avatar }}
                  className="w-full h-full"
                  style={{ backgroundColor: '#eccdae' }} 
                />
            </View>
            <TouchableOpacity className="absolute bottom-0 right-1 bg-white h-9 w-9 rounded-full items-center justify-center shadow-sm border border-gray-100">
              <Feather name="edit-2" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* Name & Dates */}
          <Text className="text-[32px] font-extrabold text-[#111827] text-center leading-[38px] mb-2 px-8">
            {mockProfile.name}
          </Text>
          <Text className="text-[17px] font-medium text-gray-400 mb-6">
            {mockProfile.dates}
          </Text>

          {/* Role Badges */}
          <View className="flex-row items-center justify-center gap-3 mb-8">
            {mockProfile.badges.map((badge, idx) => (
              <View key={idx} className="bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                <Text className="text-[11px] font-bold text-gray-500 tracking-widest">{badge}</Text>
              </View>
            ))}
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-center w-full px-6 gap-3 mb-10">
            {mockProfile.stats.map((stat, idx) => (
              <View key={idx} className="flex-[0.33] bg-white py-4 rounded-[28px] items-center border border-gray-100 shadow-sm">
                <Text className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</Text>
                <Text className="text-[9px] font-bold text-gray-400 tracking-wider">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Life Timeline Section */}
        <View className="px-6 mb-12">
          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-[22px] font-bold text-gray-900">Life Timeline</Text>
            <TouchableOpacity className="h-10 w-10 bg-[#f0efff] rounded-full items-center justify-center">
              <Feather name="plus" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          <View className="pl-[20px]">
            {mockProfile.timeline.map((item, index) => {
              const isLast = index === mockProfile.timeline.length - 1;
              return (
                <View key={item.id} className="relative mb-6">
                  {/* Vertical Line */}
                  {!isLast && (
                    <View className="absolute left-[3px] top-[40px] bottom-[-40px] w-[2px] bg-gray-200" />
                  )}
                  
                  {/* Timeline Node Icon */}
                  <View className="absolute left-[-20px] top-6 bg-white border border-gray-100 rounded-full h-10 w-10 items-center justify-center shadow-sm z-10">
                     <Feather 
                        name={item.icon as any || 'circle'} 
                        size={16} 
                        color={index === 0 ? "#6366f1" : "#d1d5db"} 
                      />
                  </View>

                  {/* Content Card */}
                  <View className="ml-[36px] bg-white rounded-[24px] p-5 shadow-sm border border-gray-50">
                    <View className="flex-row justify-between items-start mb-1">
                       <Text className="text-[17px] font-bold text-gray-900 flex-1 pr-2">{item.title}</Text>
                       <Text className="text-[13px] font-semibold text-gray-300">{item.year}</Text>
                    </View>
                    <Text className="text-[11px] font-bold text-[#6366f1] tracking-widest uppercase mb-3">{item.date}</Text>
                    {item.description ? (
                      <Text className="text-[15px] text-gray-500 leading-[22px]">{item.description}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Media Gallery Section */}
        <View className="px-6 mb-12">
          <View className="flex-row items-center justify-between mb-6">
             <Text className="text-[22px] font-bold text-gray-900">Media Gallery</Text>
             <Text className="text-[12px] font-bold text-[#6366f1] uppercase tracking-wider">VIEW ALL</Text>
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-4">
             {mockProfile.gallery.map((media, idx) => {
                const itemSize = (width - 48 - 16) / 3; // roughly 3 columns
                if (media.type === 'voice') {
                  return (
                    <View key={idx} style={{ width: itemSize, height: itemSize }} className="bg-[#f0efff] rounded-[24px] items-center justify-center">
                      <View className="bg-white h-10 w-10 rounded-full items-center justify-center mb-2 shadow-sm">
                        <Feather name="mic" size={18} color="#6366f1" />
                      </View>
                      <Text className="text-[9px] font-bold text-[#6366f1] tracking-widest uppercase">VOICENOTE</Text>
                    </View>
                  )
                }

                return (
                  <View key={idx} style={{ width: itemSize, height: itemSize }} className="rounded-[24px] overflow-hidden bg-gray-200">
                    <Image source={{ uri: media.url }} className="w-full h-full" resizeMode="cover" />
                  </View>
                )
             })}
             
             {/* Add Card */}
             <TouchableOpacity style={{ width: (width - 48 - 16) / 3, height: (width - 48 - 16) / 3 }} className="rounded-[24px] border-2 border-dashed border-gray-200 items-center justify-center">
                 <Feather name="plus" size={24} color="#d1d5db" />
             </TouchableOpacity>
          </View>
        </View>

        {/* Family Connections Section */}
        <View className="px-6 overflow-visible">
           <Text className="text-[22px] font-bold text-gray-900 mb-6">Family Connections</Text>

           <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible -mx-6 px-6">
              {mockProfile.connections.map((conn, idx) => (
                <View key={idx} className="items-center mr-6">
                   <View className="h-[80px] w-[80px] rounded-full bg-white border-[3px] border-white shadow-sm overflow-hidden mb-3">
                      <Image source={{ uri: conn.avatar }} className="w-full h-full" />
                   </View>
                   <Text className="text-[14px] font-bold text-gray-900">{conn.name}</Text>
                </View>
              ))}

              {/* Add Connection */}
               <View className="items-center mr-6">
                   <TouchableOpacity className="h-[80px] w-[80px] rounded-full border-2 border-dashed border-gray-300 items-center justify-center mb-3">
                      <Text className="text-gray-300 font-bold">+</Text>
                   </TouchableOpacity>
                   <Text className="text-[14px] font-bold text-gray-300">Add</Text>
                </View>
           </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
