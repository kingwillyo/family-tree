import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="tree">
        <Label>Tree</Label>
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="tree" />}
          selectedColor="#059669"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="memories">
        <Label>Memories</Label>
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="image-multiple" />}
          selectedColor="#059669"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="collab">
        <Label>Collab</Label>
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="account-group" />}
          selectedColor="#059669"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="account" />}
          selectedColor="#059669"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
