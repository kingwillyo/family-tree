import { Link } from 'expo-router';
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
import { GoogleAuthButton } from '../../components/GoogleAuthButton';
import { Input } from '../../components/Input';
import { useAuth } from '../../lib/auth-context';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signIn, signInWithOtp, verifyOtp, signInWithGoogle, loading } = useAuth();
  
  // 'email_password' or 'email_otp_request' or 'email_otp_verify'
  const [loginMethod, setLoginMethod] = useState<'email_password' | 'email_otp_request' | 'email_otp_verify'>('email_otp_request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePasswordLogin = async () => {
    setError('');
    const result = await signIn(email, password);
    if (result?.error) {
      setError(result.error.message || 'Invalid email or password');
    }
  };

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
    setLoginMethod('email_otp_verify');
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

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (result?.error) {
      setError(result.error.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        
        <View className="px-6 pt-4 pb-2 h-14 justify-center">
          {loginMethod === 'email_otp_verify' && (
            <TouchableOpacity onPress={() => setLoginMethod('email_otp_request')} className="w-10 h-10 justify-center">
               <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6"
          keyboardShouldPersistTaps="handled">
          <View className="mb-10">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <Text className="text-5xl">🌳</Text>
            </View>
            <Text className="mb-3 text-3xl font-bold text-gray-900">Welcome Back</Text>
            <Text className="text-base text-gray-500">
              Sign in to explore your family connections
            </Text>
          </View>

          <View>
            {loginMethod !== 'email_otp_verify' && (
              <>
                <GoogleAuthButton
                  title="Continue with Google"
                  onPress={handleGoogleSignIn}
                  loading={googleLoading}
                  disabled={loading && !googleLoading}
                />

                <View className="my-6 flex-row items-center">
                  <View className="h-[1px] flex-1 bg-gray-200" />
                  <Text className="mx-4 text-sm text-gray-400">or continue with email</Text>
                  <View className="h-[1px] flex-1 bg-gray-200" />
                </View>
              </>
            )}

            {loginMethod !== 'email_otp_verify' && (
              <Input
                placeholder="Enter email address"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            )}

            {loginMethod === 'email_password' && (
              <Input
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            )}

            {loginMethod === 'email_otp_verify' && (
              <>
                <Text className="mb-4 text-gray-700">We’ve sent a login code to {email}</Text>
                <Input
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />

                <View className="flex-row items-center justify-between px-2 pt-2">
                  <Text className="text-gray-500">
                    {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive a code?"}
                  </Text>
                  {countdown === 0 && (
                    <TouchableOpacity onPress={handleResendOtp}>
                      <Text className="font-semibold text-emerald-600">Resend</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {error ? (
              <View className="mb-4 rounded-xl bg-red-50 p-4">
                <Text className="text-sm font-semibold text-red-600">{error}</Text>
              </View>
            ) : null}

            {loginMethod === 'email_password' && (
              <Button title="Sign In" onPress={handlePasswordLogin} loading={loading} className="mt-4" />
            )}

            {loginMethod === 'email_otp_request' && (
              <Button title="Continue with Code" onPress={handleRequestOtp} loading={loading} className="mt-4" />
            )}

            {loginMethod === 'email_otp_verify' && (
              <Button title="Verify and Sign In" onPress={handleVerifyOtp} loading={loading} className="mt-4" />
            )}

            {/* Toggle Login Method */}
            {loginMethod === 'email_otp_request' && (
              <TouchableOpacity onPress={() => setLoginMethod('email_password')} className="mt-6 items-center">
                <Text className="text-emerald-600 font-semibold">Sign in with password instead</Text>
              </TouchableOpacity>
            )}

            {loginMethod === 'email_password' && (
              <TouchableOpacity onPress={() => setLoginMethod('email_otp_request')} className="mt-6 items-center">
                <Text className="text-emerald-600 font-semibold">Sign in with email code instead</Text>
              </TouchableOpacity>
            )}

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-base text-gray-600">Don’t have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-base font-semibold text-emerald-600">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
