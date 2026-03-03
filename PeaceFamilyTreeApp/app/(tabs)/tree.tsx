import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Card } from "../../components/Card";
import { useAuthStore } from "../../lib/auth-store";

export default function TreeScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="px-6 pt-6 pb-8">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-1">
              Peace Family
            </Text>
            <Text className="text-base text-gray-500">
              Explore your family connections
            </Text>
          </View>

          <Card variant="elevated" className="bg-emerald-600 mb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold mb-1">
                  Your Family Tree
                </Text>
                <Text className="text-emerald-100 text-sm">
                  Start building your legacy
                </Text>
              </View>
              <View className="bg-white/20 rounded-full w-16 h-16 items-center justify-center">
                <Text className="text-4xl">🌳</Text>
              </View>
            </View>
          </Card>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Quick Stats
            </Text>
            <View className="flex-row gap-3">
              <Card variant="outlined" className="flex-1">
                <View className="items-center py-2">
                  <View className="bg-blue-100 rounded-full w-12 h-12 items-center justify-center mb-2">
                    <Text className="text-2xl">👥</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">0</Text>
                  <Text className="text-xs text-gray-600 mt-1">Members</Text>
                </View>
              </Card>

              <Card variant="outlined" className="flex-1">
                <View className="items-center py-2">
                  <View className="bg-purple-100 rounded-full w-12 h-12 items-center justify-center mb-2">
                    <Text className="text-2xl">🔗</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">0</Text>
                  <Text className="text-xs text-gray-600 mt-1">
                    Connections
                  </Text>
                </View>
              </Card>

              <Card variant="outlined" className="flex-1">
                <View className="items-center py-2">
                  <View className="bg-orange-100 rounded-full w-12 h-12 items-center justify-center mb-2">
                    <Text className="text-2xl">🌿</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">0</Text>
                  <Text className="text-xs text-gray-600 mt-1">Branches</Text>
                </View>
              </Card>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Quick Actions
            </Text>
            <View className="gap-3">
              <TouchableOpacity activeOpacity={0.7}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="bg-emerald-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                      <Text className="text-2xl">➕</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        Add Family Member
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Expand your tree
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xl">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Card variant="outlined">
                  <View className="flex-row items-center">
                    <View className="bg-blue-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                      <Text className="text-2xl">🔍</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        Search Members
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Find relatives
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xl">›</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          </View>

          <Card variant="default">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Recent Activity
            </Text>
            <View className="items-center py-8">
              <Text className="text-5xl mb-3">📋</Text>
              <Text className="text-gray-400 text-sm">No recent activity</Text>
            </View>
          </Card>
        </View>
    </ScrollView>
  );
}

