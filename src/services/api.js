import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiBaseUrl() {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  const expoHost =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    Constants.manifest?.debuggerHost;

  const detectedHost = expoHost?.split(':')?.[0];
  const fallbackHost = Platform.select({
    android: '10.0.2.2',
    default: '127.0.0.1',
  });
  const host = detectedHost || fallbackHost;

  return `http://${host}:5000/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message ?? 'Permintaan ke server gagal.');
  }

  return data;
}

export function fetchFarmSummary() {
  return request('/farm-summary');
}

export function fetchSchedules() {
  return request('/schedules');
}

export function createSchedule(payload) {
  return request('/schedules', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updateScheduleStatus(scheduleId, isEnabled) {
  return request(`/schedules/${scheduleId}`, {
    body: JSON.stringify({ isEnabled }),
    method: 'PATCH',
  });
}

export function fetchHistory(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.month) {
    searchParams.set('month', String(params.month));
  }

  if (params.year) {
    searchParams.set('year', String(params.year));
  }

  const query = searchParams.toString();
  return request(query ? `/history?${query}` : '/history');
}

export function fetchProfile() {
  return request('/profile');
}

export function saveProfile(profile) {
  return request('/profile', {
    body: JSON.stringify(profile),
    method: 'PUT',
  });
}
