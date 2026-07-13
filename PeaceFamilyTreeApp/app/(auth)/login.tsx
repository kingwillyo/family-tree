import { Link, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithOtp, verifyOtp, loading } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // 'request' or 'verify'
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestOtp = async () => {
    setError('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    const result = await signInWithOtp(email);
    if (result?.error) {
      setError(result.error.message || 'Failed to send login code.');
      return;
    }
    setStep('verify');
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
    const result = await verifyOtp(email, otp);
    if (result?.error) {
      setError(result.error.message || 'Invalid code.');
    }
  };

  const handleBack = () => {
    if (step === 'verify') {
      setStep('request');
      setError('');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {/* Header with Back Button */}
        <View className="px-6 pb-2 pt-4">
          <TouchableOpacity onPress={handleBack} className="h-10 w-10 justify-center">
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6"
          keyboardShouldPersistTaps="handled">
          <View className="mb-10">
            <View className="mb-6 h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 dark:bg-slate-900">
              <Image
                source={
                  isDarkMode
                    ? require('../../assets/ios-dark.png')
                    : require('../../assets/ios-light.png')
                }
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>
            <Text className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </Text>

            <Text className="text-base text-gray-500 dark:text-slate-400">
              Sign in to explore your family connections
            </Text>
          </View>

          <View>
            {step === 'request' ? (
              <>
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

                <Button
                  title="Continue with Code"
                  onPress={handleRequestOtp}
                  loading={loading}
                  className="mt-4"
                />
              </>
            ) : (
              <>
                <Text className="mb-4 text-gray-700 dark:text-slate-300">
                  {"We've sent a login code to "}
                  {email}
                </Text>

                <Input
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />

                <View className="flex-row items-center justify-between px-2 pt-2">
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

                {error ? (
                  <View className="mb-4 mt-4 rounded-xl border border-transparent bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                    <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </Text>
                  </View>
                ) : null}

                <Button
                  title="Verify and Sign In"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  className="mt-6"
                />
              </>
            )}

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-base text-gray-600 dark:text-slate-400">
                {"Don't have an account? "}
              </Text>

              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-base font-semibold text-emerald-600 dark:text-emerald-500">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
