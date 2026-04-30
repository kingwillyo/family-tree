import { Stack } from 'expo-router';

export default function MemberLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="relationships/[id]" />
    </Stack>
  );
}
