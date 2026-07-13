import { Link } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { Button } from '../../components/Button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Build Your Family Tree',
    description: 'Connect with your relatives and build a lasting legacy for your family.',
    image: require('../../assets/images/onboarding_1.png'),
  },
  {
    id: '2',
    title: 'Share Family Journeys',
    description: 'Capture and preserve precious memories with your loved ones.',
    image: require('../../assets/images/onboarding_2.png'),
  },
  {
    id: '3',
    title: 'A Private Space for Family',
    description: 'Your family data is yours. Secure, private, and always connected.',
    image: require('../../assets/images/onboarding_3.png'),
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    flatListRef.current?.scrollToIndex({
      index: SLIDES.length - 1,
      animated: true,
    });
  };

  const renderSlide = ({ item }: { item: (typeof SLIDES)[0] }) => (
    <View style={{ width }} className="items-center px-10">
      <View className="mb-8 mt-12 h-80 w-full items-center justify-center">
        <Image source={item.image} className="h-full w-full" resizeMode="contain" />
      </View>
      <Text className="mb-4 text-center text-3xl font-extrabold leading-tight text-[#1a2b21] dark:text-white">
        {item.title}
      </Text>
      <Text className="text-center text-lg leading-6 text-[#3e4d44] dark:text-slate-400">
        {item.description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8fcf4] dark:bg-slate-950">
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item) => item.id}
        />

        {/* Pagination Dots */}
        <View className="mb-10 flex-row justify-center gap-2">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === activeIndex
                  ? 'w-8 bg-[#064e3b] dark:bg-emerald-500'
                  : 'w-2 bg-gray-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-12">
          {activeIndex < SLIDES.length - 1 ? (
            <Button title="Next" variant="brand" onPress={handleNext} className="mb-4" />
          ) : (
            <>
              <Link href="/(auth)/register" asChild>
                <Button title="Create Account" variant="brand" className="mb-4" />
              </Link>

              <Link href="/(auth)/login" asChild>
                <Button title="Log In" variant="secondary" />
              </Link>
            </>
          )}

          {/* Footer Links (Conditions apply if it's the last page) */}
          <View className="mt-8 flex-row justify-center gap-1 opacity-80">
            <Text className="text-xs text-gray-400 dark:text-slate-500">
              By continuing, you agree to our
            </Text>
            <TouchableOpacity>
              <Text className="text-xs font-semibold text-[#059669] dark:text-emerald-500">
                Terms
              </Text>
            </TouchableOpacity>
            <Text className="text-xs text-gray-400 dark:text-slate-500">&</Text>
            <TouchableOpacity>
              <Text className="text-xs font-semibold text-[#059669] dark:text-emerald-500">
                Privacy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Top Header - Skip Button */}
      {activeIndex < SLIDES.length - 1 && (
        <View className="absolute right-6 top-16">
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} className="px-4 py-2">
            <Text className="text-base font-bold text-[#064e3b] opacity-80 dark:text-emerald-500">
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
