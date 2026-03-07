import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export interface MemberProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  is_living: boolean;
  visibility: 'family' | 'private';
  bio: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

interface MemberCardProps {
  profile: MemberProfile;
  showRelationship?: string;
  onPress?: () => void;
}

export function MemberCard({ profile, showRelationship, onPress }: MemberCardProps) {
  const router = useRouter();
  const initials = getInitials(profile.full_name);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/member/${profile.id}` as any);
    }
  };

  const birthYear = profile.date_of_birth ? new Date(profile.date_of_birth).getFullYear() : null;
  const deathYear = profile.date_of_death ? new Date(profile.date_of_death).getFullYear() : null;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      className="mb-3 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      {/* Avatar */}
      {profile.avatar_url ? (
        <Image
          source={{ uri: profile.avatar_url }}
          className="mr-4 h-12 w-12 rounded-full"
          resizeMode="cover"
        />
      ) : (
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <Text className="text-base font-bold text-emerald-700">{initials}</Text>
        </View>
      )}

      {/* Info */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-gray-900">
            {profile.full_name ?? 'Unknown'}
          </Text>
          {!profile.is_living && (
            <View className="rounded-full bg-gray-200 px-2 py-0.5">
              <Text className="text-xs text-gray-500">†</Text>
            </View>
          )}
          {profile.visibility === 'private' && (
            <View className="rounded-full bg-amber-100 px-2 py-0.5">
              <Text className="text-xs text-amber-700">Private</Text>
            </View>
          )}
        </View>
        <Text className="mt-0.5 text-sm text-gray-400">
          {birthYear
            ? deathYear
              ? `${birthYear} – ${deathYear}`
              : `b. ${birthYear}`
            : 'No birth date'}
        </Text>
        {showRelationship && (
          <Text className="mt-0.5 text-xs font-medium capitalize text-emerald-600">
            {showRelationship}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Text className="text-xl text-gray-300">›</Text>
    </TouchableOpacity>
  );
}
