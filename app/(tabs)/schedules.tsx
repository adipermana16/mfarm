import { Redirect } from 'expo-router';

import SchedulesScreen from '@/src/screens/SchedulesScreen';
import { useAppPreferences } from '@/src/context/AppPreferencesContext';

export default function SchedulesTab() {
  const { isAdmin } = useAppPreferences();

  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return <SchedulesScreen />;
}
