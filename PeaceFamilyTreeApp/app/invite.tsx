import React, { useState } from 'react';
import { ActivityIndicator, Alert, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { Feather } from '@expo/vector-icons';

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
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
          <Feather name="chevron-left" size={24} color="#6d7b73" />
        </TouchableOpacity>
        <Text className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#3e4d44]">
          Invite Family
        </Text>
        <View className="w-10" />
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
          className="mb-4 items-center rounded-2xl bg-[#8cc63f] py-4 shadow-sm"
          style={{ shadowColor: '#8cc63f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
          {generating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-bold text-white uppercase tracking-wider">Generate Link</Text>
          )}
        </TouchableOpacity>

        {/* Generated link */}
        {inviteLink && (
          <View className="rounded-2xl border border-[#e8f5e9] bg-white p-6 shadow-sm">
            <Text className="mb-2 text-sm font-bold text-[#3e4d44]">✓ Link ready</Text>
            <Text className="mb-6 break-all text-xs text-[#9aa7a0] leading-5">{inviteLink}</Text>
            <TouchableOpacity
              onPress={handleShare}
              className="items-center rounded-xl bg-[#8cc63f] py-4">
              <Text className="text-sm font-bold text-white uppercase tracking-widest">Share Link</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
