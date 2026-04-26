import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(tabs)/tree" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
