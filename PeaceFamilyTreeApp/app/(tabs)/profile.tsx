import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import {
  Profile,
  TimelineEvent,
  Memory,
  ProfileConnection,
  MemberStats,
  fetchProfileById,
  fetchTimelineEvents,
  fetchMemberMedia,
  fetchMemberConnections,
  fetchMemberStats,
  uploadAvatar,
  uploadMemberMedia,
  deleteTimelineEvent,
  createProposal,
} from '../../lib/treeService';
import { Button } from '../../components/Button';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDates(profile: Profile): string {
  const birth = profile.date_of_birth ? new Date(profile.date_of_birth).getFullYear() : null;
  if (profile.is_living) return birth ? `b. ${birth}` : '';
  const death = profile.date_of_death
    ? new Date(profile.date_of_death).getFullYear()
    : null;
  if (birth && death) return `${birth} — ${death}`;
  if (birth) return `b. ${birth}`;
  return '';
}

function getRoleBadge(profile: Profile): string {
  if (!profile.gender) return 'MEMBER';
  return profile.gender === 'female' ? 'MATRIARCH' : 'PATRIARCH';
}

function getRelationshipLabel(type: 'parent' | 'child' | 'spouse'): string {
  switch (type) {
    case 'parent': return 'Parent';
    case 'child': return 'Child';
    case 'spouse': return 'Spouse';
  }
}

interface ImagePreviewModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

