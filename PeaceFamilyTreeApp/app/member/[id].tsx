import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { RelationshipBadge } from '../../components/RelationshipBadge';
import { MemberCard, MemberProfile } from '../../components/MemberCard';

interface Relationship {
  id: string;
  type: 'parent' | 'child' | 'spouse';
  profile: MemberProfile;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'editor';

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select(
            'id, full_name, avatar_url, date_of_birth, date_of_death, bio, is_living, visibility'
          )
          .eq('id', id)
          .single();

        if (!mounted) return;
        if (profileData) setProfile(profileData);

        // Fetch relationships where this person is person_a
        const { data: relsA } = await supabase
          .from('relationships')
          .select('id, type, person_b_id')
          .eq('person_a_id', id);

        // Fetch relationships where this person is person_b
        const { data: relsB } = await supabase
          .from('relationships')
          .select('id, type, person_a_id')
          .eq('person_b_id', id);

        if (!mounted) return;

        const allRels: Relationship[] = [];

        if (relsA) {
          for (const rel of relsA) {
            const { data: p } = await supabase
              .from('profiles')
              .select(
                'id, full_name, avatar_url, date_of_birth, date_of_death, bio, is_living, visibility'
              )
              .eq('id', rel.person_b_id)
              .single();
            if (p && mounted) allRels.push({ id: rel.id, type: rel.type, profile: p });
          }
        }

        if (relsB) {
          for (const rel of relsB) {
            // Mirror relationship type
            let mirroredType: 'parent' | 'child' | 'spouse' = rel.type;
            if (rel.type === 'parent') mirroredType = 'child';
            else if (rel.type === 'child') mirroredType = 'parent';

            const { data: p } = await supabase
              .from('profiles')
              .select(
                'id, full_name, avatar_url, date_of_birth, date_of_death, bio, is_living, visibility'
              )
              .eq('id', rel.person_a_id)
              .single();
            if (p && mounted) allRels.push({ id: rel.id, type: mirroredType, profile: p });
          }
        }

        if (mounted) setRelationships(allRels);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Member', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('profiles').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-400">Member not found</Text>
      </SafeAreaView>
    );
  }

  const birthYear = profile.date_of_birth ? new Date(profile.date_of_birth).getFullYear() : null;
  const deathYear = profile.date_of_death ? new Date(profile.date_of_death).getFullYear() : null;
  const initials = getInitials(profile.full_name);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-base font-medium text-emerald-600">← Back</Text>
        </TouchableOpacity>
        {canEdit && (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push(`/member/edit/${id}` as any)}
              className="rounded-full bg-emerald-50 px-4 py-2">
              <Text className="text-sm font-semibold text-emerald-700">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} className="rounded-full bg-red-50 px-4 py-2">
              <Text className="text-sm font-semibold text-red-600">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
        {/* Hero */}
        <View className="items-center px-6 pb-6 pt-4">
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              className="mb-4 h-28 w-28 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="mb-4 h-28 w-28 items-center justify-center rounded-full bg-emerald-100">
              <Text className="text-4xl font-bold text-emerald-700">{initials}</Text>
            </View>
          )}
          <Text className="text-2xl font-bold text-gray-900">{profile.full_name ?? 'Unknown'}</Text>
          <Text className="mt-1 text-sm text-gray-400">
            {birthYear
              ? deathYear
                ? `${birthYear} – ${deathYear}`
                : profile.is_living
                  ? `Born ${birthYear}`
                  : `b. ${birthYear}`
              : 'Unknown dates'}
          </Text>
          <View className="mt-3 flex-row gap-2">
            {!profile.is_living && (
              <View className="rounded-full bg-gray-200 px-3 py-1">
                <Text className="text-xs text-gray-500">Deceased</Text>
              </View>
            )}
            {profile.visibility === 'private' && (
              <View className="rounded-full bg-amber-100 px-3 py-1">
                <Text className="text-xs text-amber-700">🔒 Private</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View className="mx-6 mb-6 rounded-2xl border border-gray-100 bg-white p-4">
            <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Life Summary
            </Text>
            <Text className="leading-relaxed text-gray-700">{profile.bio}</Text>
          </View>
        ) : null}

        {/* Relationships */}
        <View className="px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">Family Connections</Text>
            {canEdit && (
              <TouchableOpacity
                onPress={() => router.push(`/member/relationships/${id}` as any)}
                className="rounded-full bg-emerald-50 px-3 py-1.5">
                <Text className="text-xs font-semibold text-emerald-700">Manage</Text>
              </TouchableOpacity>
            )}
          </View>

          {relationships.length === 0 ? (
            <View className="items-center rounded-2xl border border-gray-100 bg-white py-10">
              <Text className="text-3xl">🔗</Text>
              <Text className="mt-2 text-sm text-gray-400">No connections yet</Text>
            </View>
          ) : (
            relationships.map((rel) => (
              <View key={rel.id}>
                <View className="mb-1 flex-row items-center">
                  <RelationshipBadge type={rel.type} />
                </View>
                <MemberCard profile={rel.profile} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
