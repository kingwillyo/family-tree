import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type CardVariant = 'parent' | 'main' | 'child' | 'add-child' | 'add-spouse' | 'add-parent';

export interface TreeMockCardProps {
  variant: CardVariant;
  id?: string;
  name?: string;
  role?: string;
  dates?: string;
  imageUrl?: string;
  subTitle?: string;
  admin?: boolean;
}

export function TreeMockCard({
  variant,
  id = 'mock-id',
  name,
  role,
  dates,
  imageUrl,
  subTitle,
  admin = false,
}: TreeMockCardProps) {
  const router = useRouter();

  if (variant.startsWith('add')) {
    let label = 'Add Child';
    if (variant === 'add-spouse') label = 'Add Spouse';
    if (variant === 'add-parent') label = 'Add Parent';

    return (
      <TouchableOpacity
        className="h-[170px] w-40 items-center justify-center rounded-[24px] border-2 border-dashed border-[#c4ccc7] bg-[#f8f9f6]/50"
        activeOpacity={0.7}>
        <Feather name="plus" size={24} color="#909b95" />
        <Text className="mt-2 text-sm font-bold text-[#6d7b73]">{label}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'main') {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/member/${id}` as any)}
        activeOpacity={0.8}
        className="w-[280px] items-center rounded-[32px] border border-gray-100 bg-white p-6"
        style={styles.shadow}>
        <View className="relative mb-5">
          <Image
            source={{ uri: imageUrl || 'https://via.placeholder.com/150' }}
            className="h-[120px] w-[120px] rounded-full border-4 border-[#2b4030]"
          />
          {admin && (
            <View className="absolute bottom-1 right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#3cd52e]">
              <FontAwesome name="star" size={14} color="white" />
            </View>
          )}
        </View>

        <Text className="mb-1 text-center text-2xl font-bold text-gray-900">{name}</Text>
        <Text className="mb-3 text-base font-bold text-[#849f8d]">{dates}</Text>

        {subTitle && (
          <Text className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[#9aa7a0]">
            {subTitle}
          </Text>
        )}

        <View className="rounded-full bg-[#f0f5f2] px-4 py-1.5">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#648470]">{role}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // parent or child
  return (
    <TouchableOpacity
      onPress={() => router.push(`/member/${id}` as any)}
      activeOpacity={0.8}
      className="w-40 items-center rounded-[24px] border border-gray-50 bg-white p-5"
      style={styles.shadow}>
      <View className="relative mb-4">
        <Image
          source={{ uri: imageUrl || 'https://via.placeholder.com/100' }}
          className="h-[72px] w-[72px] rounded-full"
        />
        {admin && (
          <View className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#3cd52e]">
            <FontAwesome name="star" size={10} color="white" />
          </View>
        )}
      </View>
      {role && variant === 'parent' && (
        <Text className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#849f8d]">
          {role}
        </Text>
      )}
      <Text className="mb-1 text-center text-[15px] font-bold text-gray-900" numberOfLines={1}>
        {name}
      </Text>
      {dates && <Text className="text-center text-xs font-medium text-[#a4b2a9]">{dates}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#4a6b57',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
});
