import { Link } from 'expo-router';
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
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../lib/auth-context';

export default function RegisterScreen() {
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const result = await signUp(email, password);
    if (result?.error) {
      setError(result.error.message || 'Registration failed. Try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-12"
          keyboardShouldPersistTaps="handled">
          <View className="mb-12">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <Text className="text-5xl">👋</Text>
            </View>
            <Text className="mb-3 text-4xl font-bold text-gray-900">Join the Family</Text>
            <Text className="text-base text-gray-500">Create your account to get started</Text>
          </View>

          <View>
            <Input
              label="Email Address"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Password"
              placeholder="Create a strong password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {error ? (
              <View className="mb-4 rounded-xl bg-red-50 p-4">
                <Text className="text-sm font-semibold text-red-600">{error}</Text>
              </View>
            ) : null}

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              className="mt-4"
            />

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-base text-gray-600">Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-base font-semibold text-emerald-600">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
