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
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { signInWithOtp, verifyOtp, loading } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
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
    setStep('otp');
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
    // Note: If successful, AuthContext applies the session, and _layout.tsx automatically routes to /onboarding
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">

        {/* Header with Back Button */}
        <View className="px-6 pt-4 pb-2">
          {step === 'otp' ? (
            <TouchableOpacity onPress={() => setStep('email')} className="w-10 h-10 justify-center">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 justify-center">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6"
          keyboardShouldPersistTaps="handled">

          {step === 'email' && (
            <View className="flex-1">
              <View className="mb-10">
                <Text className="mb-3 text-3xl font-bold text-gray-900">What's your email?</Text>
                <Text className="text-base text-gray-500">A verification code will be sent to your email.</Text>
              </View>

              <View>
                <Input
                  placeholder="Enter email address"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />

                {error ? (
                  <View className="mb-4 rounded-xl bg-red-50 p-4">
                    <Text className="text-sm font-semibold text-red-600">{error}</Text>
                  </View>
                ) : null}

                <Button
                  title="Continue"
                  onPress={handleSendOtp}
                  loading={loading}
                  className="mt-2"
                />

                <View className="mt-8 flex-row items-center">
                  <View className="flex-1 h-[1px] bg-gray-200" />
                  <Text className="mx-4 text-gray-400">or</Text>
                  <View className="flex-1 h-[1px] bg-gray-200" />
                </View>

                {/* Optional Social Buttons could go here */}
              </View>
            </View>
          )}

          {step === 'otp' && (
            <View className="flex-1">
              <View className="mb-10">
                <Text className="mb-3 text-3xl font-bold text-gray-900">Enter verification code</Text>
                <Text className="text-base text-gray-500">We've sent a code to {email}</Text>
              </View>

              <View>
                <Input
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />

                {error ? (
                  <View className="mb-4 rounded-xl bg-red-50 p-4">
                    <Text className="text-sm font-semibold text-red-600">{error}</Text>
                  </View>
                ) : null}

                <View className="mb-4 flex-row items-center justify-between px-2">
                  <Text className="text-gray-500">
                    {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive a code?"}
                  </Text>
                  {countdown === 0 && (
                    <TouchableOpacity onPress={handleResendOtp}>
                      <Text className="font-semibold text-emerald-600">Resend</Text>
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
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
