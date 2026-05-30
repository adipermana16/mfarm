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
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (credentials: { email: string; password: string }) => { success: boolean; message?: string };
  signOut: () => void;
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => Promise<void>;
  applyRegisteredAccount: (account: { fullName: string; email: string; phone: string }) => void;
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

const adminAccount = {
  email: 'admin@mfarm.id',
  password: 'admin12345',
};

const adminProfile: UserProfile = {
  name: 'Admin MFarm',
  role: 'Admin',
  location: 'Bandung, Jawa Barat',
  email: adminAccount.email,
  phone: '+62 812 0000 0000',
  farmName: 'MFarm SmartDrip',
  farmArea: 'Semua lahan',
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

export function isAdminRole(role: string) {
  const normalizedRole = role.trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'administrator';
}

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const [darkMode, setDarkMode] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const signIn = useCallback(
    ({ email, password }: { email: string; password: string }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      const profileEmail = profile.email.trim().toLowerCase();

      if (!normalizedEmail || !normalizedPassword) {
        return {
          message: 'Email dan password wajib diisi.',
          success: false,
        };
      }

      if (normalizedEmail === adminAccount.email) {
        if (normalizedPassword !== adminAccount.password) {
          return {
            message: 'Password admin tidak sesuai.',
            success: false,
          };
        }

        setProfile(adminProfile);
        setIsAuthenticated(true);
        return { success: true };
      }

      if (normalizedEmail !== profileEmail) {
        return {
          message: 'Email belum terdaftar di aplikasi.',
          success: false,
        };
      }

      if (normalizedPassword.length < 8) {
        return {
          message: 'Password minimal 8 karakter.',
          success: false,
        };
      }

      setIsAuthenticated(true);
      return { success: true };
    },
    [profile.email],
  );

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const applyRegisteredAccount = useCallback((account: { fullName: string; email: string; phone: string }) => {
    const activeSince = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    setProfile((current) => ({
      ...current,
      activeSince,
      email: account.email.trim(),
      name: account.fullName.trim(),
      phone: account.phone.trim(),
      role: 'Petani Terdaftar',
    }));
    setIsAuthenticated(true);
  }, []);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      isAuthenticated,
      isAdmin: isAdminRole(profile.role),
      signIn,
      signOut,
      profile,
      updateProfile,
      applyRegisteredAccount,
      theme: darkMode ? darkTheme : lightTheme,
    }),
    [applyRegisteredAccount, darkMode, isAuthenticated, profile, signIn, signOut, updateProfile],
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
