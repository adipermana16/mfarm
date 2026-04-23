import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppPreferencesProvider, useAppPreferences } from '@/src/context/AppPreferencesContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const { darkMode } = useAppPreferences();
  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-schedule" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Jendela' }} />
      </Stack>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <RootLayoutContent />
    </AppPreferencesProvider>
  );
}
