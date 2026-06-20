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

async function readStoredValue() {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(SESSION_STORAGE_KEY) ?? null;
  }

  return SecureStore.getItemAsync(SESSION_STORAGE_KEY);
}

async function writeStoredValue(value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
}

export async function createAuthSession(profile: StoredUserProfile) {
  const session: StoredSession = {
    createdAt: new Date().toISOString(),
    profile,
    token: createSessionToken(),
  };

  await writeStoredValue(JSON.stringify(session));
  return session;
}

export async function restoreAuthSession() {
  try {
    const storedValue = await readStoredValue();
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
