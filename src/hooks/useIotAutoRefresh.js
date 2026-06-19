import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fetchIotReadings } from '@/src/services/api';
import { saveIotReadingsToCache } from '@/src/services/iotHistoryCache';

function pickLatestReading(payload) {
  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }

  if (Array.isArray(payload?.readings)) {
    return payload.readings[0] ?? null;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data[0] ?? null;
  }

  return payload ?? null;
}

function normalizeReadings(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.readings)) {
    return payload.readings;
  }

  if (Array.isArray(payload?.history)) {
    return payload.history;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return payload ? [payload] : [];
}

function buildReadingSignature(reading) {
  if (!reading || typeof reading !== 'object') {
    return null;
  }

  return (
    reading.id ??
    reading._id ??
    reading.timestamp ??
    reading.recordedAt ??
    reading.recorded_at ??
    reading.createdAt ??
    reading.updatedAt ??
    reading.date ??
    reading.tanggal ??
    reading.waktuTanggal ??
    reading.datetime ??
    reading.dateTime ??
    JSON.stringify(reading)
  );
}

function getReadingTimestamp(reading) {
  return (
    reading?.receivedAt ??
    reading?.received_at ??
    reading?.recordedAt ??
    reading?.recorded_at ??
    reading?.timestamp ??
    reading?.createdAt ??
    reading?.created_at ??
    null
  );
}

function isReadingFresh(reading, offlineAfterMs) {
  const timestamp = getReadingTimestamp(reading);
  const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;

  if (!Number.isFinite(timestampMs)) {
    return false;
  }

  return Date.now() - timestampMs <= offlineAfterMs;
}

export function useIotAutoRefresh(onDataChanged, intervalMs = 5000, offlineAfterMs = 60000) {
  const latestSignatureRef = useRef(null);
  const isCheckingRef = useRef(false);
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);

  const checkLatestReading = useCallback(async () => {
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      const payload = await fetchIotReadings();
      const readings = normalizeReadings(payload);
      const latestReading = pickLatestReading(payload);
      const nextSignature = buildReadingSignature(latestReading);

      if (!nextSignature) {
        setIsDeviceOnline(false);
        return;
      }

      setIsDeviceOnline(isReadingFresh(latestReading, offlineAfterMs));
      await saveIotReadingsToCache(readings);

      if (latestSignatureRef.current === null) {
        latestSignatureRef.current = nextSignature;
        return;
      }

      if (latestSignatureRef.current !== nextSignature) {
        latestSignatureRef.current = nextSignature;
        onDataChanged?.();
      }
    } catch {
      setIsDeviceOnline(false);
    } finally {
      isCheckingRef.current = false;
    }
  }, [offlineAfterMs, onDataChanged]);

  useFocusEffect(
    useCallback(() => {
      checkLatestReading();

      const intervalId = setInterval(() => {
        checkLatestReading();
      }, intervalMs);

      const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          checkLatestReading();
        }
      });

      return () => {
        clearInterval(intervalId);
        appStateSubscription.remove();
      };
    }, [checkLatestReading, intervalMs]),
  );

  return isDeviceOnline;
}
