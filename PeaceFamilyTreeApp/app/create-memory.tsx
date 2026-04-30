import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../lib/auth-context';
import { createMemory } from '../lib/memoryService';
import { fetchCurrentUserProfile, Profile } from '../lib/treeService';

export default function CreateMemoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [memory, setMemory] = useState('');
  const [activeType, setActiveType] = useState<'story' | 'photo' | 'audio'>('story');
  const [mediaUri, setMediaUri] = useState<string | null>(null); // For Audio
  const [mediaUris, setMediaUris] = useState<string[]>([]); // For Photos
  const [previewImage, setPreviewImage] = useState<string | null>(null); // For zoom modal
  const [location, setLocation] = useState<string | null>(null);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentUserProfile(user.id).then((p) => {
        if (p) setProfile(p);
      });
    }
  }, [user]);

  const isPostEnabled =
    !isPosting && !!(title.trim() || memory.trim() || mediaUri || mediaUris.length > 0 || location);

  const handlePhotoUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setActiveType('photo');
      const newUris = result.assets.map((asset) => asset.uri);
      setMediaUris((prev) => [...prev, ...newUris]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setMediaUris((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0 && activeType === 'photo') {
        setActiveType('story');
      }
      return updated;
    });
  };

  const handleAudioUpload = () => {
    setActiveType('audio');
    // Mocking an audio recording to avoid native module crashes in Expo Go
    setMediaUri('mock_audio');
  };

  const clearAudio = () => {
    setActiveType('story');
    setMediaUri(null);
  };

  const handleCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setIsFetchingLocation(false);
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const locationString =
          `${place.city || place.name || ''}, ${place.region || place.country || ''}`
            .replace(/^, | ,/g, '')
            .trim();
        setLocation(locationString || 'Current Location');
      } else {
        setLocation('Current Location');
      }
      setLocationModalVisible(false);
    } catch (error) {
      alert('Error fetching location');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleManualLocationSubmit = () => {
    if (manualLocation.trim()) {
      setLocation(manualLocation.trim());
      setLocationModalVisible(false);
      setManualLocation('');
    }
  };

  const handlePost = async () => {
    if (!user) {
      alert('You must be logged in to post a memory.');
      return;
    }
    setIsPosting(true);
    try {
      const result = await createMemory(
        {
          type: activeType,
          title: title.trim() || undefined,
          body: activeType === 'story' ? memory.trim() || undefined : undefined,
          location: location ?? undefined,
          imageUris: activeType === 'photo' ? mediaUris : [],
          audioUri: activeType === 'audio' ? mediaUri ?? undefined : undefined,
          authorProfileId: profile?.id ?? undefined,
        },
        user.id
      );

      if ('error' in result) {
        alert(`Failed to post: ${result.error}`);
      } else {
        router.back();
      }
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Location Modal */}
      <Modal
        visible={isLocationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6 pb-10 shadow-lg">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-gray-900">Add Location</Text>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                className="rounded-full bg-gray-100 p-2">
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleCurrentLocation}
              disabled={isFetchingLocation}
              className="mb-6 flex-row items-center rounded-xl border border-green-100/50 bg-green-50/70 p-4">
              <View className="mr-3 rounded-full bg-[#84cc16] p-2.5">
                <Feather name="navigation" size={18} color="white" />
              </View>
              <Text className="text-[15px] font-bold text-[#65a30d]">
                {isFetchingLocation ? 'Locating...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center rounded-full border border-gray-200 bg-white px-4 py-3">
              <Feather name="search" size={18} color="#9ca3af" />
              <TextInput
                value={manualLocation}
                onChangeText={setManualLocation}
                placeholder="Search for a location..."
                placeholderTextColor="#9ca3af"
                className="ml-3 flex-1 text-[15px] font-medium text-gray-900"
                onSubmitEditing={handleManualLocationSubmit}
              />
              {manualLocation.length > 0 && (
                <TouchableOpacity
                  onPress={handleManualLocationSubmit}
                  className="ml-2 rounded-full bg-[#84cc16] px-3 py-1.5">
                  <Text className="text-[12px] font-bold text-white">Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Zoomable Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}>
        <View className="flex-1 bg-black/95">
          <TouchableOpacity
            onPress={() => setPreviewImage(null)}
            className="absolute right-6 top-14 z-50 rounded-full bg-white/20 p-2.5">
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={{ uri: previewImage || undefined }}
              style={{
                width: Dimensions.get('window').width,
                height: Dimensions.get('window').height * 0.7,
              }}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 pb-3 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="py-2">
          <Text className="text-[16px] font-medium text-gray-500">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-[16px] font-bold text-gray-900">New Memory</Text>

        <TouchableOpacity
          className={`rounded-full px-4 py-1.5 ${isPostEnabled ? 'bg-[#84cc16]' : 'bg-green-100/50'}`}
          disabled={!isPostEnabled}
          onPress={handlePost}>
          {isPosting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text
              className={`text-[14px] font-bold ${isPostEnabled ? 'text-white' : 'text-green-800/40'}`}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View className="mb-4 flex-row items-start">
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="mr-3 h-10 w-10 rounded-full bg-gray-200"
              />
            ) : (
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#f0f9ed]">
                <Text className="text-[15px] font-bold text-[#65a30d]">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View className="flex-1 pt-1">
              {location && (
                <View className="mb-2 flex-row items-center self-start rounded-full bg-[#f0f9ed] px-3 py-1">
                  <Feather name="map-pin" size={12} color="#65a30d" />
                  <Text className="ml-1.5 text-[12px] font-bold text-[#65a30d]">{location}</Text>
                  <TouchableOpacity
                    onPress={() => setLocation(null)}
                    className="ml-2 border-l border-green-200/50 pl-2">
                    <Feather name="x" size={12} color="#65a30d" />
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title of post..."
                placeholderTextColor="#9ca3af"
                className="mb-2 text-[20px] font-bold text-gray-900"
              />
              {activeType === 'story' && (
                <TextInput
                  value={memory}
                  onChangeText={setMemory}
                  placeholder="Add your story..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  scrollEnabled={false}
                  className="min-h-[60px] text-[16px] leading-[24px] text-gray-800"
                  style={{ textAlignVertical: 'top' }}
                />
              )}

              {activeType === 'photo' && mediaUris.length > 0 && (
                <View className="mt-3">
                  <View className="mb-2 mt-1 h-[250px] w-full overflow-hidden rounded-xl bg-gray-100">
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setPreviewImage(mediaUris[0])}
                      className="h-full w-full">
                      <Image
                        source={{ uri: mediaUris[0] }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeImage(0)}
                      className="absolute right-3 top-3 items-center justify-center rounded-full bg-black/50 p-1.5">
                      <Feather name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>

                  {mediaUris.length > 1 && (
                    <View className="flex-row flex-wrap gap-2">
                      {mediaUris.slice(1).map((uri, index) => (
                        <View
                          key={index + 1}
                          className="h-[100px] w-[31.5%] overflow-hidden rounded-xl bg-gray-100">
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setPreviewImage(uri)}
                            className="h-full w-full">
                            <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removeImage(index + 1)}
                            className="absolute right-1.5 top-1.5 items-center justify-center rounded-full bg-black/50 p-1">
                            <Feather name="x" size={14} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {activeType === 'audio' && (
                <View className="mt-3 flex-row items-center justify-between rounded-xl border border-gray-100 bg-[#f9fafb] p-4">
                  <View className="flex-1 flex-row items-center">
                    <TouchableOpacity className="mr-3 items-center justify-center rounded-full bg-[#84cc16] p-2.5">
                      <Ionicons name="play" size={20} color="white" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                    <View className="mr-4 flex-1">
                      <View className="h-6 flex-row items-end items-center justify-between overflow-hidden">
                        {[
                          10, 15, 8, 20, 24, 12, 16, 22, 14, 8, 18, 24, 16, 10, 14, 20, 12, 18, 8,
                          14, 22, 16,
                        ].map((height, i) => (
                          <View
                            key={i}
                            className="w-[3px] rounded-full bg-[#84cc16]"
                            style={{ height: height }}
                          />
                        ))}
                      </View>
                      <View className="mt-2 flex-row justify-between">
                        <Text className="text-[12px] font-medium text-gray-500">0:00</Text>
                        <Text className="text-[12px] font-medium text-gray-500">2:15</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={clearAudio}
                    className="items-center justify-center rounded-full bg-gray-200 p-1.5">
                    <Feather name="x" size={14} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Toolbar */}
        <View className="flex-row items-center border-t border-gray-100/80 bg-white px-4 py-3 pb-6">
          <TouchableOpacity
            onPress={handlePhotoUpload}
            className={`mr-5 items-center justify-center rounded-full p-2 ${activeType === 'photo' ? 'bg-[#84cc16]' : 'bg-green-50/50'}`}>
            <Feather name="image" size={22} color={activeType === 'photo' ? 'white' : '#84cc16'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAudioUpload}
            className={`mr-5 items-center justify-center rounded-full p-2 ${activeType === 'audio' ? 'bg-[#84cc16]' : 'bg-green-50/50'}`}>
            <Feather name="mic" size={22} color={activeType === 'audio' ? 'white' : '#84cc16'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLocationModalVisible(true)}
            className={`mr-5 items-center justify-center rounded-full p-2 ${location ? 'bg-[#84cc16]' : 'bg-green-50/50'}`}>
            <Feather name="map-pin" size={22} color={location ? 'white' : '#84cc16'} />
          </TouchableOpacity>
          <TouchableOpacity className="mr-5 items-center justify-center rounded-full bg-green-50/50 p-2">
            <Feather name="user-plus" size={22} color="#84cc16" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
