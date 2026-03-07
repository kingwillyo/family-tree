import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';

export default function AddMemberScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD
  const [dod, setDod] = useState('');
  const [bio, setBio] = useState('');
  const [isLiving, setIsLiving] = useState(true);
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('profiles').insert({
        full_name: fullName.trim(),
        date_of_birth: dob || null,
        date_of_death: dod || null,
        bio: bio.trim() || null,
        is_living: isLiving,
        visibility,
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        router.back();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-base font-medium text-emerald-600">← Cancel</Text>
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900">Add Member</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="rounded-full bg-emerald-600 px-4 py-2">
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-sm font-semibold text-white">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-12"
          keyboardShouldPersistTaps="handled">
          {/* Avatar placeholder */}
          <View className="mb-6 items-center pt-4">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
              <Text className="text-5xl">👤</Text>
            </View>
            <Text className="mt-2 text-sm text-gray-400">Photo upload coming soon</Text>
          </View>

          {/* Form fields */}
          <Input
            label="Full Name *"
            placeholder="e.g. Grace Adeyemi"
            value={fullName}
            onChangeText={setFullName}
            error={error && !fullName.trim() ? error : ''}
          />

          <Input
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={dob}
            onChangeText={setDob}
            keyboardType="numbers-and-punctuation"
          />

          <Input
            label="Date of Death"
            placeholder="YYYY-MM-DD (leave blank if living)"
            value={dod}
            onChangeText={(v) => {
              setDod(v);
              if (v) setIsLiving(false);
            }}
            keyboardType="numbers-and-punctuation"
          />

          <Input
            label="Life Summary / Bio"
            placeholder="A short biography or memorable story…"
            value={bio}
            onChangeText={setBio}
            multiline
          />

          {/* Toggles */}
          <View className="mt-2 rounded-2xl border border-gray-100 bg-white p-4">
            <View className="flex-row items-center justify-between py-2">
              <View>
                <Text className="font-semibold text-gray-900">Living</Text>
                <Text className="text-xs text-gray-400">Is this person still alive?</Text>
              </View>
              <Switch
                value={isLiving}
                onValueChange={setIsLiving}
                trackColor={{ true: '#059669' }}
              />
            </View>

            <View className="my-1 border-t border-gray-100" />

            <View className="flex-row items-center justify-between py-2">
              <View>
                <Text className="font-semibold text-gray-900">Private</Text>
                <Text className="text-xs text-gray-400">
                  Hidden from viewers (admin/editors only)
                </Text>
              </View>
              <Switch
                value={visibility === 'private'}
                onValueChange={(v) => setVisibility(v ? 'private' : 'family')}
                trackColor={{ true: '#d97706' }}
              />
            </View>
          </View>

          {error && fullName.trim() ? (
            <Text className="mt-3 text-sm text-red-500">{error}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
