import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type StoredUserProfile = {
  name: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  farmName: string;
  farmArea: string;
  activeSince: string;
};

type StoredSession = {
  token: string;
  profile: StoredUserProfile;
  createdAt: string;
};

const SESSION_STORAGE_KEY = 'mfarm.auth.session.v1';
const ACCOUNT_PROFILES_STORAGE_KEY = 'mfarm.auth.account-profiles.v1';

function createSessionToken() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `mfarm-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<StoredSession>;
  return Boolean(
    session.token &&
      session.createdAt &&
      session.profile &&
      typeof session.profile.email === 'string' &&
      typeof session.profile.role === 'string',
  );
}

async function readStoredValue(key: string) {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function writeStoredValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readAccountProfiles() {
  try {
    const storedValue = await readStoredValue(ACCOUNT_PROFILES_STORAGE_KEY);
    if (!storedValue) {
      return {};
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return {};
    }

    return parsedValue as Record<string, StoredUserProfile>;
  } catch {
    return {};
  }
}

export async function createAuthSession(profile: StoredUserProfile) {
  const session: StoredSession = {
    createdAt: new Date().toISOString(),
    profile,
    token: createSessionToken(),
  };

  await Promise.all([
    writeStoredValue(SESSION_STORAGE_KEY, JSON.stringify(session)),
    saveAccountProfile(profile),
  ]);
  return session;
}

export async function restoreAuthSession() {
  try {
    const storedValue = await readStoredValue(SESSION_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const session: unknown = JSON.parse(storedValue);
    return isStoredSession(session) ? session : null;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}

export async function findAccountProfile(email: string) {
  const accountProfiles = await readAccountProfiles();
  return accountProfiles[normalizeEmail(email)] ?? null;
}

export async function saveAccountProfile(profile: StoredUserProfile, previousEmail?: string) {
  const accountProfiles = await readAccountProfiles();
  const emailKey = normalizeEmail(profile.email);
  const previousEmailKey = previousEmail ? normalizeEmail(previousEmail) : emailKey;

  if (previousEmailKey !== emailKey) {
    delete accountProfiles[previousEmailKey];
  }

  accountProfiles[emailKey] = profile;
  await writeStoredValue(ACCOUNT_PROFILES_STORAGE_KEY, JSON.stringify(accountProfiles));
}
