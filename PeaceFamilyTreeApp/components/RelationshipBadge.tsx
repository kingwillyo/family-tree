import React from 'react';
import { Text, View } from 'react-native';

type RelationshipType = 'parent' | 'child' | 'spouse';

interface RelationshipBadgeProps {
  type: RelationshipType;
}

const CONFIG: Record<RelationshipType, { label: string; bg: string; text: string }> = {
  parent: { label: 'Parent', bg: 'bg-blue-100', text: 'text-blue-700' },
  child: { label: 'Child', bg: 'bg-purple-100', text: 'text-purple-700' },
  spouse: { label: 'Spouse', bg: 'bg-rose-100', text: 'text-rose-700' },
};

export function RelationshipBadge({ type }: RelationshipBadgeProps) {
  const { label, bg, text } = CONFIG[type];
  return (
    <View className={`rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
