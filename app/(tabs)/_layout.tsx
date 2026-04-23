import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppPreferences } from '@/src/context/AppPreferencesContext';
import { globalStyles } from '@/src/styles/globalStyles';

export default function TabLayout() {
  const { darkMode, theme } = useAppPreferences();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: globalStyles.colors.primaryGreen,
        tabBarInactiveTintColor: darkMode ? '#B7C4BE' : globalStyles.colors.textLight,
        tabBarLabelStyle: {
          fontFamily: globalStyles.typography.fontFamily,
          fontSize: 11,
          fontWeight: '400',
        },
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 0,
          elevation: 10,
          height: 62,
          paddingBottom: 6,
          paddingTop: 5,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Pengaturan',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
