import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';

export default function AddMemberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    relativeId?: string;
    relativeName?: string;
    relationType?: string;
  }>();
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [relation, setRelation] = useState(params.relationType || 'child');
  const [isLiving, setIsLiving] = useState(true);
  const [error, setError] = useState('');

  const handleClear = () => {
    setFirstName('');
    setLastName('');
    setDob('');
    setBirthPlace('');
    setIsLiving(true);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('profiles').insert({
        full_name: fullName,
        date_of_birth: dob || null,
        birth_place: birthPlace || null,
        is_living: isLiving,
        visibility: 'family',
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
    <SafeAreaView className="flex-1 bg-[#fcfcfb]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
          <Feather name="x" size={24} color="#6d7b73" />
        </TouchableOpacity>
        <Text className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#3e4d44]">
          Add Member
        </Text>
        <TouchableOpacity onPress={handleClear} className="h-10 items-center justify-center">
          <Text className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#849f8d]">
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-20"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Avatar Section */}
          <View className="mb-10 items-center pt-6">
            <View className="relative">
              <View className="h-[120px] w-[120px] items-center justify-center rounded-full border-2 border-dashed border-[#d3d9d6] bg-white">
                <Feather name="camera" size={32} color="#c4ccc7" />
              </View>
              <View className="absolute bottom-0 right-1 h-8 w-8 items-center justify-center rounded-full bg-[#8cc63f] border-2 border-white">
                <Feather name="plus" size={18} color="white" />
              </View>
            </View>
            <Text className="mt-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9aa7a0]">
              Add Portrait
            </Text>
          </View>

          {/* Personal Information Section */}
          <Text className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9aa7a0]">
            Personal Information
          </Text>

          <View className="mb-5">
            <Text className="mb-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#9aa7a0]">
              First Name
            </Text>
            <TextInput
              className="h-14 w-full rounded-2xl border border-[#f0f2f0] bg-white px-5 text-base text-[#1a2b21]"
              placeholder="e.g. Eleanor"
              placeholderTextColor="#c4ccc7"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#9aa7a0]">
              Last Name
            </Text>
            <TextInput
              className="h-14 w-full rounded-2xl border border-[#f0f2f0] bg-white px-5 text-base text-[#1a2b21]"
              placeholder="e.g. Rigby"
              placeholderTextColor="#c4ccc7"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#9aa7a0]">
              Birth Date
            </Text>
            <View className="relative">
              <TextInput
                className="h-14 w-full rounded-2xl border border-[#f0f2f0] bg-white px-5 pr-12 text-base text-[#1a2b21]"
                placeholder="mm/dd/yyyy"
                placeholderTextColor="#c4ccc7"
                value={dob}
                onChangeText={setDob}
              />
              <View className="absolute right-5 top-4">
                <Feather name="calendar" size={18} color="#6d7b73" />
              </View>
            </View>
          </View>

          <View className="mb-8">
            <Text className="mb-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#9aa7a0]">
              Birth Place
            </Text>
            <View className="relative">
              <TextInput
                className="h-14 w-full rounded-2xl border border-[#f0f2f0] bg-white px-5 pr-12 text-base text-[#1a2b21]"
                placeholder="City, Country"
                placeholderTextColor="#c4ccc7"
                value={birthPlace}
                onChangeText={setBirthPlace}
              />
              <View className="absolute right-5 top-4">
                <Feather name="map-pin" size={18} color="#c4ccc7" />
              </View>
            </View>
          </View>

          {/* Relationship Section */}
          <View className="mb-10">
            <Text className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9aa7a0]">
              Relationship
            </Text>
            <View className="flex-row gap-3">
              {['child', 'spouse', 'parent'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setRelation(type)}
                  className={`flex-1 items-center justify-center rounded-2xl border py-4 ${
                    relation === type
                      ? 'border-[#8cc63f] bg-[#f8fcf4]'
                      : 'border-[#f0f2f0] bg-white'
                  }`}>
                  <Text
                    className={`text-[12px] font-bold uppercase tracking-[0.05em] ${
                      relation === type ? 'text-[#3e4d44]' : 'text-[#9aa7a0]'
                    }`}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {(params.relativeId || params.relativeName) && (
              <Text className="mt-4 text-center text-[11px] font-medium text-[#849f8d]">
                Adding as {relation} to {params.relativeName || 'relative'}
              </Text>
            )}
          </View>

          {/* Privacy Settings Section */}
          <View className="rounded-[32px] bg-white p-6" style={styles.cardShadow}>
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

          {/* Action Buttons */}
          <View className="mt-10 items-center">
            <Button
              title="Save Member"
              onPress={handleSave}
              loading={saving}
              variant="brand"
            />

            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 h-12 items-center justify-center">
              <Text className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#9aa7a0]">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          
          {error ? (
            <Text className="mt-4 text-center text-sm text-red-500">{error}</Text>
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
  toggleShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
