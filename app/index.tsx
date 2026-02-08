import { ScreenContent } from 'components/ScreenContent';
import { Stack } from 'expo-router';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <ScreenContent path="app/index.tsx" title="Home" />
    </>
  );
}
