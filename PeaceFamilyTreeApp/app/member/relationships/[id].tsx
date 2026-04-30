import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { MemberCard, MemberProfile } from '../../../components/MemberCard';
import { RelationshipBadge } from '../../../components/RelationshipBadge';

type RelType = 'parent' | 'child' | 'spouse';

interface ExistingRel {
  id: string;
  type: RelType;
  otherId: string;
  otherName: string | null;
}

export default function RelationshipsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [memberName, setMemberName] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingRel[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<MemberProfile[]>([]);
  const [selectedType, setSelectedType] = useState<RelType>('parent');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchExisting = async () => {
    const [relsA, relsB] = await Promise.all([
      supabase.from('relationships').select('id, type, person_b_id').eq('person_a_id', id),
      supabase.from('relationships').select('id, type, person_a_id').eq('person_b_id', id),
    ]);

    const rels: ExistingRel[] = [];

    if (relsA.data) {
      for (const r of relsA.data) {
        const { data: p } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', r.person_b_id)
          .single();
        rels.push({
          id: r.id,
          type: r.type,
          otherId: r.person_b_id,
          otherName: p?.full_name ?? null,
        });
      }
    }
    if (relsB.data) {
      for (const r of relsB.data) {
        let mirrored: RelType = r.type;
        if (r.type === 'parent') mirrored = 'child';
        else if (r.type === 'child') mirrored = 'parent';
        const { data: p } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', r.person_a_id)
          .single();
        rels.push({
          id: r.id,
          type: mirrored,
          otherId: r.person_a_id,
          otherName: p?.full_name ?? null,
        });
      }
    }
    setExisting(rels);
  };

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', id).single();
      setMemberName(data?.full_name ?? null);
      await fetchExisting();
      setLoading(false);
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select(
          'id, full_name, avatar_url, date_of_birth, date_of_death, bio, is_living, visibility'
        )
        .ilike('full_name', `%${search.trim()}%`)
        .neq('id', id)
        .limit(20);
      setResults(data ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAdd = async (targetId: string) => {
    setSaving(true);
    await supabase.from('relationships').upsert({
      person_a_id: id,
      person_b_id: targetId,
      type: selectedType,
    });
    setSaving(false);
    setSearch('');
    setResults([]);
    await fetchExisting();
  };

  const handleRemove = async (relId: string) => {
    await supabase.from('relationships').delete().eq('id', relId);
    await fetchExisting();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-base font-medium text-emerald-600">← Back</Text>
        </TouchableOpacity>
        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
          {memberName ?? 'Relationships'}
        </Text>
        <View className="w-16" />
      </View>

      <FlatList
        data={results.length > 0 ? results : existing}
        keyExtractor={(item) => ('otherId' in item ? item.id : (item as MemberProfile).id)}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-12"
        ListHeaderComponent={
          <View>
            {/* Existing */}
            <Text className="mb-3 text-lg font-bold text-gray-900">Current Connections</Text>
            {existing.length === 0 && (
              <View className="mb-4 items-center rounded-2xl border border-gray-100 bg-white py-8">
                <Text className="text-gray-400">No connections yet</Text>
              </View>
            )}
            {existing.map((rel) => (
              <View key={rel.id} className="mb-2 flex-row items-center gap-2">
                <RelationshipBadge type={rel.type} />
                <Text className="flex-1 font-medium text-gray-800">
                  {rel.otherName ?? 'Unknown'}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(rel.id)}
                  className="rounded-full bg-red-50 px-3 py-1">
                  <Text className="text-xs font-semibold text-red-500">Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add section */}
            <Text className="mb-3 mt-6 text-lg font-bold text-gray-900">Add Connection</Text>

            {/* Type selector */}
            <View className="mb-4 flex-row gap-2">
              {(['parent', 'child', 'spouse'] as RelType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSelectedType(t)}
                  className={`flex-1 rounded-full py-2 ${selectedType === t ? 'bg-emerald-600' : 'border border-gray-200 bg-white'}`}>
                  <Text
                    className={`text-center text-sm font-semibold capitalize ${selectedType === t ? 'text-white' : 'text-gray-600'}`}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search */}
            <View className="mb-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <Text className="mr-2 text-lg">🔍</Text>
              <TextInput
                className="flex-1 text-base text-gray-800"
                placeholder="Search members by name…"
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#9ca3af"
              />
              {searching && <ActivityIndicator size="small" color="#059669" />}
            </View>

            {results.length > 0 && (
              <Text className="mb-2 text-sm font-medium text-gray-500">
                Tap a member to add as{' '}
                <Text className="capitalize text-emerald-600">{selectedType}</Text>
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if ('otherId' in item) return null; // existing rels already shown in header
          const profile = item as MemberProfile;
          return (
            <TouchableOpacity onPress={() => handleAdd(profile.id)} disabled={saving}>
              <MemberCard profile={profile} onPress={() => handleAdd(profile.id)} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
