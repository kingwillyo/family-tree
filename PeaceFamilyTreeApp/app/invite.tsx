import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../lib/auth-context';
import { Profile, generateInviteCode } from '../lib/treeService';
import { supabase } from '../lib/supabase';

export default function InviteScreen() {
  const router = useRouter();
  const { familyId } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!familyId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', familyId)
      .is('user_id', null)
      .order('full_name');

    if (error) {
      Alert.alert('Unable to load members', error.message);
      setMembers([]);
    } else {
      setMembers(data ?? []);
    }
    setLoading(false);
  }, [familyId]);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

  const handleInvite = async (member: Profile) => {
    setInvitingId(member.id);
    const result = await generateInviteCode(member.id);
    setInvitingId(null);

    if ('error' in result) {
      Alert.alert('Unable to create invite', result.error);
      return;
    }

    try {
      await Share.share({
        message: `You've been added to our LineageX family tree! Download the LineageX app, tap "Create Account" → "Join Family", and enter your invite code:\n\n${result.code}\n\nThis code expires in 72 hours.`,
        title: `Invite ${member.full_name}`,
      });
    } catch (error) {
      Alert.alert(
        'Unable to share invite',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8] dark:bg-slate-950" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
          <Feather name="chevron-left" size={28} color={isDarkMode ? '#e2e8f0' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#3e4d44] dark:text-slate-200">
          Invite Family
        </Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <View className="flex-1 px-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Invite family members
            </Text>
            <Text className="mt-2 text-base leading-6 text-gray-500 dark:text-slate-400">
              These family members are in your tree but do not have an account yet. Send them a code
              so they can join their profile.
            </Text>
          </View>

          <View className="flex-1">
            {members.length === 0 ? (
              <View className="items-center rounded-3xl border border-gray-100 bg-white px-6 py-10 dark:border-slate-800 dark:bg-slate-900">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                  <Feather name="users" size={28} color={isDarkMode ? '#6ee7b7' : '#059669'} />
                </View>
                <Text className="text-center text-lg font-bold text-gray-900 dark:text-white">
                  No members to invite
                </Text>
                <Text className="mt-2 text-center text-sm leading-5 text-gray-500 dark:text-slate-400">
                  Create a family member first, then you can invite them to claim their profile in
                  the app.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/member/add')}
                  className="mt-6 rounded-full bg-[#064e3b] px-6 py-3">
                  <Text className="font-bold text-white">Create a member</Text>
                </TouchableOpacity>
              </View>
            ) : (
              members.map((member) => (
                <View
                  key={member.id}
                  className="mb-3 flex-row items-center rounded-3xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                    <Text className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {member.full_name.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900 dark:text-white">
                      {member.full_name}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                      No account linked
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleInvite(member)}
                    disabled={invitingId !== null}
                    className="flex-row items-center rounded-full bg-emerald-600 px-4 py-2.5">
                    {invitingId === member.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Feather name="send" size={14} color="white" />
                        <Text className="ml-2 text-xs font-bold text-white">Invite</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
