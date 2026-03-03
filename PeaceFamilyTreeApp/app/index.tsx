import { Redirect } from "expo-router";
import { useAuthStore } from "../lib/auth-store";

export default function Index() {
  const { session, loading } = useAuthStore();

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(tabs)/tree" />;
  }

  return <Redirect href="/(auth)/login" />;
}
