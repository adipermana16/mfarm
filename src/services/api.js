import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PRODUCTION_API_BASE_URL = 'http://43.156.89.66:9000/api/drip';

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

  if (!__DEV__) {
    return PRODUCTION_API_BASE_URL;
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
const OTP_TTL_MS = 5 * 60 * 1000;
const registrationDatabase = [];
const pendingOtpStore = new Map();

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
    const error = new Error(data?.message ?? `Permintaan ke ${url} gagal.`);
    error.status = response.status;
    throw error;
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

  if (params.day) {
    searchParams.set('day', String(params.day));
  }

  if (params.month) {
    searchParams.set('month', String(params.month));
  }

  if (params.year) {
    searchParams.set('year', String(params.year));
  }

  const query = searchParams.toString();
  return request(query ? `/history?${query}` : '/history');
}

export function fetchProfile(email) {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return request(`/profile${query}`);
}

export function saveProfile(profile, accountEmail) {
  return request('/profile', {
    body: JSON.stringify({ ...profile, accountEmail }),
    method: 'PUT',
  });
}

export function registerAccount(payload) {
  return request('/auth/register', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function loginAccount(payload) {
  return request('/auth/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

function buildMaskedDestination(email, phone) {
  if (email) {
    const [namePart, domainPart] = email.split('@');
    const safeName = namePart.length <= 2 ? `${namePart[0] || ''}*` : `${namePart.slice(0, 2)}***`;
    return `${safeName}@${domainPart}`;
  }

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const visible = digits.slice(-3);
    return `+** *** *** ${visible}`;
  }

  return 'kontak pengguna';
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createMockRegistrationRequest(payload) {
  const requestId = `otp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  pendingOtpStore.set(requestId, {
    code,
    expiresAt,
    payload,
  });

  return {
    expiresAt,
    maskedDestination: buildMaskedDestination(payload.email, payload.phone),
    requestId,
  };
}

function validateOtpRequest(requestId, otp) {
  const pendingRequest = pendingOtpStore.get(requestId);

  if (!pendingRequest) {
    throw new Error('Sesi OTP tidak ditemukan. Silakan kirim ulang kode verifikasi.');
  }

  if (new Date(pendingRequest.expiresAt).getTime() < Date.now()) {
    pendingOtpStore.delete(requestId);
    throw new Error('Kode OTP sudah kedaluwarsa. Silakan kirim ulang.');
  }

  if (pendingRequest.code !== otp) {
    throw new Error('Kode OTP tidak valid. Periksa kembali 6 digit yang dimasukkan.');
  }

  return pendingRequest;
}

function toStoredUser(payload) {
  return {
    createdAt: new Date().toISOString(),
    email: payload.email.trim(),
    fullName: payload.fullName.trim(),
    id: `usr-${Date.now()}`,
    password: payload.password,
    phone: payload.phone.trim(),
  };
}

export async function requestRegistrationOtp(payload) {
  try {
    return await request('/auth/register/request-otp', {
      body: JSON.stringify(payload),
      method: 'POST',
    });
  } catch {
    return createMockRegistrationRequest(payload);
  }
}

export async function resendRegistrationOtp(requestId) {
  try {
    return await request('/auth/register/resend-otp', {
      body: JSON.stringify({ requestId }),
      method: 'POST',
    });
  } catch {
    const existingRequest = pendingOtpStore.get(requestId);

    if (!existingRequest) {
      throw new Error('Sesi OTP tidak ditemukan. Kembali ke formulir registrasi.');
    }

    const nextCode = generateOtpCode();
    const nextExpiry = new Date(Date.now() + OTP_TTL_MS).toISOString();

    pendingOtpStore.set(requestId, {
      ...existingRequest,
      code: nextCode,
      expiresAt: nextExpiry,
    });

    return {
      expiresAt: nextExpiry,
      maskedDestination: buildMaskedDestination(existingRequest.payload.email, existingRequest.payload.phone),
      requestId,
    };
  }
}

export async function verifyRegistrationOtp(requestId, otp) {
  try {
    return await request('/auth/register/verify-otp', {
      body: JSON.stringify({ otp, requestId }),
      method: 'POST',
    });
  } catch {
    const pendingRequest = validateOtpRequest(requestId, otp);
    const storedUser = toStoredUser(pendingRequest.payload);

    registrationDatabase.push(storedUser);
    pendingOtpStore.delete(requestId);

    return { user: storedUser };
  }
}

export function getRegisteredUsers() {
  return registrationDatabase;
}
