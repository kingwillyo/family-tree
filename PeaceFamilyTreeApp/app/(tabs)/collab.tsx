import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

// Mock Data targeting the precise design from the reference image
const mockEditsData = [
  {
    id: '1',
    author: {
      name: 'Sarah Jenkins',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    },
    timeString: '2H AGO',
    actionText: 'Edited',
    actionTarget: "Joseph Miller's",
    actionField: 'Birth Date',
    diff: {
      type: 'was-to',
      was: 'June 12, 1945',
      to: 'June 12, 1944',
    },
  },
  {
    id: '2',
    author: {
      name: 'David Chen',
      avatar:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
    },
    timeString: '5H AGO',
    actionText: 'Added',
    actionTarget: 'Death Place',
    actionField: 'for Eleanor Rigby',
    diff: {
      type: 'new',
      value: 'Liverpool, United Kingdom',
    },
  },
  {
    id: '3',
    author: {
      name: 'Michael Scott',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    },
    timeString: 'YESTERDAY',
    actionText: 'Updated',
    actionTarget: 'Marriage Status',
    actionField: '',
    diff: {
      type: 'was-to',
      was: 'Single',
      to: 'Married',
    },
  },
];

export default function CollabScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pb-4 pt-4">
        <Text className="text-[26px] font-bold text-gray-900">Collaboration</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Summary Card */}
        <View className="mb-8 mt-2 px-6">
          <View className="w-full flex-row items-center justify-between rounded-[24px] border border-[#e5fad8] bg-[#f1fdec] px-6 py-8">
            <View>
              <Text className="text-[42px] font-black leading-[48px] text-gray-900">14</Text>
              <Text className="mt-1 text-[14px] font-medium text-gray-500">Pending proposals</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#32CD32] shadow-sm">
              <Feather name="users" size={24} color="white" />
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View className="mb-4 flex-row items-center justify-between px-6">
          <Text className="flex-1 text-[12px] font-bold uppercase tracking-widest text-gray-500">
            Recent Edits
          </Text>
          <TouchableOpacity>
            <Text className="text-[13px] font-bold text-[#32CD32]">View All</Text>
          </TouchableOpacity>
        </View>

        {/* Feed */}
        <View className="px-6">
          {mockEditsData.map((edit) => (
            <View key={edit.id} className="mb-4 rounded-[24px] border border-gray-100 bg-white p-5">
              {/* Author Header */}
              <View className="mb-5 flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <Image
                    source={{ uri: edit.author.avatar }}
                    className="mr-3 h-10 w-10 rounded-full bg-gray-200"
                  />
                  <View className="flex-1 pr-2">
                    <Text className="text-[15px] font-bold text-gray-900">{edit.author.name}</Text>
                    <Text className="mt-0.5 text-[13px] text-gray-500" numberOfLines={1}>
                      {edit.actionText}{' '}
                      <Text className="font-bold text-[#32CD32]">{edit.actionTarget}</Text>
                      {edit.actionField ? ` ${edit.actionField}` : ''}
                    </Text>
                  </View>
                </View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {edit.timeString}
                </Text>
              </View>

              {/* Diff Box */}
              <View className="mb-4 rounded-[16px] bg-[#f8f9fa] p-4">
                {edit.diff.type === 'was-to' ? (
                  <View>
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text className="text-[13px] font-medium text-gray-500">Was</Text>
                      <Text className="text-[13px] font-medium text-gray-400">{edit.diff.was}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[13px] font-bold text-gray-700">To</Text>
                      <Text className="text-[14px] font-bold text-[#32CD32]">{edit.diff.to}</Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      New Value
                    </Text>
                    <Text className="text-[14px] font-bold text-[#32CD32]">{edit.diff.value}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-x-3">
                <TouchableOpacity className="flex-1 items-center justify-center rounded-full bg-[#111827] py-[14px]">
                  <Text className="text-[14px] font-bold text-white">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 items-center justify-center rounded-full bg-[#f3f4f6] py-[14px]">
                  <Text className="text-[14px] font-bold text-gray-900">Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Outro State */}
          <View className="mt-4 items-center justify-center py-6 pb-12">
            <Feather name="file-minus" size={32} color="#cbd5e1" className="mb-4" />
            <Text className="text-[14px] font-medium text-[#94a3b8]">No more pending reviews</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
