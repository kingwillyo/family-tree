import { Link, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../lib/auth-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

type Mode = 'choose' | 'email' | 'otp';

export default function RegisterScreen() {
  const { signInWithOtp, verifyOtp, loading } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    setError('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    const result = await signInWithOtp(email);
    if (result?.error) {
      setError(result.error.message || 'Failed to send verification code. Try again.');
      return;
    }
    setMode('otp');
    setCountdown(60);
  };

  const handleResendOtp = async () => {
    setError('');
    const result = await signInWithOtp(email);
    if (result?.error) {
      setError(result.error.message || 'Failed to resend code.');
      return;
    }
    setCountdown(60);
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }
    const result = await verifyOtp(email, otp);
    if (result?.error) {
      setError(result.error.message || 'Invalid code. Please try again.');
    }
    // On success, _layout.tsx navigation guard routes to /onboarding automatically
  };

  const handleBack = () => {
    if (mode === 'email') {
      setMode('choose');
      setError('');
    } else if (mode === 'otp') {
      setMode('email');
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
          contentContainerClassName="px-6 pt-4"
          keyboardShouldPersistTaps="handled">
          {/* ── Mode: Choose ── */}
          {mode === 'choose' && (
            <View>
              {/* Title */}
              <View className="mb-10">
                <Text className="text-[32px] font-extrabold leading-tight text-gray-900 dark:text-white">
                  Create Account
                </Text>
                <Text className="mt-2 text-base text-gray-500 dark:text-slate-400">
                  Are you starting a new family tree or joining an existing one?
                </Text>
              </View>

              {/* Option A: Start New Family */}
              <TouchableOpacity
                onPress={() => setMode('email')}
                activeOpacity={0.85}
                className="mb-4 flex-row items-center rounded-[24px] border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                }}>
                <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20">
                  <Feather name="git-branch" size={24} color={isDarkMode ? '#10b981' : '#059669'} />
                </View>
                <View className="flex-1">
                  <Text className="mb-0.5 text-[17px] font-bold text-gray-900 dark:text-white">
                    Start New Family
                  </Text>
                  <Text className="text-[13px] text-gray-500 dark:text-slate-400" numberOfLines={2}>
                    Create a new family tree and invite relatives to join.
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={isDarkMode ? '#64748b' : '#9ca3af'}
                />
              </TouchableOpacity>

              {/* Option B: Join Family */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/join-with-code')}
                activeOpacity={0.85}
                className="flex-row items-center rounded-[24px] border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                }}>
                <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20">
                  <Feather name="key" size={24} color={isDarkMode ? '#10b981' : '#059669'} />
                </View>
                <View className="flex-1">
                  <Text className="mb-0.5 text-[17px] font-bold text-gray-900 dark:text-white">
                    Join Family
                  </Text>
                  <Text className="text-[13px] text-gray-500 dark:text-slate-400" numberOfLines={2}>
                    {"Got an invite code? Enter it to join your family's tree."}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={isDarkMode ? '#64748b' : '#9ca3af'}
                />
              </TouchableOpacity>

              {/* Divider */}
              <View className="mt-10 flex-row items-center">
                <View className="h-[1px] flex-1 bg-gray-100 dark:bg-slate-800" />

                <Text className="mx-4 text-sm text-gray-400 dark:text-slate-500">
                  already have an account?
                </Text>

                <View className="h-[1px] flex-1 bg-gray-100 dark:bg-slate-800" />
              </View>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity className="mt-4 items-center py-3">
                  <Text className="text-[15px] font-bold text-emerald-600 dark:text-emerald-500">
                    Log In
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          {/* ── Mode: Email ── */}
          {mode === 'email' && (
            <View>
              <View className="mb-10">
                <Text className="mb-3 text-[28px] font-extrabold leading-tight text-gray-900 dark:text-white">
                  {"What's your email?"}
                </Text>
                <Text className="text-base text-gray-500 dark:text-slate-400">
                  A verification code will be sent to your email.
                </Text>
              </View>

              <Input
                placeholder="Enter email address"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              {error ? (
                <View className="mb-4 rounded-xl border border-transparent bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                  <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {error}
                  </Text>
                </View>
              ) : null}

              <Button title="Continue" onPress={handleSendOtp} loading={loading} className="mt-2" />
            </View>
          )}

          {/* ── Mode: OTP ── */}
          {mode === 'otp' && (
            <View>
              <View className="mb-10">
                <Text className="mb-3 text-[28px] font-extrabold leading-tight text-gray-900 dark:text-white">
                  Enter verification code
                </Text>
                <Text className="text-base text-gray-500 dark:text-slate-400">
                  {"We've sent a code to "}{' '}
                  <Text className="font-bold text-gray-700 dark:text-slate-200">{email}</Text>
                </Text>
              </View>

              <Input
                placeholder="6-digit code"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
              />

              {error ? (
                <View className="mb-4 rounded-xl border border-transparent bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                  <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {error}
                  </Text>
                </View>
              ) : null}

              <View className="mb-4 flex-row items-center justify-between px-2">
                <Text className="text-gray-500 dark:text-slate-400">
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive a code?"}
                </Text>
                {countdown === 0 && (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text className="font-semibold text-emerald-600 dark:text-emerald-500">
                      Resend
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Button
                title="Continue"
                onPress={handleVerifyOtp}
                loading={loading}
                className="mt-2"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
