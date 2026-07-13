import React from 'react';
import { Text, View } from 'react-native';

type RelationshipType = 'parent' | 'child' | 'spouse';

interface RelationshipBadgeProps {
  type: RelationshipType;
}

const CONFIG: Record<RelationshipType, { label: string; bg: string; text: string }> = {
  parent: {
    label: 'Parent',
    bg: 'bg-blue-100 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  child: {
    label: 'Child',
    bg: 'bg-purple-100 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
  },
  spouse: {
    label: 'Spouse',
    bg: 'bg-rose-100 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
  },
};

export function RelationshipBadge({ type }: RelationshipBadgeProps) {
  const { label, bg, text } = CONFIG[type];
  return (
    <View className={`rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
