import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { OptimizedImage as Image } from './OptimizedImage';
import AudioNote from './AudioNote';

export interface MemoryData {
  id: string;
  type: string;
  createdBy?: string | null;
  author: {
    name: string;
    avatar?: string;
    added?: string;
    initial?: string;
  };
  content: {
    image?: string;
    images?: string[];
    date?: string;
    location?: string;
    title?: string;
    tags?: string[];
    duration?: string;
    currentTime?: string;
    audioUrl?: string | null;
    excerpt?: string;
  };
}

interface MemoryCardProps {
  memory: MemoryData;
  onPress?: () => void;
  onEdit?: () => void;
  isFullView?: boolean;
}

export default function MemoryCard({ memory, onPress, onEdit, isFullView }: MemoryCardProps) {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isFullView) return <View className="mb-6">{children}</View>;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={!onPress}
        className="mb-6 block">
        {children}
      </TouchableOpacity>
    );
  };

  const AuthorSection = ({ isBottom = false }: { isBottom?: boolean }) => (
    <View
      className={`${isBottom ? 'mt-6 border-t border-gray-100 pt-6 dark:border-slate-800' : 'mb-4'} flex-row items-center justify-between`}>
      <View className="flex-row items-center">
        {memory.author.avatar ? (
          <Image
            source={{ uri: memory.author.avatar }}
            className="mr-3 h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-800"
          />
        ) : (
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#f0f9ed] dark:bg-emerald-950/20">
            <Text className="text-[15px] font-bold text-[#65a30d]">{memory.author.initial}</Text>
          </View>
        )}
        <View>
          <Text className="text-[15px] font-bold text-gray-900 dark:text-white">
            {memory.author.name}
          </Text>
          <Text className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
            {memory.author.added}
          </Text>
        </View>
      </View>
      {!isFullView && !isBottom && onEdit && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Edit memory"
          onPress={onEdit}
          className="h-9 w-9 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800">
          <Feather name="edit-2" size={16} color="#059669" />
        </TouchableOpacity>
      )}
    </View>
  );

  const LocationDateInfo = () => {
    const hasDate = !!memory.content.date;
    const hasLocation = !!memory.content.location;
    if (!hasDate && !hasLocation) return null;

    return (
      <View className="mb-4 flex-row items-center">
        {hasDate && (
          <>
            <Feather name="calendar" size={12} color="#6b7280" />
            <Text className="ml-1.5 text-[13px] font-medium text-gray-500 dark:text-slate-400">
              {memory.content.date}
            </Text>
          </>
        )}
        {hasDate && hasLocation && (
          <Text className="mx-2 text-[13px] text-gray-400 dark:text-slate-600">•</Text>
        )}
        {hasLocation && (
          <>
            <Feather name="map-pin" size={12} color="#6b7280" />
            <Text className="ml-1.5 text-[13px] font-medium text-gray-500 dark:text-slate-400">
              {memory.content.location}
            </Text>
          </>
        )}
      </View>
    );
  };

  // CARD 1: PHOTO MEMORY
  if (memory.type === 'photo') {
    return (
      <CardWrapper>
        <View
          className={`${isFullView ? '' : 'rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-900'}`}>
          {!isFullView && <AuthorSection />}

          {/* Image Content */}
          {(() => {
            const images =
              memory.content.images || (memory.content.image ? [memory.content.image] : []);
            if (images.length === 0) return null;

            if (isFullView) {
              return (
                <View className="mb-4 gap-y-3">
                  {images.map((url, i) => (
                    <View
                      key={url + i}
                      className="overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                      <Image
                        source={{ uri: url }}
                        className="h-[350px] w-full"
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </View>
              );
            }

            if (images.length === 1) {
              return (
                <View className="mb-4 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                  <Image
                    source={{ uri: images[0] }}
                    className="h-[220px] w-full"
                    resizeMode="cover"
                  />
                </View>
              );
            }

            if (images.length === 2) {
              return (
                <View className="mb-4 h-[220px] flex-row gap-2 overflow-hidden rounded-2xl">
                  <View className="flex-1 bg-gray-100 dark:bg-slate-800">
                    <Image
                      source={{ uri: images[0] }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="flex-1 bg-gray-100 dark:bg-slate-800">
                    <Image
                      source={{ uri: images[1] }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                </View>
              );
            }

            if (images.length === 3) {
              return (
                <View className="mb-4 h-[240px] flex-row gap-2 overflow-hidden rounded-2xl">
                  <View className="flex-[2] bg-gray-100 dark:bg-slate-800">
                    <Image
                      source={{ uri: images[0] }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="flex-1 flex-col gap-2">
                    <View className="flex-1 bg-gray-100 dark:bg-slate-800">
                      <Image
                        source={{ uri: images[1] }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-1 bg-gray-100 dark:bg-slate-800">
                      <Image
                        source={{ uri: images[2] }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                </View>
              );
            }
            return (
              <View className="mb-4 h-[240px] flex-col gap-2 overflow-hidden rounded-2xl">
                <View className="flex-1 flex-row gap-2">
                  <View className="flex-1 bg-gray-100 dark:bg-slate-800">
                    <Image
                      source={{ uri: images[0] }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="flex-1 bg-gray-100 dark:bg-slate-800">
                    <Image
                      source={{ uri: images[1] }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                </View>
                <View className="flex-1 flex-row gap-2">
                  <View className="flex-1 bg-gray-100 dark:bg-slate-800">
                    <Image
                      source={{ uri: images[2] }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="relative flex-1 bg-gray-100 dark:bg-slate-800">
                    <Image
                      source={{ uri: images[3] }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                    {images.length > 4 && (
                      <View className="absolute inset-0 items-center justify-center bg-black/50">
                        <Text className="text-[20px] font-bold text-white">
                          +{images.length - 4}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })()}

          <LocationDateInfo />

          {!isFullView && memory.content.title ? (
            <Text className="mb-3 text-[18px] font-bold leading-6 text-gray-900 dark:text-white">
              {memory.content.title}
            </Text>
          ) : null}

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2">
            {memory.content.tags?.map((tag, idx) => (
              <View
                key={idx}
                className="rounded-full bg-[#f0f9ed] px-3 py-1.5 dark:bg-emerald-950/20">
                <Text className="text-[12px] font-bold text-[#65a30d]">{tag}</Text>
              </View>
            ))}
          </View>

          {isFullView && <AuthorSection isBottom />}
        </View>
      </CardWrapper>
    );
  }

  // CARD 2: AUDIO MEMORY
  if (memory.type === 'audio') {
    return (
      <CardWrapper>
        <View
          className={`${isFullView ? '' : 'rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-900'}`}>
          {!isFullView && <AuthorSection />}

          <AudioNote uri={memory.content.audioUrl} />

          {!isFullView && (
            <Text className="mb-3 text-[18px] font-bold leading-6 text-gray-900 dark:text-white">
              {memory.content.title}
            </Text>
          )}

          <LocationDateInfo />

          {/* Tags */}
          <View className="mb-4 flex-row flex-wrap gap-2">
            {memory.content.tags?.map((tag, idx) => (
              <View
                key={idx}
                className="rounded-full bg-[#f0f9ed] px-3 py-1.5 dark:bg-emerald-950/20">
                <Text className="text-[12px] font-bold text-[#65a30d]">{tag}</Text>
              </View>
            ))}
          </View>

          {isFullView && <AuthorSection isBottom />}
        </View>
      </CardWrapper>
    );
  }

  // CARD 3: WRITTEN STORY MEMORY
  if (memory.type === 'story') {
    return (
      <CardWrapper>
        <View
          className={`${isFullView ? '' : 'rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900'}`}>
          {!isFullView && <AuthorSection />}

          {!isFullView && (
            <Text className="mb-3 text-[18px] font-bold leading-6 text-gray-900 dark:text-white">
              {memory.content.title}
            </Text>
          )}

          {/* Excerpt Content */}
          <View className="mb-6 flex-row items-start pr-4">
            <Text className="mr-2 font-serif text-[42px] font-black leading-[42px] text-[#dcfce7] dark:text-emerald-950/40">
              &quot;
            </Text>
            <View className="flex-1">
              <Text
                numberOfLines={!isFullView && onPress ? 4 : undefined}
                ellipsizeMode="tail"
                className="pt-2 text-[16px] font-medium italic leading-7 text-gray-700 dark:text-slate-300">
                {memory.content.excerpt}
              </Text>
              {!isFullView &&
                onPress &&
                memory.content.excerpt &&
                memory.content.excerpt.length > 100 && (
                  <TouchableOpacity onPress={onPress} className="mt-2">
                    <Text className="text-[14px] font-bold text-[#84cc16]">Read more</Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>

          <LocationDateInfo />

          {/* Footer Row */}
          <View className="flex-row flex-wrap gap-2">
            {memory.content.tags?.map((tag, idx) => (
              <View
                key={idx}
                className="rounded-full bg-[#f0f9ed] px-3 py-1.5 dark:bg-emerald-950/20">
                <Text className="text-[12px] font-bold text-[#65a30d]">{tag}</Text>
              </View>
            ))}
          </View>

          {isFullView && <AuthorSection isBottom />}
        </View>
      </CardWrapper>
    );
  }

  return null;
}
