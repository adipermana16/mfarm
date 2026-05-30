import { Redirect } from 'expo-router';

import AddScheduleScreen from '@/src/screens/AddScheduleScreen';
import { useAppPreferences } from '@/src/context/AppPreferencesContext';

export default function AddScheduleRoute() {
  const { isAdmin } = useAppPreferences();

  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return <AddScheduleScreen />;
}
