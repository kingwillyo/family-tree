import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { 
  fetchProposals, 
  fetchCurrentProfile, 
  updateProposalStatus, 
  EditProposal, 
  Profile 
} from '../../lib/treeService';

// ─── Helpers ──────────────────────────────────────────────────────────────

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 60) return `${diffMins}M AGO`;
  if (diffHrs < 24) return `${diffHrs}H AGO`;
  return `${diffDays}D AGO`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function CollabScreen() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [proposals, setProposals] = useState<EditProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, props] = await Promise.all([
      fetchCurrentProfile(),
      fetchProposals('pending'),
    ]);
    setCurrentProfile(p);
    setProposals(props);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (proposal: EditProposal, status: 'approved' | 'rejected') => {
    if (!currentProfile || currentProfile.role !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can review proposals.');
      return;
    }

    setProcessingId(proposal.id);
    const res = await updateProposalStatus(proposal, status, currentProfile.id);
    
    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      setProposals((prev) => prev.filter((p) => p.id !== proposal.id));
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#fcFAF8] dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  const isAdmin = currentProfile?.role === 'admin';

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8] dark:bg-slate-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pb-4 pt-4">
        <Text className="text-[26px] font-bold text-gray-900 dark:text-white">Collaboration</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Summary Card */}
        <View className="mb-8 mt-2 px-6">
          <View className="w-full flex-row items-center justify-between rounded-[24px] border border-[#e5fad8] dark:border-emerald-950/20 bg-[#f1fdec] dark:bg-emerald-950/10 px-6 py-8">
            <View>
              <Text className="text-[42px] font-black leading-[48px] text-gray-900 dark:text-white">
                {proposals.length}
              </Text>
              <Text className="mt-1 text-[14px] font-medium text-gray-500 dark:text-slate-400">Pending proposals</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#32CD32] shadow-sm">
              <Feather name="users" size={24} color="white" />
            </View>
          </View>
        </View>

        {!isAdmin ? (
          <View className="px-6 items-center py-10">
            <Feather name="shield" size={48} color={isDarkMode ? '#334155' : "#cbd5e1"} />
            <Text className="mt-4 text-center text-gray-400 dark:text-slate-500">
              You do not have admin permissions to review proposals.
            </Text>
          </View>
        ) : (
          <>
            {/* Section Title */}
            <View className="mb-4 flex-row items-center justify-between px-6">
              <Text className="flex-1 text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-500">
                Pending Proposals
              </Text>
              <TouchableOpacity onPress={loadData}>
                <Feather name="refresh-cw" size={14} color="#32CD32" />
              </TouchableOpacity>
            </View>

            {/* Feed */}
            <View className="px-6">
              {proposals.length === 0 ? (
                <View className="mt-4 items-center justify-center py-10">
                  <Feather name="file-minus" size={32} color={isDarkMode ? '#334155' : "#cbd5e1"} className="mb-4" />
                  <Text className="text-[14px] font-medium text-[#94a3b8] dark:text-slate-600">No pending reviews</Text>
                </View>
              ) : (
                proposals.map((prop) => {
                  const proposer = prop.proposer_profile;
                  const target = prop.target_profile;
                  const data = prop.proposed_data;
                  const original = prop.original_data;

                  // Simple logic to find the changed field for title
                  // In a real app we'd have a more robust diffing summary
                  const fieldName = prop.change_type === 'profile_update' ? 'Profile' : 'Info';

                  return (
                    <View key={prop.id} className="mb-4 rounded-[24px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                      {/* Proposer Header */}
                      <View className="mb-5 flex-row items-center justify-between">
                        <View className="flex-1 flex-row items-center">
                          <View className="h-10 w-10 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800 mr-3">
                            {proposer?.avatar_url ? (
                              <Image source={{ uri: proposer.avatar_url }} className="h-full w-full" />
                            ) : (
                              <View className="flex-1 items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                                <Text className="text-sm font-bold text-orange-300 dark:text-orange-700">
                                  {proposer?.full_name?.[0]?.toUpperCase() ?? '?'}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View className="flex-1 pr-2">
                            <Text className="text-[15px] font-bold text-gray-900 dark:text-white">
                              {proposer?.full_name ?? 'Unknown User'}
                            </Text>
                            <Text className="mt-0.5 text-[13px] text-gray-500 dark:text-slate-400" numberOfLines={1}>
                              Proposed changes for <Text className="font-bold text-[#32CD32]">{target?.full_name ?? 'Member'}</Text>
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                          {getTimeAgo(prop.created_at)}
                        </Text>
                      </View>

                      {/* Data Box */}
                      <View className="mb-4 rounded-[16px] bg-[#f8f9fa] dark:bg-slate-950 p-4">
                        {prop.change_type === 'profile_update' ? (
                          <View>
                            {Object.keys(data).map((key) => {
                              const val = data[key];
                              const label = key.replace(/_/g, ' ').toUpperCase();
                              if (val === original?.[key]) return null;
                              return (
                                <View key={key} className="mb-3">
                                  <Text className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mb-1">{label}</Text>
                                  <View className="flex-row items-center justify-between">
                                    <Text className="text-[13px] text-gray-400 dark:text-slate-600 flex-1 mr-2" numberOfLines={1}>{String(original?.[key] ?? 'None')}</Text>
                                    <Feather name="arrow-right" size={12} color={isDarkMode ? '#334155' : "#cbd5e1"} className="mx-2" />
                                    <Text className="text-[13px] font-bold text-[#32CD32] flex-1 text-right" numberOfLines={1}>{String(val)}</Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        ) : prop.change_type === 'timeline_add' ? (
                          <View>
                            <Text className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mb-1 text-center">NEW TIMELINE EVENT</Text>
                            <View className="items-center">
                              <Text className="text-[16px] font-bold text-gray-900 dark:text-white">{data.title}</Text>
                              <Text className="text-[13px] font-semibold text-[#32CD32]">{data.year}</Text>
                              {data.description ? (
                                <Text className="mt-1 text-[13px] text-center text-gray-500 dark:text-slate-400" numberOfLines={2}>{data.description}</Text>
                              ) : null}
                            </View>
                          </View>
                        ) : prop.change_type === 'timeline_delete' ? (
                          <View>
                            <Text className="text-[10px] font-bold text-red-400 dark:text-red-900 mb-1 text-center">DELETE TIMELINE EVENT</Text>
                            <View className="items-center">
                              <Text className="text-[16px] font-bold text-gray-400 dark:text-slate-600 line-through">{data.title}</Text>
                              <Text className="text-[13px] font-semibold text-gray-400 dark:text-slate-600">{data.year}</Text>
                            </View>
                          </View>
                        ) : prop.change_type === 'avatar_update' ? (
                          <View className="items-center">
                            <Text className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mb-2">NEW PROFILE PHOTO</Text>
                            <View className="h-20 w-20 overflow-hidden rounded-full border-2 border-[#e5fad8] dark:border-emerald-950/20 bg-gray-100 dark:bg-slate-800">
                              <Image source={{ uri: data.url }} className="h-full w-full" />
                            </View>
                          </View>
                        ) : (
                          <View>
                            <Text className="text-[14px] font-bold text-[#32CD32]">
                              {JSON.stringify(data)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row gap-x-3">
                        <TouchableOpacity 
                          onPress={() => handleAction(prop, 'approved')}
                          disabled={!!processingId}
                          className="flex-1 flex-row items-center justify-center rounded-full bg-[#111827] dark:bg-white py-[14px]">
                          {processingId === prop.id ? (
                            <ActivityIndicator size="small" color={isDarkMode ? 'black' : "white"} />
                          ) : (
                            <Text className="text-[14px] font-bold text-white dark:text-black">Approve</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleAction(prop, 'rejected')}
                          disabled={!!processingId}
                          className="flex-1 items-center justify-center rounded-full bg-[#f3f4f6] dark:bg-slate-800 py-[14px]">
                          <Text className="text-[14px] font-bold text-gray-900 dark:text-white">Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