function ImagePreviewModal({ visible, imageUrl, onClose }: ImagePreviewModalProps) {
  if (!imageUrl) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/90 items-center justify-center">
        <TouchableOpacity 
          onPress={onClose}
          className="absolute top-12 right-6 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>
        <Image 
          source={{ uri: imageUrl }} 
          className="w-full h-3/4" 
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function TabProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [media, setMedia] = useState<Memory[]>([]);
  const [connections, setConnections] = useState<ProfileConnection[]>([]);
  const [stats, setStats] = useState<MemberStats>({ memoriesCount: 0, eventsCount: 0, childrenCount: 0, connectionsCount: 0 });
  const [loading, setLoading] = useState(true);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Shimmer animation for skeleton
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);
  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  // 1. Fetch the user's profile ID first
  useEffect(() => {
    const getProfileId = async () => {
      if (!user) return;
      
      // Try family_members first
      const { data: fmData } = await supabase
        .from('family_members')
        .select('profile_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fmData?.profile_id) {
        setProfileId(fmData.profile_id);
        return;
      }

      // Fallback: check profiles table directly
      const { data: pData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (pData?.id) {
        setProfileId(pData.id);
      } else {
        setLoading(false);
      }
    };
    getProfileId();
  }, [user]);

  // 2. Load profile data once we have the ID
  const loadData = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    const [p, t, m, c, s] = await Promise.all([
      fetchProfileById(profileId),
      fetchTimelineEvents(profileId),
      fetchMemberMedia(profileId),
      fetchMemberConnections(profileId),
      fetchMemberStats(profileId),
    ]);
    setProfile(p);
    setTimeline(t);
    setMedia(m);
    setConnections(c);
    setStats(s);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarPress = async () => {
    if (!user || !profileId || !profile) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    setAvatarUploading(true);

    // If Admin, upload directly (uploadAvatar currently does DB update too)
    if (profile.role === 'admin') {
      const res = await uploadAvatar(result.assets[0].uri, user.id, profileId);
      if ('error' in res) {
        Alert.alert('Upload failed', res.error);
      } else {
        setProfile((prev) => prev ? { ...prev, avatar_url: res.url } : prev);
      }
    } 
    // If Member, we'd need to upload just the storage file then propose. 
    // For now, let's keep it simple: inform the user.
    else {
      // NOTE: uploadAvatar in treeService MUST be refactored if we want members to propose avatars
      // because it currently updates the profiles table directly.
      Alert.alert('Admin Only', 'Profile photo updates are currently restricted to administrators.');
    }
    setAvatarUploading(false);
  };

  // ── Gallery upload ───────────────────────────────────────────────────────
  const handleMediaAdd = async () => {
    if (!user || !profileId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setMediaUploading(true);
    const res = await uploadMemberMedia(result.assets[0].uri, user.id, profileId);
    if ('error' in res) {
      Alert.alert('Upload failed', res.error);
    } else {
      setMedia((prev) => [{
        id: Date.now().toString(),
        author_profile_id: profileId,
        created_by: user.id,
        type: 'photo',
        title: null,
        body: null,
        location: null,
        image_urls: [res.url],
        audio_url: null,
        created_at: new Date().toISOString(),
      }, ...prev]);
    }
    setMediaUploading(false);
  };

  const handleDeleteTimelineEvent = async (event: TimelineEvent) => {
    if (!user || !profileId || !profile) return;

    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            // 1. If Admin, delete directly
            if (profile.role === 'admin') {
              const res = await deleteTimelineEvent(event.id);
              if (res.error) {
                Alert.alert('Error', res.error);
              } else {
                setTimeline((prev) => prev.filter((e) => e.id !== event.id));
                setStats((prev) => ({ ...prev, eventsCount: prev.eventsCount - 1 }));
              }
            } 
            // 2. If Member, create proposal
            else {
              const res = await createProposal(profileId, profileId, 'timeline_delete', { event_id: event.id, title: event.title, year: event.year });
              if (res.error) {
                Alert.alert('Error', res.error);
              } else {
                Alert.alert('Success', 'Your deletion request has been submitted for admin approval.');
              }
            }
          }
        }
      ]
    );
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#fcFAF8]" edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100, alignItems: 'center', paddingTop: 32 }}>
          <Animated.View style={{ opacity: shimmerOpacity }} className="mb-6 h-[140px] w-[140px] rounded-full bg-gray-200" />
          <Animated.View style={{ opacity: shimmerOpacity }} className="mb-3 h-8 w-56 rounded-2xl bg-gray-200" />
          <Animated.View style={{ opacity: shimmerOpacity }} className="mb-8 h-5 w-32 rounded-xl bg-gray-100" />
          <View className="w-full flex-row justify-center gap-3 px-6">
            {[0, 1, 2].map((i) => (
              <Animated.View key={i} style={{ opacity: shimmerOpacity, flex: 0.33 }} className="h-20 rounded-[28px] bg-gray-100" />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#fcFAF8]" edges={['top']}>
        <Text className="text-gray-400">User profile not found.</Text>
        <TouchableOpacity onPress={signOut} className="mt-4 p-3 bg-red-50 rounded-xl">
          <Text className="text-red-500 font-bold">Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const itemSize = (width - 48 - 16) / 3;

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-end px-6 pt-4">
          <TouchableOpacity 
            onPress={() => router.push('/settings')}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-50">
            <Feather name="settings" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <View className="mt-6 items-center px-4">

          {/* Avatar */}
          <View className="relative mb-6">
            <View 
              className="h-[140px] w-[140px] overflow-hidden rounded-full border-4 bg-orange-100"
              style={{ borderColor: profile.role === 'admin' ? '#FFD700' : '#fcFAF8' }}>
              {avatarUploading ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="small" color="#8cc63f" />
                </View>
              ) : profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="h-full w-full"
                  style={{ backgroundColor: '#eccdae' }}
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-orange-100">
                  <Text className="text-5xl font-extrabold text-orange-300">
                    {profile.full_name?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/member/edit/${profileId}`)}
              activeOpacity={0.7}
              className="absolute -bottom-1 -right-1 h-12 w-12 items-center justify-center rounded-full border-4 border-[#fcFAF8] bg-[#8cc63f]">
              <Feather name="edit-2" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Name & Dates */}
          <Text className="mb-2 px-8 text-center text-[32px] font-extrabold leading-[38px] text-[#111827]">
            {profile.full_name}
          </Text>
          <Text className="mb-6 text-[17px] font-medium text-gray-400">
            {formatDates(profile)}
          </Text>

          {/* Badges */}
          <View className="mb-8 flex-row items-center justify-center gap-3 flex-wrap px-4">
            <View className="rounded-full border border-gray-100 bg-white px-4 py-2">
              <Text className="text-[11px] font-bold tracking-widest text-gray-500">
                {getRoleBadge(profile)}
              </Text>
            </View>
            <View className="rounded-full border border-gray-100 bg-white px-4 py-2">
              <Text className="text-[11px] font-bold tracking-widest text-gray-500">
                {stats.connectionsCount} CONNECTIONS
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="mb-10 w-full flex-row justify-center gap-3 px-6">
            {[
              { label: 'MEMORIES', value: stats.memoriesCount },
              { label: 'EVENTS', value: stats.eventsCount },
              { label: 'CHILDREN', value: stats.childrenCount },
            ].map((stat, idx) => (
              <View
                key={idx}
                className="flex-[0.33] items-center rounded-[28px] border border-gray-100 bg-white py-4">
                <Text className="mb-1 text-2xl font-bold text-gray-900">{stat.value}</Text>
                <Text className="text-[9px] font-bold tracking-wider text-gray-400">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Bio Section */}
          {profile.bio ? (
            <View className="mb-10 w-full px-6">
              <Text className="mb-3 text-[14px] font-bold uppercase tracking-widest text-gray-400">
                Life Summary
              </Text>
              <View className="rounded-[24px] bg-white p-6 border border-gray-100">
                <Text className="text-[16px] leading-[26px] text-gray-600">
                  {profile.bio}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ── Life Timeline Section ─────────────────────────────────── */}
        <View className="mb-12 px-6">
          <View className="mb-8 flex-row items-center justify-between">
            <Text className="text-[22px] font-bold text-gray-900">Life Timeline</Text>
            <TouchableOpacity
              onPress={() => router.push(`/member/${profileId}`)}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#f0f9ed]">
              <Feather name="plus" size={20} color="#059669" />
            </TouchableOpacity>
          </View>

          {timeline.length === 0 ? (
            <View className="items-center rounded-3xl border-2 border-dashed border-gray-200 py-10">
              <Feather name="clock" size={28} color="#d1d5db" />
              <Text className="mt-3 text-[13px] font-semibold text-gray-300">No life events yet</Text>
            </View>
          ) : (
            <View className="pl-[20px]">
              {timeline.map((item, index) => {
                const isLast = index === timeline.length - 1;
                return (
                  <View key={item.id} className="relative mb-6">
                    {!isLast && (
                      <View className="absolute bottom-[-40px] left-[3px] top-[40px] w-[2px] bg-gray-200" />
                    )}
                    <View className="absolute left-[-20px] top-6 z-10 h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white">
                      <Feather
                        name={(item.icon as any) || 'circle'}
                        size={16}
                        color={index === 0 ? '#059669' : '#d1d5db'}
                      />
                    </View>
                    <TouchableOpacity 
                      onLongPress={() => handleDeleteTimelineEvent(item)}
                      delayLongPress={500}
                      className="ml-[36px] rounded-[24px] border border-gray-100 bg-white p-5">
                      <View className="mb-1 flex-row items-start justify-between">
                        <Text className="flex-1 pr-2 text-[17px] font-bold text-gray-900">
                          {item.title}
                        </Text>
                        <Text className="text-[13px] font-semibold text-gray-300">{item.year}</Text>
                      </View>
                      {item.date_label ? (
                        <Text className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#059669]">
                          {item.date_label}
                        </Text>
                      ) : null}
                      {item.description ? (
                        <Text className="text-[15px] leading-[22px] text-gray-500">
                          {item.description}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Media Gallery Section ──────────────────────────────────── */}
        <View className="mb-12 px-6">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-[22px] font-bold text-gray-900">Media Gallery</Text>
            <TouchableOpacity onPress={() => router.push(`/member/gallery/${profileId}`)}>
              <Text className="text-[12px] font-bold uppercase tracking-wider text-[#059669]">
                VIEW ALL
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-4">
            {media.slice(0, 5).map((m, idx) => {
              if (m.type === 'audio') {
                return (
                  <View
                    key={m.id ?? idx}
                    style={{ width: itemSize, height: itemSize }}
                    className="items-center justify-center rounded-[24px] bg-[#f0f9ed]">
                    <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-white">
                      <Feather name="mic" size={18} color="#059669" />
                    </View>
                    <Text className="text-[9px] font-bold uppercase tracking-widest text-[#059669]">
                      VOICENOTE
                    </Text>
                  </View>
                );
              }
              
              const imageUrl = m.image_urls?.[0];
              if (!imageUrl) return null;

              return (
                <TouchableOpacity
                  key={m.id ?? idx}
                  onPress={() => setPreviewImage(imageUrl)}
                  activeOpacity={0.9}
                  style={{ width: itemSize, height: itemSize }}
                  className="overflow-hidden rounded-[24px] bg-gray-200">
                  <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
                </TouchableOpacity>
              );
            })}

            {/* Add Card */}
            {media.length < 6 && (
              <TouchableOpacity
                onPress={handleMediaAdd}
                disabled={mediaUploading}
                style={{ width: itemSize, height: itemSize }}
                className="items-center justify-center rounded-[24px] border-2 border-dashed border-gray-200">
                {mediaUploading ? (
                  <ActivityIndicator size="small" color="#d1d5db" />
                ) : (
                  <Feather name="plus" size={24} color="#d1d5db" />
                )}
              </TouchableOpacity>
            )}
            
            {/* If more than 5, show count */}
            {media.length >= 6 && (
              <TouchableOpacity
                onPress={() => router.push(`/member/gallery/${profileId}`)}
                style={{ width: itemSize, height: itemSize }}
                className="items-center justify-center rounded-[24px] bg-gray-100">
                <Text className="text-[18px] font-bold text-gray-400">+{media.length - 5}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Family Connections Section ─────────────────────────────── */}
        <View className="overflow-visible px-6 mb-12">
          <Text className="mb-6 text-[22px] font-bold text-gray-900">Family Connections</Text>

          {connections.length === 0 ? (
            <View className="items-center py-6">
              <Text className="text-[13px] text-gray-300">No connections yet.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-6 overflow-visible px-6">
              {connections.map((conn, idx) => (
                <TouchableOpacity
                  key={conn.profile.id ?? idx}
                  onPress={() => router.push(`/member/${conn.profile.id}`)}
                  className="mr-6 items-center">
                  <View className="mb-3 h-[80px] w-[80px] overflow-hidden rounded-full border-[3px] border-white bg-gray-100">
                    {conn.profile.avatar_url ? (
                      <Image source={{ uri: conn.profile.avatar_url }} className="h-full w-full" />
                    ) : (
                      <View className="flex-1 items-center justify-center bg-orange-100">
                        <Text className="text-xl font-bold text-orange-300">
                          {conn.profile.full_name?.[0]?.toUpperCase() ?? '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[13px] font-bold text-gray-900 text-center" numberOfLines={1}>
                    {conn.profile.full_name.split(' ')[0]}
                  </Text>
                  <Text className="text-[10px] font-semibold text-[#059669] uppercase tracking-wider">
                    {getRelationshipLabel(conn.relationshipType)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <ImagePreviewModal 
        visible={!!previewImage} 
        imageUrl={previewImage} 
        onClose={() => setPreviewImage(null)} 
      />
    </SafeAreaView>
  );
}

