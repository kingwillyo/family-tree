import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Input } from '../../../components/Input';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../../components/Button';

export default function EditMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [dod, setDod] = useState('');
  const [bio, setBio] = useState('');
  const [isLiving, setIsLiving] = useState(true);
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, date_of_birth, date_of_death, bio, is_living, visibility')
        .eq('id', id)
        .single();

      if (data) {
        setFullName(data.full_name ?? '');
        setDob(data.date_of_birth ?? '');
        setDod(data.date_of_death ?? '');
        setBio(data.bio ?? '');
        setIsLiving(data.is_living ?? true);
        setVisibility(data.visibility === 'private' ? 'private' : 'family');
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleSave = async () => {
    setError('');
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          date_of_birth: dob || null,
          date_of_death: dod || null,
          bio: bio.trim() || null,
          is_living: isLiving,
          visibility,
        })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
      } else {
        router.back();
      }
    } finally {
      setSaving(false);
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-[#fcfcfb]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
          <Feather name="x" size={24} color="#6d7b73" />
        </TouchableOpacity>
        <Text className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#3e4d44]">
          Edit Member
        </Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={saving}
          className="h-10 items-center justify-center">
          {saving ? (
            <ActivityIndicator size="small" color="#8cc63f" />
          ) : (
            <Text className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8cc63f]">
              Done
            </Text>
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
          <View className="mb-8">
            <Input
              label="Full Name *"
              placeholder="e.g. Grace Adeyemi"
              value={fullName}
              onChangeText={setFullName}
              error={error && !fullName.trim() ? error : ''}
            />
          </View>

          <View className="mb-8">
            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={dob}
              onChangeText={setDob}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View className="mb-8">
            <Input
              label="Date of Death"
              placeholder="YYYY-MM-DD"
              value={dod}
              onChangeText={(v) => {
                setDod(v);
                if (v) setIsLiving(false);
              }}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View className="mb-10">
            <Input
              label="Life Summary / Bio"
              placeholder="A short biography or memorable story…"
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>

          {/* Privacy Settings Section */}
          <View className="rounded-[32px] bg-white p-6 mb-10" style={styles.cardShadow}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-[#1a2b21]">
                  Still Living
                </Text>
                <Text className="text-[12px] text-[#9aa7a0] mt-1">
                  Toggle off for deceased relatives
                </Text>
              </View>
              <Switch
                value={isLiving}
                onValueChange={setIsLiving}
                trackColor={{ false: '#e2e8e4', true: '#8cc63f' }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : '#ffffff'}
                ios_backgroundColor="#e2e8e4"
              />
            </View>
          </View>

          <Button
            title="Update Member"
            onPress={handleSave}
            loading={saving}
            variant="brand"
          />

          {error && fullName.trim() ? (
            <Text className="mt-3 text-sm text-red-500">{error}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#4a6b57',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
});
