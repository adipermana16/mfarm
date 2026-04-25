import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchProfile, saveProfile } from '@/src/services/api';

type UserProfile = {
  name: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  farmName: string;
  farmArea: string;
  activeSince: string;
};

type AppTheme = {
  background: string;
  card: string;
  text: string;
  mutedText: string;
  border: string;
  iconBackground: string;
  pressed: string;
};

type AppPreferences = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => Promise<void>;
  theme: AppTheme;
};

const initialProfile: UserProfile = {
  name: 'Andi Pratama',
  role: 'Petani Hidroponik',
  location: 'Bandung, Jawa Barat',
  email: 'andi.pratama@mfarm.id',
  phone: '+62 812 3456 7890',
  farmName: 'Kebun SmartDrip Lembang',
  farmArea: '2,4 hektare',
  activeSince: 'April 2026',
};

const lightTheme: AppTheme = {
  background: '#F7F8F6',
  card: '#ffffff',
  text: '#111111',
  mutedText: '#5b655f',
  border: '#E7E7E7',
  iconBackground: '#F1F8F2',
  pressed: '#F5F5F5',
};

const darkTheme: AppTheme = {
  background: '#101815',
  card: '#18231F',
  text: '#F4F7F5',
  mutedText: '#B7C4BE',
  border: '#2E4039',
  iconBackground: '#21362E',
  pressed: '#22352F',
};

const AppPreferencesContext = createContext<AppPreferences | null>(null);

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const [darkMode, setDarkMode] = useState(false);
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const nextProfile = await fetchProfile();
        if (isMounted) {
          setProfile(nextProfile);
        }
      } catch {
        // Tetap pakai data lokal bawaan jika backend belum tersedia.
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = useCallback(async (nextProfile: UserProfile) => {
    const savedProfile = await saveProfile(nextProfile);
    setProfile(savedProfile);
  }, []);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      profile,
      updateProfile,
      theme: darkMode ? darkTheme : lightTheme,
    }),
    [darkMode, profile, updateProfile],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error('useAppPreferences harus digunakan di dalam AppPreferencesProvider.');
  }

  return context;
}
