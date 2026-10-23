import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}

export default function AudioNote({
  uri,
  compact = false,
}: {
  uri?: string | null;
  compact?: boolean;
}) {
  const player = useAudioPlayer(uri || null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;
  const currentTime = status.currentTime || 0;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const togglePlayback = () => {
    if (!uri) return;
    if (status.playing) {
      player.pause();
    } else {
      if (duration > 0 && currentTime >= duration) player.seekTo(0);
      player.play();
    }
  };

  return (
    <View
      className={`flex-row items-center rounded-2xl border border-[#f0f5ee] bg-[#fbfdf9] p-4 dark:border-slate-800 dark:bg-slate-950 ${
        compact ? 'p-3' : ''
      }`}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause voice note' : 'Play voice note'}
        disabled={!uri}
        onPress={togglePlayback}
        className={`mr-4 items-center justify-center rounded-full bg-[#84cc16] ${
          compact ? 'h-10 w-10' : 'h-12 w-12'
        } ${!uri ? 'opacity-50' : ''}`}>
        <Feather name={status.playing ? 'pause' : 'play'} size={compact ? 17 : 21} color="white" />
      </TouchableOpacity>

      <View className="flex-1">
        <View className="mb-2 h-8 flex-row items-end gap-1 px-1">
          {[12, 18, 25, 16, 22, 30, 20, 14, 26, 18, 12, 23, 17, 28, 20, 14].map((height, index) => (
            <View
              key={index}
              style={{ height }}
              className={`w-[3px] rounded-full ${
                index / 16 <= progress ? 'bg-[#84cc16]' : 'bg-[#d1d5db] dark:bg-slate-700'
              }`}
            />
          ))}
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
            {formatTime(currentTime)}
          </Text>
          <Text className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}
