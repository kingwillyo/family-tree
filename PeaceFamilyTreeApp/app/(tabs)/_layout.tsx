import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  return (
    <NativeTabs tintColor="#059669">
      <NativeTabs.Trigger name="tree">
        <NativeTabs.Trigger.Label>Tree</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "tree", selected: "tree.fill" }}
          md="nature"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

