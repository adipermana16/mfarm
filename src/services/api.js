import Constants from 'expo-constants';
import { Platform } from 'react-native';

function normalizeApiBaseUrl(baseUrl) {
  const sanitizedBaseUrl = baseUrl.replace(/\/+$/, '');

  if (sanitizedBaseUrl.endsWith('/api/drip')) {
    return sanitizedBaseUrl;
  }

  if (sanitizedBaseUrl.endsWith('/api')) {
    return `${sanitizedBaseUrl}/drip`;
  }

  return `${sanitizedBaseUrl}/api/drip`;
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return normalizeApiBaseUrl(configuredBaseUrl);
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

  return `http://${host}:5000/api/drip`;
}

export const API_BASE_URL = resolveApiBaseUrl();

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method ?? 'GET';
  let response;

  try {
    console.log(`[API] ${method} ${url}`, {
      body: options.body ?? null,
      headers: options.headers ?? null,
    });

    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      ...options,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Tidak bisa terhubung ke server.';
    console.error(`[API] Network error for ${method} ${url}`, error);
    throw new Error(`Koneksi ke ${API_BASE_URL} gagal. ${message}`);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  console.log(`[API] Response ${method} ${url}`, {
    data,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  });

  if (!response.ok) {
    throw new Error(data?.message ?? `Permintaan ke ${url} gagal.`);
  }

  return data;
}

export function fetchFarmSummary() {
  return request('/farm-summary');
}

export function fetchDripHealth() {
  return request('/health');
}

export function fetchIotReadings(limit) {
  const searchParams = new URLSearchParams();

  if (typeof limit === 'number' && Number.isFinite(limit)) {
    searchParams.set('limit', String(limit));
  }

  const query = searchParams.toString();
  return request(query ? `/iot/readings?${query}` : '/iot/readings');
}

export function createIotReading(payload) {
  return request('/iot/readings', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
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
