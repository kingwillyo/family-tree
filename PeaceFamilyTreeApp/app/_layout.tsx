import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ReactNativeGrabRoot,
  ReactNativeGrabScreen,
  ReactNativeGrabContextProvider,
} from 'react-native-grab';

function LayoutContent() {
  const { session, hasProfile, appLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (appLoading) return;

    const inAuthGroup = segments.some(s => ['(auth)', 'login', 'register', 'welcome'].includes(s));
    const inOnboarding = segments.some(s => s === 'onboarding');

    // Case 1: Not signed in, not in auth screens -> go to welcome
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
      return;
    }

    // Case 2: Signed in
    if (session) {
      // 2a: No profile and not already onboarding -> go to onboarding
      if (!hasProfile && !inOnboarding) {
        router.replace('/onboarding');
      } 
      // 2b: Has profile but still in auth screens or onboarding -> go to main app
      else if (hasProfile && (inAuthGroup || inOnboarding)) {
        router.replace('/(tabs)/tree');
      }
    }
  }, [session, hasProfile, appLoading, segments]);

  if (appLoading) return null;
  return (
  <ReactNativeGrabScreen>
      <ReactNativeGrabContextProvider value={{ screen: "home" }}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="member" options={{ presentation: 'modal' }} />
      <Stack.Screen name="invite" options={{ presentation: 'modal' }} />
      <Stack.Screen name="create-memory" options={{ presentation: 'modal' }} />
    </Stack>
    </ReactNativeGrabContextProvider>
    </ReactNativeGrabScreen>
  );
}

export default function RootLayout() {
  return (
    <ReactNativeGrabRoot>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </GestureHandlerRootView>
    </ReactNativeGrabRoot>
  );
}
