import { Redirect } from 'expo-router';

import LoginScreen from '@/src/screens/LoginScreen';
import { useAppPreferences } from '@/src/context/AppPreferencesContext';

export default function IndexScreen() {
  const { isAuthenticated } = useAppPreferences();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <LoginScreen />;
}
