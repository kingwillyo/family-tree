import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { useAuthStore } from "../../lib/auth-store";

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuthStore();

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="px-6 pt-6 pb-8">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-1">
              Profile
            </Text>
            <Text className="text-base text-gray-500">
              Manage your account settings
            </Text>
          </View>

          <Card variant="elevated" className="mb-6">
            <View className="items-center py-4">
              <View className="bg-emerald-600 rounded-full w-24 h-24 items-center justify-center mb-4">
                <Text className="text-white text-4xl font-bold">
                  {user?.email ? getInitials(user.email) : "?"}
                </Text>
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {user?.email?.split("@")[0] || "User"}
              </Text>
              <Text className="text-sm text-gray-500">{user?.email}</Text>
            </View>
          </Card>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Account Settings
            </Text>
            <View className="gap-3">
              <TouchableOpacity activeOpacity={0.7}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="bg-blue-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                      <Text className="text-2xl">👤</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        Edit Profile
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Update your information
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xl">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="bg-purple-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                      <Text className="text-2xl">🔔</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        Notifications
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Manage preferences
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xl">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="bg-orange-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                      <Text className="text-2xl">🔒</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        Privacy & Security
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Control your data
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xl">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Support
            </Text>
            <View className="gap-3">
              <TouchableOpacity activeOpacity={0.7}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="bg-green-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                      <Text className="text-2xl">❓</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        Help & Support
                      </Text>
                      <Text className="text-sm text-gray-500">Get assistance</Text>
                    </View>
                    <Text className="text-gray-400 text-xl">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="bg-yellow-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                      <Text className="text-2xl">ℹ️</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        About
                      </Text>
                      <Text className="text-sm text-gray-500">
                        App version & info
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xl">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Sign Out"
            variant="danger"
            onPress={signOut}
            loading={loading}
          />
        </View>
    </ScrollView>
  );
}
