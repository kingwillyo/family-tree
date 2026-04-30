import React from "react";
import { Text, View } from "react-native";

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

export function StatCard({
  icon,
  value,
  label,
  color = "emerald",
}: StatCardProps) {
  return (
    <View className="flex-1 items-center">
      <View className={`bg-${color}-100 rounded-full w-16 h-16 items-center justify-center mb-3`}>
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text className={`text-2xl font-bold text-${color}-600 mb-1`}>
        {value}
      </Text>
      <Text className="text-xs text-gray-600 text-center">{label}</Text>
    </View>
  );
}
