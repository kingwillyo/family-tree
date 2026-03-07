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

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const result = await signIn(email, password);
    if (result?.error) {
      setError(result.error.message || 'Invalid email or password');
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
              <Text className="text-5xl">🌳</Text>
            </View>
            <Text className="mb-3 text-4xl font-bold text-gray-900">Welcome Back</Text>
            <Text className="text-base text-gray-500">
              Sign in to explore your family connections
            </Text>
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
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <View className="mb-4 rounded-xl bg-red-50 p-4">
                <Text className="text-sm font-semibold text-red-600">{error}</Text>
              </View>
            ) : null}

            <Button title="Sign In" onPress={handleLogin} loading={loading} className="mt-4" />

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-base text-gray-600">Don&apos;t have an account? </Text>
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
