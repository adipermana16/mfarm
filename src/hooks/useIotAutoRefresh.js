import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';

import { fetchIotReadings } from '@/src/services/api';

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

function buildReadingSignature(reading) {
  if (!reading || typeof reading !== 'object') {
    return null;
  }

  return (
    reading.id ??
    reading._id ??
    reading.timestamp ??
    reading.recordedAt ??
    reading.createdAt ??
    reading.updatedAt ??
    JSON.stringify(reading)
  );
}

export function useIotAutoRefresh(onDataChanged, intervalMs = 5000) {
  const latestSignatureRef = useRef(null);
  const isCheckingRef = useRef(false);

  const checkLatestReading = useCallback(async () => {
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      const payload = await fetchIotReadings(1);
      const latestReading = pickLatestReading(payload);
      const nextSignature = buildReadingSignature(latestReading);

      if (!nextSignature) {
        return;
      }

      if (latestSignatureRef.current === null) {
        latestSignatureRef.current = nextSignature;
        return;
      }

      if (latestSignatureRef.current !== nextSignature) {
        latestSignatureRef.current = nextSignature;
        onDataChanged?.();
      }
    } catch {
      // Biarkan layar tetap menggunakan data terakhir jika watcher IoT gagal sesaat.
    } finally {
      isCheckingRef.current = false;
    }
  }, [onDataChanged]);

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
}
