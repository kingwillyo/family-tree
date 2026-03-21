import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function CreateMemoryScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [memory, setMemory] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 pb-3 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="py-2">
          <Text className="text-[16px] font-medium text-gray-500">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-[16px] font-bold text-gray-900">New Memory</Text>

        <TouchableOpacity
          className={`rounded-full px-4 py-1.5 ${title.trim() || memory.trim() ? 'bg-[#84cc16]' : 'bg-green-100/50'}`}
          disabled={!title.trim() && !memory.trim()}>
          <Text
            className={`text-[14px] font-bold ${title.trim() || memory.trim() ? 'text-white' : 'text-green-800/40'}`}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View className="mb-4 flex-row items-start">
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop', // Temporary mock avatar matching user
              }}
              className="mr-3 h-10 w-10 rounded-full bg-gray-200"
            />
            <View className="flex-1 pt-1">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title of post..."
                placeholderTextColor="#9ca3af"
                className="mb-2 text-[20px] font-bold text-gray-900"
              />
              <TextInput
                value={memory}
                onChangeText={setMemory}
                placeholder="What's on your mind?"
                placeholderTextColor="#9ca3af"
                multiline
                scrollEnabled={false}
                className="min-h-[120px] text-[16px] leading-[24px] text-gray-800"
                style={{ textAlignVertical: 'top' }}
              />
            </View>
          </View>
        </ScrollView>

        {/* Action Toolbar */}
        <View className="flex-row items-center border-t border-gray-100/80 bg-white px-4 py-3 pb-6">
          <TouchableOpacity className="mr-5 items-center justify-center rounded-full bg-green-50/50 p-2">
            <Feather name="image" size={22} color="#84cc16" />
          </TouchableOpacity>
          <TouchableOpacity className="mr-5 items-center justify-center rounded-full bg-green-50/50 p-2">
            <Feather name="mic" size={22} color="#84cc16" />
          </TouchableOpacity>
          <TouchableOpacity className="mr-5 items-center justify-center rounded-full bg-green-50/50 p-2">
            <Feather name="map-pin" size={22} color="#84cc16" />
          </TouchableOpacity>
          <TouchableOpacity className="mr-5 items-center justify-center rounded-full bg-green-50/50 p-2">
            <Feather name="user-plus" size={22} color="#84cc16" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
