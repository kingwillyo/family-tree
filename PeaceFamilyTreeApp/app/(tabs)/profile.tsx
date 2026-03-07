import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../../lib/auth-context';

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  admin: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Admin' },
  editor: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Editor' },
  viewer: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Viewer' },
};

export default function ProfileScreen() {
  const { user, role, signOut, loading } = useAuth();
  const router = useRouter();
  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'editor';

  const roleStyle = ROLE_COLORS[role] ?? ROLE_COLORS.viewer;

  const getInitials = (email: string) => email.charAt(0).toUpperCase();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic">
      <View className="px-6 pb-8 pt-6">
        {/* Title */}
        <View className="mb-8">
          <Text className="mb-1 text-3xl font-bold text-gray-900">Profile</Text>
          <Text className="text-base text-gray-500">Manage your account settings</Text>
        </View>

        {/* User card */}
        <Card variant="elevated" className="mb-6">
          <View className="items-center py-4">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-emerald-600">
              <Text className="text-4xl font-bold text-white">
                {user?.email ? getInitials(user.email) : '?'}
              </Text>
            </View>
            <Text className="mb-1 text-xl font-bold text-gray-900">
              {user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text className="mb-3 text-sm text-gray-500">{user?.email}</Text>
            {/* Role badge */}
            <View className={`rounded-full px-4 py-1.5 ${roleStyle.bg}`}>
              <Text className={`text-xs font-bold uppercase tracking-wide ${roleStyle.text}`}>
                {roleStyle.label}
              </Text>
            </View>
          </View>
        </Card>

        {/* Family section */}
        <View className="mb-6">
          <Text className="mb-4 text-lg font-bold text-gray-900">Family</Text>
          <View className="gap-3">
            {isAdmin && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/invite' as any)}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <Text className="text-2xl">📨</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">Invite Members</Text>
                      <Text className="text-sm text-gray-500">Generate an invite link</Text>
                    </View>
                    <Text className="text-xl text-gray-400">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            )}

            {canEdit && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/member/add' as any)}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <Text className="text-2xl">➕</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">Add Member</Text>
                      <Text className="text-sm text-gray-500">Add someone to the family tree</Text>
                    </View>
                    <Text className="text-xl text-gray-400">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account settings */}
        <View className="mb-6">
          <Text className="mb-4 text-lg font-bold text-gray-900">Account Settings</Text>
          <View className="gap-3">
            <TouchableOpacity activeOpacity={0.7}>
              <Card variant="outlined">
                <View className="flex-row items-center">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <Text className="text-2xl">🔒</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      Privacy & Security
                    </Text>
                    <Text className="text-sm text-gray-500">Control your data</Text>
                  </View>
                  <Text className="text-xl text-gray-400">›</Text>
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
              <Card variant="outlined">
                <View className="flex-row items-center">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    <Text className="text-2xl">ℹ️</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">About</Text>
                    <Text className="text-sm text-gray-500">App version & info</Text>
                  </View>
                  <Text className="text-xl text-gray-400">›</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        <Button title="Sign Out" variant="danger" onPress={signOut} loading={loading} />
      </View>
    </ScrollView>
  );
}
