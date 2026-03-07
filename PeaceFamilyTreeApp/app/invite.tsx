import React, { useState } from 'react';
import { ActivityIndicator, Alert, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

type InviteRole = 'editor' | 'viewer';

function generateToken(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export default function InviteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<InviteRole>('viewer');
  const [generating, setGenerating] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    const token = generateToken();

    const { error } = await supabase.from('family_members').insert({
      invite_token: token,
      invite_role: selectedRole,
      invited_by: user?.id,
      role: selectedRole, // placeholder until accepted
    });

    setGenerating(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    // In production, use your app's deep-link scheme from app.json
    const link = `peacefamilytree://invite?token=${token}`;
    setInviteLink(link);
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    await Share.share({
      message: `You've been invited to join the Peace Family Tree! Open this link to accept: ${inviteLink}`,
      title: 'Family Tree Invite',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-base font-medium text-emerald-600">← Back</Text>
        </TouchableOpacity>
        <Text className="ml-2 text-base font-bold text-gray-900">Invite Member</Text>
      </View>

      <View className="px-6 pt-4">
        {/* Illustration */}
        <View className="mb-8 items-center">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
            <Text className="text-5xl">📨</Text>
          </View>
          <Text className="text-center text-base text-gray-500">
            Generate a shareable invite link and send it via WhatsApp, email, or any messaging app.
          </Text>
        </View>

        {/* Role selector */}
        <Text className="mb-3 font-semibold text-gray-700">Invite as:</Text>
        <View className="mb-6 flex-row gap-3">
          {(['viewer', 'editor'] as InviteRole[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                setSelectedRole(r);
                setInviteLink(null);
              }}
              className={`flex-1 rounded-2xl border py-4 ${
                selectedRole === r ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 bg-white'
              }`}>
              <Text className={`mb-1 text-center text-2xl`}>{r === 'viewer' ? '👁️' : '✏️'}</Text>
              <Text
                className={`text-center text-sm font-semibold capitalize ${
                  selectedRole === r ? 'text-emerald-700' : 'text-gray-600'
                }`}>
                {r}
              </Text>
              <Text className="mt-1 text-center text-xs text-gray-400">
                {r === 'viewer' ? 'Can view only' : 'Can add & edit'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate button */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating}
          className="mb-4 items-center rounded-2xl bg-emerald-600 py-4">
          {generating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-bold text-white">Generate Invite Link</Text>
          )}
        </TouchableOpacity>

        {/* Generated link */}
        {inviteLink && (
          <View className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <Text className="mb-2 text-sm font-semibold text-emerald-700">✓ Link ready</Text>
            <Text className="mb-4 break-all text-xs text-gray-500">{inviteLink}</Text>
            <TouchableOpacity
              onPress={handleShare}
              className="items-center rounded-xl bg-emerald-600 py-3">
              <Text className="text-sm font-bold text-white">📤 Share Link</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
