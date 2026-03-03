import { Link } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useAuthStore } from "../../lib/auth-store";

export default function LoginScreen() {
  const { signIn, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    const result = await signIn(email, password);
    if (result?.error) setError("Invalid email or password");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-12"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-12">
            <View className="bg-emerald-100 rounded-full w-20 h-20 items-center justify-center mb-6">
              <Text className="text-5xl">🌳</Text>
            </View>
            <Text className="text-4xl font-bold text-gray-900 mb-3">
              Welcome Back
            </Text>
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
              error={error}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              className="mt-4"
            />

            <View className="flex-row justify-center items-center mt-8">
              <Text className="text-gray-600 text-base">
                Don&apos;t have an account?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-emerald-600 font-semibold text-base">
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
