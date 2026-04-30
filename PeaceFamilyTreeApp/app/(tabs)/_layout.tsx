import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor="#059669">
      <NativeTabs.Trigger name="tree">
        <NativeTabs.Trigger.Label>Tree</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="leaf.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="memories">
        <NativeTabs.Trigger.Label>Memories</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="photo.on.rectangle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="collab">
        <NativeTabs.Trigger.Label>Collab</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
