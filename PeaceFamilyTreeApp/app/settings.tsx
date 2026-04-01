import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          } 
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, color = '#111827', rightElement }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={!onPress}
      className="mb-3 flex-row items-center justify-between rounded-[24px] bg-white p-5 border border-gray-50 shadow-sm">
      <View className="flex-row items-center flex-1">
        <View className={`mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-gray-50`}>
          <Feather name={icon} size={20} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-bold text-gray-900">{title}</Text>
          {subtitle && <Text className="text-[12px] text-gray-400 mt-0.5">{subtitle}</Text>}
        </View>
      </View>
      {rightElement ? rightElement : (onPress && <Feather name="chevron-right" size={20} color="#cbd5e1" />)}
    </TouchableOpacity>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <Text className="mb-4 mt-6 px-2 text-[12px] font-bold uppercase tracking-widest text-gray-400">
      {title}
    </Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#fcFAF8]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pb-4 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
          <Feather name="chevron-left" size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="ml-2 text-[26px] font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        
        <SectionTitle title="Account" />
        <SettingItem 
          icon="user" 
          title="Personal Information" 
          subtitle={user?.email}
          onPress={() => {}}
        />
        <SettingItem 
          icon="shield" 
          title="Security" 
          subtitle="Password, 2FA"
          onPress={() => {}}
        />
        <SettingItem 
          icon="bell" 
          title="Notifications" 
          rightElement={
            <Switch 
              value={notificationsEnabled} 
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#f3f4f6', true: '#8cc63f' }}
              thumbColor="white"
            />
          }
        />

        <SectionTitle title="Preferences" />
        <SettingItem 
          icon="moon" 
          title="Dark Mode" 
          subtitle="Coming soon"
          rightElement={
            <Switch 
              value={darkMode} 
              onValueChange={setDarkMode}
              disabled
              trackColor={{ false: '#f3f4f6', true: '#8cc63f' }}
              thumbColor="white"
            />
          }
        />
        <SettingItem 
          icon="globe" 
          title="Language" 
          subtitle="English (US)"
          onPress={() => {}}
        />

        <SectionTitle title="Support" />
        <SettingItem 
          icon="help-circle" 
          title="Help Center" 
          onPress={() => {}}
        />
        <SettingItem 
          icon="info" 
          title="About" 
          subtitle="Version 1.0.0"
          onPress={() => {}}
        />

        <View className="mt-10">
          <TouchableOpacity 
            onPress={handleSignOut}
            className="flex-row items-center justify-center rounded-[24px] bg-red-50 py-5 border border-red-100">
            <Feather name="log-out" size={18} color="#ef4444" className="mr-2" />
            <Text className="text-[16px] font-bold text-red-500">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-8 text-center text-[12px] font-medium text-gray-300">
          Peace Family Tree &copy; 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
