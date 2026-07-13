import React from 'react';
import { Text, View } from 'react-native';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

export function StatCard({ icon, value, label, color = 'emerald' }: StatCardProps) {
  return (
    <View className="flex-1 items-center">
      <View
        className={`bg-${color}-100 mb-3 h-16 w-16 items-center justify-center rounded-full dark:bg-emerald-950/20`}>
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text className={`text-2xl font-bold text-${color}-600 mb-1 dark:text-emerald-500`}>
        {value}
      </Text>
      <Text className="text-center text-xs text-gray-600 dark:text-slate-400">{label}</Text>
    </View>
  );
}
