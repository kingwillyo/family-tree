import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { MemberCard, MemberProfile } from '../../components/MemberCard';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberProfile[]>([]);
  const [allMembers, setAllMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load all members initially
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select(
          'id, full_name, avatar_url, date_of_birth, date_of_death, bio, is_living, visibility'
        )
        .order('full_name', { ascending: true });
      setAllMembers(data ?? []);
      setResults(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults(allMembers);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select(
          'id, full_name, avatar_url, date_of_birth, date_of_death, bio, is_living, visibility'
        )
        .ilike('full_name', `%${query.trim()}%`)
        .order('full_name', { ascending: true });
      setResults(data ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, allMembers]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 pb-3 pt-4">
        <Text className="mb-4 text-3xl font-bold text-gray-900">Search</Text>
        <View className="flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <Text className="mr-2 text-lg">🔍</Text>
          <TextInput
            className="flex-1 text-base text-gray-800"
            placeholder="Search by name…"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            placeholderTextColor="#9ca3af"
            clearButtonMode="while-editing"
          />
          {searching && <ActivityIndicator size="small" color="#059669" />}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemberCard profile={item} />}
          contentContainerClassName="px-6 pb-24"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="mb-3 text-5xl">🔍</Text>
              <Text className="text-base font-medium text-gray-400">
                {query ? `No results for "${query}"` : 'No members found'}
              </Text>
            </View>
          }
          ListHeaderComponent={
            results.length > 0 ? (
              <Text className="mb-3 text-sm text-gray-400">
                {results.length} {results.length === 1 ? 'member' : 'members'} found
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
