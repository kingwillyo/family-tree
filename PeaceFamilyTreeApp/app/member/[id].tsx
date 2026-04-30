import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';

import { useAuth } from '../../lib/auth-context';
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
  addTimelineEvent,
  deleteTimelineEvent,
  uploadAvatar,
  uploadMemberMedia,
  createProposal,
  fetchCurrentProfile,
  deleteProfile,
} from '../../lib/treeService';

const { width } = Dimensions.get('window');

// ─── Icon options for the timeline event picker ────────────────────────────
const ICON_OPTIONS: Array<{ name: string; label: string }> = [
  { name: 'droplet', label: 'Birth' },
  { name: 'heart', label: 'Love' },
  { name: 'home', label: 'Home' },
  { name: 'briefcase', label: 'Work' },
  { name: 'book', label: 'School' },
  { name: 'globe', label: 'Travel' },
  { name: 'star', label: 'Award' },
  { name: 'corner-up-right', label: 'Move' },
  { name: 'circle', label: 'Other' },
];

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

// ─── Add Timeline Event Modal ─────────────────────────────────────────────

interface AddTimelineModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: { icon: string; year: string; title: string; dateLabel: string; description: string }) => Promise<void>;
  saving: boolean;
}

function AddTimelineModal({ visible, onClose, onSave, saving }: AddTimelineModalProps) {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [icon, setIcon] = useState('circle');
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [dateLabel, setDateLabel] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!year.trim() || !/^\d{4}$/.test(year.trim())) { setError('Enter a valid 4-digit year'); return; }
    setError('');
    await onSave({ icon, year: year.trim(), title: title.trim(), dateLabel: dateLabel.trim(), description: description.trim() });
    setIcon('circle');
    setYear('');
    setTitle('');
    setDateLabel('');
    setDescription('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end">
        <View className="rounded-t-[32px] bg-white dark:bg-slate-900 px-6 pt-6 pb-10"
          style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, elevation: 16 }}>
          {/* Handle */}
          <View className="mb-5 self-center h-1 w-12 rounded-full bg-gray-200 dark:bg-slate-800" />

          <Text className="mb-5 text-[20px] font-bold text-gray-900 dark:text-white">Add Life Event</Text>

          {/* Icon Picker */}
          <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
            Event Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 -mx-1">
            {ICON_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.name}
                onPress={() => setIcon(opt.name)}
                className={`mx-1 items-center rounded-2xl px-3 py-2 ${icon === opt.name ? 'bg-[#f0f9ed] dark:bg-emerald-950/20' : 'bg-gray-50 dark:bg-slate-800'}`}>
                <Feather name={opt.name as any} size={20} color={icon === opt.name ? '#059669' : (isDarkMode ? '#475569' : '#9ca3af')} />
                <Text className={`mt-1 text-[10px] font-bold ${icon === opt.name ? 'text-[#059669]' : 'text-gray-400 dark:text-slate-500'}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Year */}
          <Text className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Year *</Text>
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="e.g. 1985"
            placeholderTextColor={isDarkMode ? '#475569' : "#9ca3af"}
            keyboardType="number-pad"
            maxLength={4}
            className="mb-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-[15px] text-gray-900 dark:text-white"
          />

          {/* Title */}
          <Text className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Graduated from Cambridge"
            placeholderTextColor={isDarkMode ? '#475569' : "#9ca3af"}
            className="mb-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-[15px] text-gray-900 dark:text-white"
          />

          {/* Date Label */}
          <Text className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Date / Location</Text>
          <TextInput
            value={dateLabel}
            onChangeText={setDateLabel}
            placeholder="e.g. JUNE 15 • CAMBRIDGE"
            placeholderTextColor={isDarkMode ? '#475569' : "#9ca3af"}
            autoCapitalize="characters"
            className="mb-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-[15px] text-gray-900 dark:text-white"
          />

          {/* Description */}
          <Text className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note about this moment…"
            placeholderTextColor={isDarkMode ? '#475569' : "#9ca3af"}
            multiline
            numberOfLines={3}
            className="mb-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-[15px] text-gray-900 dark:text-white"
            style={{ textAlignVertical: 'top', minHeight: 72 }}
          />

          {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center rounded-2xl border border-gray-200 dark:border-slate-800 py-4">
              <Text className="text-[15px] font-bold text-gray-400 dark:text-slate-600">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="flex-[2] items-center rounded-2xl bg-[#8cc63f] py-4">
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-[15px] font-bold text-white">Save Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
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

export default function MemberProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [media, setMedia] = useState<Memory[]>([]);
  const [connections, setConnections] = useState<ProfileConnection[]>([]);
  const [stats, setStats] = useState<MemberStats>({ memoriesCount: 0, eventsCount: 0, childrenCount: 0, connectionsCount: 0 });
  const [loading, setLoading] = useState(true);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineSaving, setTimelineSaving] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isAdmin = currentProfile?.role === 'admin';
  const isOwnProfile = profile?.id === currentProfile?.id || (user && profile?.user_id === user.id);

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

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [p, currP, t, m, c, s] = await Promise.all([
      fetchProfileById(id),
      fetchCurrentProfile(),
      fetchTimelineEvents(id),
      fetchMemberMedia(id),
      fetchMemberConnections(id),
      fetchMemberStats(id),
    ]);
    setProfile(p);
    setCurrentProfile(currP);
    setTimeline(t);
    setMedia(m);
    setConnections(c);
    setStats(s);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarPress = async () => {
    if (!user || !id || !profile) return;
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

    // If Admin or Own Profile, upload directly
    if (isAdmin || isOwnProfile) {
      const res = await uploadAvatar(result.assets[0].uri, user.id, id);
      if ('error' in res) {
        Alert.alert('Upload failed', res.error);
      } else {
        setProfile((prev) => prev ? { ...prev, avatar_url: res.url } : prev);
      }
    } 
    // For non-admins, we restrict direct updates. 
    else {
      Alert.alert('Admin Only', 'Profile photo updates are currently restricted to administrators.');
    }
    setAvatarUploading(false);
  };

  // ── Gallery upload ───────────────────────────────────────────────────────
  const handleMediaAdd = async () => {
    if (!user || !id) return;
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
    const res = await uploadMemberMedia(result.assets[0].uri, user.id, id);
    if ('error' in res) {
      Alert.alert('Upload failed', res.error);
    } else {
      // Optimistically prepend
      setMedia((prev) => [{
        id: Date.now().toString(),
        author_profile_id: id,
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

  // ── Add timeline event ────────────────────────────────────────────────────
  const handleAddTimelineEvent = async (input: { icon: string; year: string; title: string; dateLabel: string; description: string }) => {
    if (!user || !id || !profile) return;
    setTimelineSaving(true);

    const eventData = {
      icon: input.icon,
      year: input.year,
      title: input.title,
      date_label: input.dateLabel,
      description: input.description,
      created_by: user.id
    };

    // 1. If Admin or Own Profile, add directly
    if (isAdmin || isOwnProfile) {
      const res = await addTimelineEvent(
        eventData,
        id,
        user.id
      );
      if ('error' in res) {
        Alert.alert('Failed to save', res.error);
      } else {
        setShowTimelineModal(false);
        // Reload timeline
        const updated = await fetchTimelineEvents(id);
        setTimeline(updated);
        // Update events count in stats
        setStats((prev) => ({ ...prev, eventsCount: prev.eventsCount + 1 }));
      }
    } 
    // 2. If Member, create proposal
    else {
      const res = await createProposal(id, id === 'current-user' ? profile.id : id, 'timeline_add', eventData);
      if (res.error) {
        Alert.alert('Error', res.error);
      } else {
        Alert.alert('Success', 'Your timeline event has been submitted for admin approval.');
        setShowTimelineModal(false);
      }
    }
    setTimelineSaving(false);
  };

  const handleDeleteTimelineEvent = async (event: TimelineEvent) => {
    if (!user || !id || !profile) return;

    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            // 1. If Admin or Own Profile, delete directly
            if (isAdmin || isOwnProfile) {
              const res = await deleteTimelineEvent(event.id);
              if (res.error) {
                Alert.alert('Error', res.error);
              } else {
                setTimeline((prev) => prev.filter((e) => e.id !== event.id));
                setStats((prev) => ({ ...prev, eventsCount: prev.eventsCount - 1 }));
              }
            } 
            // 2. If Member, create proposal (even for their own profile as per user request for consistency)
            else {
              const res = await createProposal(id, id === 'current-user' ? profile.id : id, 'timeline_delete', { event_id: event.id, title: event.title, year: event.year });
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
      <SafeAreaView className="flex-1 bg-[#fcFAF8] dark:bg-slate-950" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
            <Feather name="chevron-left" size={28} color={isDarkMode ? '#ffffff' : "#111827"} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 100, alignItems: 'center', paddingTop: 16 }}>
          <Animated.View style={{ opacity: shimmerOpacity }} className="mb-6 h-[140px] w-[140px] rounded-full bg-gray-200 dark:bg-slate-800" />
          <Animated.View style={{ opacity: shimmerOpacity }} className="mb-3 h-8 w-56 rounded-2xl bg-gray-200 dark:bg-slate-800" />
          <Animated.View style={{ opacity: shimmerOpacity }} className="mb-8 h-5 w-32 rounded-xl bg-gray-100 dark:bg-slate-900" />
          <View className="w-full flex-row justify-center gap-3 px-6">
            {[0, 1, 2].map((i) => (
              <Animated.View key={i} style={{ opacity: shimmerOpacity, flex: 0.33 }} className="h-20 rounded-[28px] bg-gray-100 dark:bg-slate-900" />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#fcFAF8] dark:bg-slate-950" edges={['top']}>
        <Text className="text-gray-400 dark:text-slate-500">Member not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-3">
          <Text className="text-[#059669] font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const itemSize = (width - 48 - 16) / 3;

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8] dark:bg-slate-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
          <Feather name="chevron-left" size={28} color={isDarkMode ? '#ffffff' : "#111827"} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity>
            <Feather name="share" size={24} color={isDarkMode ? '#ffffff' : "#111827"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            if (!profile) return;
            const options: any[] = [
              { text: 'Edit Profile', onPress: () => router.push(`/member/edit/${id}`) }
            ];

            const isOwnProfile = profile.id === currentProfile?.id || (user && profile.user_id === user.id);
            const isAdmin = currentProfile?.role === 'admin';
            const noUserId = profile.user_id == null;

            if (!isOwnProfile && isAdmin && noUserId) {
              options.push({
                text: 'Delete Profile',
                style: 'destructive',
                onPress: () => {
                  Alert.alert(
                    'Delete Profile',
                    `Are you sure you want to completely remove ${profile.full_name}? This action cannot be undone.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: async () => {
                          const { error } = await deleteProfile(profile.id);
                          if (error) {
                            Alert.alert('Error', error);
                          } else {
                            if (router.canGoBack()) {
                              router.back();
                            } else {
                              router.push('/(tabs)/tree');
                            }
                          }
                        }
                      }
                    ]
                  );
                }
              });
            }

            options.push({ text: 'Cancel', style: 'cancel' });
            Alert.alert('Profile Options', '', options);
          }}>
            <Feather name="more-horizontal" size={24} color={isDarkMode ? '#ffffff' : "#111827"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <View className="mt-2 items-center px-4">

          {/* Avatar */}
          <View className="relative mb-6">
            <View 
              className="h-[140px] w-[140px] overflow-hidden rounded-full border-4 bg-orange-100 dark:bg-orange-950/20"
              style={{ borderColor: profile.role === 'admin' ? '#FFD700' : (isDarkMode ? '#1e293b' : '#fcFAF8') }}>
              {avatarUploading ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="small" color="#8cc63f" />
                </View>
              ) : profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="h-full w-full"
                  style={{ backgroundColor: isDarkMode ? '#1e293b' : '#eccdae' }}
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                  <Text className="text-5xl font-extrabold text-orange-300 dark:text-orange-700">
                    {profile.full_name?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleAvatarPress}
              activeOpacity={0.7}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 h-12 w-12 items-center justify-center rounded-full border-4 border-[#fcFAF8] dark:border-slate-950 bg-[#8cc63f]">
              <Feather name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Name & Dates */}
          <Text className="mb-2 px-8 text-center text-[32px] font-extrabold leading-[38px] text-[#111827] dark:text-white">
            {profile.full_name}
          </Text>
          <Text className="mb-6 text-[17px] font-medium text-gray-400 dark:text-slate-500">
            {formatDates(profile)}
          </Text>

          {/* Badges */}
          <View className="mb-8 flex-row items-center justify-center gap-3 flex-wrap px-4">
            <View className="rounded-full border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2">
              <Text className="text-[11px] font-bold tracking-widest text-gray-500 dark:text-slate-400">
                {getRoleBadge(profile)}
              </Text>
            </View>
            <View className="rounded-full border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2">
              <Text className="text-[11px] font-bold tracking-widest text-gray-500 dark:text-slate-400">
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
                className="flex-[0.33] items-center rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-4">
                <Text className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</Text>
                <Text className="text-[9px] font-bold tracking-wider text-gray-400 dark:text-slate-500">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Bio Section */}
          {profile.bio ? (
            <View className="mb-10 w-full px-6">
              <Text className="mb-3 text-[14px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                Life Summary
              </Text>
              <View className="rounded-[24px] bg-white dark:bg-slate-900 p-6 border border-gray-100 dark:border-slate-800">
                <Text className="text-[16px] leading-[26px] text-gray-600 dark:text-slate-400">
                  {profile.bio}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ── Life Timeline Section ─────────────────────────────────── */}
        <View className="mb-12 px-6">
          <View className="mb-8 flex-row items-center justify-between">
            <Text className="text-[22px] font-bold text-gray-900 dark:text-white">Life Timeline</Text>
            <TouchableOpacity
              onPress={() => setShowTimelineModal(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#f0f9ed] dark:bg-emerald-950/20">
              <Feather name="plus" size={20} color="#059669" />
            </TouchableOpacity>
          </View>

          {timeline.length === 0 ? (
            <TouchableOpacity
              onPress={() => setShowTimelineModal(true)}
              className="items-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800 py-10">
              <Feather name="clock" size={28} color={isDarkMode ? '#334155' : "#d1d5db"} />
              <Text className="mt-3 text-[13px] font-semibold text-gray-300 dark:text-slate-600">Add the first life event</Text>
            </TouchableOpacity>
          ) : (
            <View className="pl-[20px]">
              {timeline.map((item, index) => {
                const isLast = index === timeline.length - 1;
                return (
                  <View key={item.id} className="relative mb-6">
                    {!isLast && (
                      <View className="absolute bottom-[-40px] left-[3px] top-[40px] w-[2px] bg-gray-200 dark:bg-slate-800" />
                    )}
                    <View className="absolute left-[-20px] top-6 z-10 h-10 w-10 items-center justify-center rounded-full border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <Feather
                        name={(item.icon as any) || 'circle'}
                        size={16}
                        color={index === 0 ? '#059669' : (isDarkMode ? '#475569' : '#d1d5db')}
                      />
                    </View>
                    <TouchableOpacity 
                      onLongPress={() => handleDeleteTimelineEvent(item)}
                      delayLongPress={500}
                      className="ml-[36px] rounded-[24px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                      <View className="mb-1 flex-row items-start justify-between">
                        <Text className="flex-1 pr-2 text-[17px] font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </Text>
                        <Text className="text-[13px] font-semibold text-gray-300 dark:text-slate-600">{item.year}</Text>
                      </View>
                      {item.date_label ? (
                        <Text className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#059669]">
                          {item.date_label}
                        </Text>
                      ) : null}
                      {item.description ? (
                        <Text className="text-[15px] leading-[22px] text-gray-500 dark:text-slate-400">
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
            <Text className="text-[22px] font-bold text-gray-900 dark:text-white">Media Gallery</Text>
            <TouchableOpacity onPress={() => router.push(`/member/gallery/${id}`)}>
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
                    className="items-center justify-center rounded-[24px] bg-[#f0f9ed] dark:bg-emerald-950/20">
                    <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-900">
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
                  className="overflow-hidden rounded-[24px] bg-gray-200 dark:bg-slate-800">
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
                className="items-center justify-center rounded-[24px] border-2 border-dashed border-gray-200 dark:border-slate-800">
                {mediaUploading ? (
                  <ActivityIndicator size="small" color="#d1d5db" />
                ) : (
                  <Feather name="plus" size={24} color={isDarkMode ? '#334155' : "#d1d5db"} />
                )}
              </TouchableOpacity>
            )}
            
            {/* If more than 5, show the + count or just cap it */}
            {media.length >= 6 && (
              <TouchableOpacity
                onPress={() => router.push(`/member/gallery/${id}`)}
                style={{ width: itemSize, height: itemSize }}
                className="items-center justify-center rounded-[24px] bg-gray-100 dark:bg-slate-900">
                <Text className="text-[18px] font-bold text-gray-400 dark:text-slate-600">+{media.length - 5}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Family Connections Section ─────────────────────────────── */}
        <View className="overflow-visible px-6">
          <Text className="mb-6 text-[22px] font-bold text-gray-900 dark:text-white">Family Connections</Text>

          {connections.length === 0 ? (
            <View className="items-center py-6">
              <Text className="text-[13px] text-gray-300 dark:text-slate-600">No connections yet.</Text>
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
                  <View className="mb-3 h-[80px] w-[80px] overflow-hidden rounded-full border-[3px] border-white dark:border-slate-950 bg-gray-100 dark:bg-slate-900">
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

              {/* Add Connection placeholder */}
              <View className="mr-6 items-center">
                <TouchableOpacity className="mb-3 h-[80px] w-[80px] items-center justify-center rounded-full border-2 border-dashed border-gray-300">
                  <Text className="text-2xl font-bold text-gray-300">+</Text>
                </TouchableOpacity>
                <Text className="text-[14px] font-bold text-gray-300">Add</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Add Timeline Event Modal */}
      <AddTimelineModal
        visible={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        onSave={handleAddTimelineEvent}
        saving={timelineSaving}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal 
        visible={!!previewImage} 
        imageUrl={previewImage} 
        onClose={() => setPreviewImage(null)} 
      />
    </SafeAreaView>
  );
}
