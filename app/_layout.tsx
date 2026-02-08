import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import '../global.css';

export default function Layout() {
  return (
    <>
      <Stack />
      <StatusBar style="auto" />
    </>
  );
}
