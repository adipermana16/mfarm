import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import AppSplashScreen from '@/src/components/AppSplashScreen';
import { AppPreferencesProvider, useAppPreferences } from '@/src/context/AppPreferencesContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { darkMode } = useAppPreferences();
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      if (isMounted) {
        setIsBooting(false);
      }
      await SplashScreen.hideAsync();
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isBooting) {
    return <AppSplashScreen />;
  }

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
