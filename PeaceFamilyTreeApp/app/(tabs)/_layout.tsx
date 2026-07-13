import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor="#059669">
      <NativeTabs.Trigger name="tree">
        <Label>Tree</Label>
        <Icon sf="leaf.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="memories">
        <Label>Memories</Label>
        <Icon sf="photo.on.rectangle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="collab">
        <Label>Collab</Label>
        <Icon sf="person.2.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
