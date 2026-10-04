import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { fonts } from '@/constants/fonts';
import { colors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';

function tabIcon(name: IconName) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} color={color} size={24} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptics.selection() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="rooms" options={{ title: 'Odalar', tabBarIcon: tabIcon('rooms') }} />
      <Tabs.Screen
        name="leaderboard"
        options={{ title: 'Sıralama', tabBarIcon: tabIcon('leaderboard') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: tabIcon('profile') }} />
    </Tabs>
  );
}
