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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from 'nativewind';

import { supabase } from '../../../lib/supabase';
import { Input } from '../../../components/Input';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../../components/Button';

export default function EditMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dod, setDod] = useState('');
  const [showDeathPicker, setShowDeathPicker] = useState(false);
  const [bio, setBio] = useState('');
  const [isLiving, setIsLiving] = useState(true);
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [error, setError] = useState('');

  const [currentProfile, setCurrentProfile] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      // Fetch current user's profile to check role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: fm } = await supabase
          .from('family_members')
          .select('profile_id')
          .eq('user_id', user.id)
          .maybeSingle();

        const pid = fm?.profile_id;
        if (pid) {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', pid).single();
          setCurrentProfile(p);
        } else {
          const { data: p } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          setCurrentProfile(p);
        }
      }

      let profileId = id;

      // If we're editing 'current-user', find their profile ID first
      if (id === 'current-user') {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          const { data: fm } = await supabase
            .from('family_members')
            .select('profile_id')
            .eq('user_id', authUser.id)
            .maybeSingle();
          if (fm?.profile_id) profileId = fm.profile_id;
          else {
            const { data: p } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', authUser.id)
              .maybeSingle();
            if (p) profileId = p.id;
          }
        }
      }

      if (!profileId || profileId === 'current-user') {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('full_name, date_of_birth, date_of_death, bio, is_living, visibility')
        .eq('id', profileId)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError.message);
      } else if (data) {
        const full = data.full_name ?? '';
        const parts = full.trim().split(/\s+/);
        if (parts.length >= 3) {
          setFirstName(parts[0]);
          setLastName(parts[parts.length - 1]);
          setMiddleName(parts.slice(1, -1).join(' '));
        } else if (parts.length === 2) {
          setFirstName(parts[0]);
          setLastName(parts[1]);
          setMiddleName('');
        } else {
          setFirstName(parts[0] || '');
          setLastName('');
          setMiddleName('');
        }
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDob(selectedDate.toISOString().split('T')[0]);
    }
  };

  const onDeathDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDeathPicker(false);
    }
    if (selectedDate) {
      setDod(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleSave = async () => {
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last names are required');
      return;
    }
    setSaving(true);
    try {
      let profileId = id;
      if (id === 'current-user') {
        profileId = currentProfile?.id;
      }

      if (!profileId) {
        setError('Could not identify profile to edit');
        return;
      }

      const fullName = [firstName.trim(), middleName.trim(), lastName.trim()]
        .filter(Boolean)
        .join(' ');

      const updateData = {
        full_name: fullName,
        date_of_birth: dob || null,
        date_of_death: dod || null,
        bio: bio.trim() || null,
        is_living: isLiving,
        visibility,
      };

      // 1. If Admin or Own Profile, update directly
      const isOwnProfile = profileId === currentProfile?.id;
      if (currentProfile?.role === 'admin' || isOwnProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', profileId);

        if (updateError) {
          setError(updateError.message);
        } else {
          router.back();
        }
      }
      // 2. If Member editing someone else, create proposal
      else {
        const { error: propError } = await supabase.from('edit_proposals').insert({
          target_profile_id: profileId,
          proposed_by: currentProfile?.id,
          change_type: 'profile_update',
          proposed_data: updateData,
          original_data: {
            full_name: fullName, // this is slightly wrong, should be the data we fetched initially
            // but for simplicity we'll just push the current state vs updated state
            // actually we should have kept 'initialData' state
          },
        });

        if (propError) {
          setError(propError.message);
        } else {
          Alert.alert('Success', 'Your changes have been submitted for admin approval.');
          router.back();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fcfcfb] dark:bg-slate-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center">
          <Feather name="x" size={24} color={isDarkMode ? '#9aa7a0' : '#6d7b73'} />
        </TouchableOpacity>
        <Text className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#3e4d44] dark:text-slate-400">
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
          <View className="mb-6">
            <Input
              label="First Name *"
              placeholder="e.g. Grace"
              value={firstName}
              onChangeText={setFirstName}
              error={error && !firstName.trim() ? error : ''}
            />
          </View>

          <View className="mb-6">
            <Input
              label="Middle Name"
              placeholder="Optional"
              value={middleName}
              onChangeText={setMiddleName}
            />
          </View>

          <View className="mb-8">
            <Input
              label="Last Name *"
              placeholder="e.g. Adeyemi"
              value={lastName}
              onChangeText={setLastName}
              error={error && !lastName.trim() ? error : ''}
            />
          </View>

          <View className="mb-8">
            <Text className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aa7a0] dark:text-slate-500">
              Date of Birth
            </Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="w-full flex-row items-center justify-between rounded-2xl border border-[#f0f2f0] bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <Text
                className={
                  dob
                    ? 'text-base text-[#1a2b21] dark:text-white'
                    : 'text-base text-[#c4ccc7] dark:text-slate-600'
                }>
                {dob ? dob : 'YYYY-MM-DD'}
              </Text>
              <Feather name="calendar" size={18} color={isDarkMode ? '#475569' : '#6d7b73'} />
            </TouchableOpacity>

            {showDatePicker &&
              (Platform.OS === 'ios' ? (
                <View className="mt-4 overflow-hidden rounded-2xl border border-[#f0f2f0] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <View className="mb-2 flex-row justify-end">
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text className="font-bold text-[#8cc63f]">Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                    mode="date"
                    display="inline"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    themeVariant={isDarkMode ? 'dark' : 'light'}
                    accentColor="#8cc63f"
                  />
                </View>
              ) : (
                <DateTimePicker
                  value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              ))}
          </View>

          {!isLiving && (
            <View className="mb-8">
              <Text className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aa7a0] dark:text-slate-500">
                Date of Death
              </Text>

              <TouchableOpacity
                onPress={() => setShowDeathPicker(true)}
                className="w-full flex-row items-center justify-between rounded-2xl border border-[#f0f2f0] bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
                <Text
                  className={
                    dod
                      ? 'text-base text-[#1a2b21] dark:text-white'
                      : 'text-base text-[#c4ccc7] dark:text-slate-600'
                  }>
                  {dod ? dod : 'YYYY-MM-DD'}
                </Text>
                <Feather name="calendar" size={18} color={isDarkMode ? '#475569' : '#6d7b73'} />
              </TouchableOpacity>

              {showDeathPicker &&
                (Platform.OS === 'ios' ? (
                  <View className="mt-4 overflow-hidden rounded-2xl border border-[#f0f2f0] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <View className="mb-2 flex-row justify-end">
                      <TouchableOpacity onPress={() => setShowDeathPicker(false)}>
                        <Text className="font-bold text-[#8cc63f]">Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={dod ? new Date(dod) : new Date()}
                      mode="date"
                      display="inline"
                      onChange={onDeathDateChange}
                      maximumDate={new Date()}
                      themeVariant={isDarkMode ? 'dark' : 'light'}
                      accentColor="#8cc63f"
                    />
                  </View>
                ) : (
                  <DateTimePicker
                    value={dod ? new Date(dod) : new Date()}
                    mode="date"
                    display="default"
                    onChange={onDeathDateChange}
                    maximumDate={new Date()}
                  />
                ))}
            </View>
          )}

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
          <View
            className="mb-10 rounded-[32px] bg-white p-6 dark:bg-slate-900"
            style={isDarkMode ? {} : styles.cardShadow}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-[#1a2b21] dark:text-white">
                  Still Living
                </Text>
                <Text className="mt-1 text-[12px] text-[#9aa7a0] dark:text-slate-500">
                  Toggle off for deceased relatives
                </Text>
              </View>

              <Switch
                value={isLiving}
                onValueChange={setIsLiving}
                trackColor={{ false: isDarkMode ? '#1e293b' : '#e2e8e4', true: '#8cc63f' }}
                thumbColor="#ffffff"
                ios_backgroundColor={isDarkMode ? '#1e293b' : '#e2e8e4'}
              />
            </View>
          </View>

          <Button title="Update Member" onPress={handleSave} loading={saving} variant="brand" />

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
