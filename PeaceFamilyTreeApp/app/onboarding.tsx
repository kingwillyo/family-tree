import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../lib/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'react-router-native'; // Wait, let's use expo-router

import { useRouter as useExpoRouter } from 'expo-router';

export default function OnboardingScreen() {
  const { user, refreshProfile, signOut } = useAuth();
  const router = useExpoRouter();
  
  const [step, setStep] = useState<'name' | 'dob_gender'>('name');
  
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Basic date of birth as YYYY-MM-DD for now.
  const [dob, setDob] = useState(''); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDob(selectedDate.toISOString().split('T')[0]);
    }
  };

  if (!user) {
    return null; 
  }

  const handleNext = () => {
    setError('');
    if (!firstName || !lastName) {
      setError('First and last names are required.');
      return;
    }
    setStep('dob_gender');
  };

  const handleComplete = async () => {
    setError('');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dob || !dateRegex.test(dob)) {
      setError('Please enter a valid date in YYYY-MM-DD format.');
      return;
    }
    if (!gender) {
      setError('Please select a gender.');
      return;
    }

    setLoading(true);
    try {
      const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ');
      const familyName = lastName.trim() ? `${lastName.trim()} Family` : 'My Family';

      // 1. Create a Family
      const { data: family, error: familyErr } = await supabase
        .from('families')
        .insert({
          name: familyName,
          created_by: user.id
        })
        .select()
        .single();
        
      if (familyErr) throw familyErr;

      // 2. Insert into profiles with new family_id
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          family_id: family.id,
          full_name: fullName,
          date_of_birth: dob,
          gender: gender,
          role: 'admin',
          created_by: user.id,
          is_living: true,
          visibility: 'family'
        })
        .select()
        .single();

      if (profileErr) throw profileErr;

      // 3. Insert into family_members as admin
      const { error: fmError } = await supabase
        .from('family_members')
        .insert({
          user_id: user.id,
          profile_id: profile.id,
          family_id: family.id,
          role: 'admin'
        });

      if (fmError && fmError.code !== '23505') { 
        // 23505 is unique violation, ignore if they already have a record
        throw fmError;
      }

      await refreshProfile();
      // Router will automatically observe hasProfile === true and route to /(tabs)/tree, but we can also manually fallback
      router.replace('/(tabs)/tree');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        
        <View className="flex-row justify-between items-center px-6 pt-4 pb-2 h-14">
          <View className="flex-1">
            {step === 'dob_gender' && (
              <TouchableOpacity onPress={() => setStep('name')} className="w-10 h-10 justify-center">
                 <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={signOut} className="h-10 justify-center">
            <Text className="text-sm font-semibold text-gray-400">Sign out</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-2"
          keyboardShouldPersistTaps="handled">
          
          {step === 'name' && (
            <View className="flex-1">
              <View className="mb-8">
                <Text className="mb-2 text-3xl font-bold text-gray-900">What's your Name?</Text>
                <Text className="text-base text-gray-500">You're almost done</Text>
              </View>

              <View>
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                
                <Input
                  placeholder="Middle name (Optional)"
                  value={middleName}
                  onChangeText={setMiddleName}
                />

                <Input
                  placeholder="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                />

                {error ? (
                  <View className="mb-4 rounded-xl bg-red-50 p-4">
                    <Text className="text-sm font-semibold text-red-600">{error}</Text>
                  </View>
                ) : null}

                <Button
                  title="Continue"
                  onPress={handleNext}
                  className="mt-6"
                />
              </View>
            </View>
          )}

          {step === 'dob_gender' && (
            <View className="flex-1">
              <View className="mb-8">
                <Text className="mb-2 text-3xl font-bold text-gray-900">Final Details</Text>
                <Text className="text-base text-gray-500">When were you born and what is your gender?</Text>
              </View>

              <View>
                <Text className="mb-2 text-sm font-semibold text-gray-700">Date of Birth</Text>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  className="mb-4 w-full bg-gray-100 border border-transparent rounded-2xl px-5 py-4">
                  <Text className={dob ? "text-gray-900 text-base" : "text-gray-400 text-base"}>
                    {dob ? dob : "YYYY-MM-DD"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                   Platform.OS === 'ios' ? (
                     <View className="mb-4 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 px-2 pb-4 pt-2">
                       <View className="flex-row justify-end px-2 mb-2">
                         <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                           <Text className="text-emerald-600 font-bold text-base">Done</Text>
                         </TouchableOpacity>
                       </View>
                       <DateTimePicker
                         value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                         mode="date"
                         display="inline"
                         onChange={onDateChange}
                         maximumDate={new Date()}
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
                   )
                )}

                <Text className="mb-2 mt-4 text-sm font-semibold text-gray-700">Gender</Text>
                <View className="flex-row gap-4 mb-8">
                  <TouchableOpacity 
                    onPress={() => setGender('male')}
                    className={`flex-1 py-4 items-center rounded-2xl border ${gender === 'male' ? 'border-[#064e3b] bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                    <Text className={`font-semibold ${gender === 'male' ? 'text-[#064e3b]' : 'text-gray-500'}`}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setGender('female')}
                    className={`flex-1 py-4 items-center rounded-2xl border ${gender === 'female' ? 'border-[#064e3b] bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                    <Text className={`font-semibold ${gender === 'female' ? 'text-[#064e3b]' : 'text-gray-500'}`}>Female</Text>
                  </TouchableOpacity>
                </View>

                {error ? (
                  <View className="mb-4 rounded-xl bg-red-50 p-4">
                    <Text className="text-sm font-semibold text-red-600">{error}</Text>
                  </View>
                ) : null}

                <Button
                  title="Complete Setup"
                  onPress={handleComplete}
                  loading={loading}
                  className="mt-2"
                />
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
