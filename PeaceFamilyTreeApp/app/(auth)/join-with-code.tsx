import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { useAuth } from '../../lib/auth-context';
import { lookupInviteCode, claimProfileWithCode, Profile } from '../../lib/treeService';

type Step = 'code' | 'email' | 'otp';

export default function JoinWithCodeScreen() {
  const router = useRouter();
  const { signInWithOtp, verifyOtp, loading } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [claimedProfile, setClaimedProfile] = useState<Profile | null>(null);

  // ─── Step 1: Validate the code ────────────────────────────────────────────
  const handleValidateCode = async () => {
    if (!code.trim()) {
      setError('Please enter your invite code.');
      return;
    }
    setError('');
    setValidating(true);

    const result = await lookupInviteCode(code.trim());
    setValidating(false);

    if ('error' in result) {
      setError(result.error);
      return;
    }

    if (result.profile.user_id) {
      setError(
        'This profile is already linked to an account. Contact a family member for a new code.'
      );
      return;
    }

    setClaimedProfile(result.profile);
    setStep('email');
  };

  // ─── Step 2: Send OTP to email ───────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    const result = await signInWithOtp(email.trim());
    if (result?.error) {
      setError(result.error.message || 'Failed to send verification code.');
      return;
    }
    setStep('otp');
    // Start 60s countdown
    let c = 60;
    setCountdown(c);
    const t = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) clearInterval(t);
    }, 1000);
  };

  // ─── Step 3: Verify OTP → claim profile ──────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    setError('');

    const authResult = await verifyOtp(email.trim(), otp.trim());
    if (authResult?.error) {
      setError(authResult.error.message || 'Invalid code. Please try again.');
      return;
    }

    // verifyOtp sets the session in auth context; now claim the profile
    const { supabase } = await import('../../lib/supabase');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Authentication failed. Please try again.');
      return;
    }

    const claimResult = await claimProfileWithCode(code.trim(), user.id);
    if ('error' in claimResult) {
      setError(claimResult.error);
      return;
    }

    // Auth context will detect the session + family_members row and redirect to /(tabs)/tree
    // via the _layout.tsx navigation guard.
  };

  const handleBack = () => {
    if (step === 'email') {
      setStep('code');
      setError('');
    } else if (step === 'otp') {
      setStep('email');
      setError('');
    } else router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {/* Header */}
        <View className="px-6 pb-2 pt-4">
          <TouchableOpacity onPress={handleBack} className="h-10 w-10 justify-center">
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-4 pb-12"
          keyboardShouldPersistTaps="handled">
          {/* ── Step 1: Enter Code ── */}
          {step === 'code' && (
            <View>
              {/* Icon */}
              <View className="mb-8 items-center">
                <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20">
                  <Feather name="key" size={32} color={isDarkMode ? '#10b981' : '#059669'} />
                </View>
                <Text className="text-center text-[28px] font-extrabold leading-tight text-gray-900 dark:text-white">
                  Join Your Family
                </Text>
                <Text className="mt-2 text-center text-base text-gray-500 dark:text-slate-400">
                  Enter the invite code a family member shared with you.
                </Text>
              </View>

              {/* Code input */}
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                Invite Code
              </Text>
              <TextInput
                value={code}
                onChangeText={(v) => {
                  setCode(v.toUpperCase());
                  setError('');
                }}
                placeholder="e.g. PF7K2X9R"
                placeholderTextColor={isDarkMode ? '#475569' : '#9ca3af'}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                className="mb-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[20px] font-bold tracking-widest text-gray-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />

              {error ? (
                <View className="mb-4 rounded-2xl border border-transparent bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
                  <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {error}
                  </Text>
                </View>
              ) : (
                <View className="mb-4" />
              )}

              <TouchableOpacity
                onPress={handleValidateCode}
                disabled={validating}
                className="w-full items-center justify-center rounded-full bg-[#059669] py-4 shadow-sm">
                {validating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-[16px] font-bold text-white">Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: Profile Preview + Email ── */}
          {step === 'email' && claimedProfile && (
            <View>
              {/* Profile card */}
              <View className="mb-8 items-center">
                <View className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-emerald-500 bg-orange-100 dark:bg-orange-950/20">
                  {claimedProfile.avatar_url ? (
                    <Image source={{ uri: claimedProfile.avatar_url }} className="h-full w-full" />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-orange-100 dark:bg-orange-950/30">
                      <Text className="text-4xl font-extrabold text-orange-300 dark:text-orange-700">
                        {claimedProfile.full_name?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="mb-1 text-[13px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                  {"You're joining as"}
                </Text>
                <Text className="text-center text-[28px] font-extrabold leading-tight text-gray-900 dark:text-white">
                  {claimedProfile.full_name}
                </Text>
              </View>

              <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                Your Email
              </Text>
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError('');
                }}
                placeholder="Enter your email address"
                placeholderTextColor={isDarkMode ? '#475569' : '#9ca3af'}
                autoCapitalize="none"
                keyboardType="email-address"
                className="mb-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-base text-gray-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />

              {error ? (
                <View className="mb-4 rounded-2xl border border-transparent bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
                  <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {error}
                  </Text>
                </View>
              ) : (
                <View className="mb-4" />
              )}

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={loading}
                className="w-full items-center justify-center rounded-full bg-[#059669] py-4 shadow-sm">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-[16px] font-bold text-white">Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 3: OTP ── */}
          {step === 'otp' && (
            <View>
              <View className="mb-8">
                <Text className="mb-2 text-[28px] font-extrabold leading-tight text-gray-900 dark:text-white">
                  Check your email
                </Text>
                <Text className="text-base text-gray-500 dark:text-slate-400">
                  We sent a 6-digit code to{' '}
                  <Text className="font-bold text-gray-700 dark:text-slate-200">{email}</Text>
                </Text>
              </View>

              <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                Verification Code
              </Text>
              <TextInput
                value={otp}
                onChangeText={(v) => {
                  setOtp(v);
                  setError('');
                }}
                placeholder="6-digit code"
                placeholderTextColor={isDarkMode ? '#475569' : '#9ca3af'}
                keyboardType="number-pad"
                maxLength={6}
                className="mb-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[20px] font-bold tracking-widest text-gray-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />

              <View className="mb-4 flex-row items-center justify-between px-1">
                <Text className="text-sm text-gray-500 dark:text-slate-400">
                  {countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive a code?"}
                </Text>
                {countdown === 0 && (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
                      Resend
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {error ? (
                <View className="mb-4 rounded-2xl border border-transparent bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
                  <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {error}
                  </Text>
                </View>
              ) : (
                <View className="mb-4" />
              )}

              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={loading}
                className="w-full items-center justify-center rounded-full bg-[#059669] py-4 shadow-sm">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-[16px] font-bold text-white">Join LineageX</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
