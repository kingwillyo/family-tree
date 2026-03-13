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
  const { session, appLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (appLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/tree');
    }
  }, [session, appLoading, segments, router]);

  if (appLoading) return null;
  return (
  <ReactNativeGrabScreen>
      <ReactNativeGrabContextProvider value={{ screen: "home" }}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="member" options={{ presentation: 'modal' }} />
      <Stack.Screen name="invite" options={{ presentation: 'modal' }} />
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
