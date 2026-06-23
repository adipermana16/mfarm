import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchProfile, loginAccount, registerAccount, saveProfile } from '@/src/services/api';
import {
  clearAuthSession,
  createAuthSession,
  findAccountProfile,
  restoreAuthSession,
  saveAccountProfile,
} from '@/src/services/authSession';

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
  isSessionReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => Promise<void>;
  applyRegisteredAccount: (account: { fullName: string; email: string; phone: string; password: string }) => Promise<void>;
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
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const storedSession = await restoreAuthSession();
        if (storedSession && isMounted) {
          setProfile(storedSession.profile);
          setIsAuthenticated(true);
          return;
        }

        const nextProfile = await fetchProfile();
        if (isMounted) {
          setProfile(nextProfile);
        }
      } catch {
        // Tetap pakai data lokal bawaan jika backend belum tersedia.
      } finally {
        if (isMounted) {
          setIsSessionReady(true);
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = useCallback(
    async (nextProfile: UserProfile) => {
      const savedProfile = await saveProfile(nextProfile, profile.email);
      if (isAuthenticated) {
        await saveAccountProfile(savedProfile, profile.email);
        await createAuthSession(savedProfile);
      }
      setProfile(savedProfile);
    },
    [isAuthenticated, profile.email],
  );

  const signIn = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

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

        await createAuthSession(adminProfile);
        setProfile(adminProfile);
        setIsAuthenticated(true);
        return { success: true };
      }

      let accountProfile: UserProfile | null = null;

      try {
        const result = await loginAccount({
          email: normalizedEmail,
          password: normalizedPassword,
        });
        accountProfile = result.profile;
      } catch (error) {
        if (error && typeof error === 'object' && 'status' in error) {
          return {
            message: error instanceof Error ? error.message : 'Email atau password tidak sesuai.',
            success: false,
          };
        }

        const storedAccountProfile = await findAccountProfile(normalizedEmail);
        const currentProfile =
          profile.email.trim().toLowerCase() === normalizedEmail ? profile : null;
        accountProfile = storedAccountProfile ?? currentProfile;
      }

      if (!accountProfile) {
        return {
          message: 'Email belum terdaftar di aplikasi.',
          success: false,
        };
      }

      if (!accountProfile || normalizedPassword.length < 8) {
        return {
          message: accountProfile ? 'Password minimal 8 karakter.' : 'Email atau password tidak sesuai.',
          success: false,
        };
      }

      await createAuthSession(accountProfile);
      setProfile(accountProfile);
      setIsAuthenticated(true);
      return { success: true };
    },
    [profile],
  );

  const signOut = useCallback(async () => {
    await clearAuthSession();
    setIsAuthenticated(false);
  }, []);

  const applyRegisteredAccount = useCallback(async (account: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const activeSince = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const localProfile: UserProfile = {
      activeSince,
      email: account.email.trim(),
      farmArea: 'Belum diatur',
      farmName: 'Kebun Saya',
      location: 'Belum diatur',
      name: account.fullName.trim(),
      phone: account.phone.trim(),
      role: 'Petani Terdaftar',
    };

    const result = await registerAccount({
      email: account.email.trim(),
      fullName: account.fullName.trim(),
      password: account.password,
      phone: account.phone.trim(),
      profile: localProfile,
    });
    const nextProfile = result.profile ?? localProfile;

    await createAuthSession(nextProfile);
    setProfile(nextProfile);
    setIsAuthenticated(true);
  }, []);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      isSessionReady,
      isAuthenticated,
      isAdmin: isAdminRole(profile.role),
      signIn,
      signOut,
      profile,
      updateProfile,
      applyRegisteredAccount,
      theme: darkMode ? darkTheme : lightTheme,
    }),
    [applyRegisteredAccount, darkMode, isAuthenticated, isSessionReady, profile, signIn, signOut, updateProfile],
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
