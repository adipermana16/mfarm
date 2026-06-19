import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '@/src/components/Header';
import OverallStatusCard from '@/src/components/StatCard';
import ZoneCard from '@/src/components/ZoneCard';
import { useIotAutoRefresh } from '@/src/hooks/useIotAutoRefresh';
import { API_BASE_URL, fetchFarmSummary } from '@/src/services/api';
import { globalStyles } from '@/src/styles/globalStyles';

type FarmSummary = {
  lastUpdated: string;
  stats: {
    soilMoisture: number;
    temperature: number;
    lightIntensity: number;
    waterTank: number;
    activeZones: number;
  };
  zones: {
    id: string;
    name: string;
    crop: string;
    moisture: number;
    temperature: number;
    lightIntensity: number;
    airHumidity: number;
    trendData: number[];
    initialValveOn: boolean;
    status: 'optimal' | 'warning' | 'critical';
  }[];
};

function getMoistureStatus(moisture: number, isOnline: boolean) {
  if (!isOnline) {
    return 'Offline';
  }

  if (moisture <= 40) {
    return 'Kritis';
  }

  if (moisture <= 55) {
    return 'Peringatan';
  }

  return 'Optimal';
}

export default function HomeScreen() {
  const [summary, setSummary] = useState<FarmSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSummary = useCallback(async (mode: 'initial' | 'refresh' | 'poll' = 'initial') => {
    try {
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else if (mode === 'initial') {
        setIsLoading(true);
      }
      setErrorMessage(null);
      const data = (await fetchFarmSummary()) as FarmSummary;
      setSummary(data);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Periksa koneksi aplikasi dan server.';
      setErrorMessage(`Data kebun belum bisa dimuat dari ${API_BASE_URL}. ${details}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const isDeviceOnline = useIotAutoRefresh(
    useCallback(() => {
      loadSummary('poll');
    }, [loadSummary]),
  );
  const displayedSummary = summary
    ? {
        ...summary,
        stats: {
          ...summary.stats,
          activeZones: isDeviceOnline ? summary.stats.activeZones : 0,
          lightIntensity: isDeviceOnline ? summary.stats.lightIntensity : 0,
          soilMoisture: isDeviceOnline ? summary.stats.soilMoisture : 0,
          temperature: isDeviceOnline ? summary.stats.temperature : 0,
          waterTank: isDeviceOnline ? summary.stats.waterTank : 0,
        },
        zones: summary.zones.map((zone) => ({
          ...zone,
          airHumidity: isDeviceOnline ? zone.airHumidity : 0,
          initialValveOn: isDeviceOnline ? zone.initialValveOn : false,
          lightIntensity: isDeviceOnline ? zone.lightIntensity : 0,
          moisture: isDeviceOnline ? zone.moisture : 0,
          temperature: isDeviceOnline ? zone.temperature : 0,
          trendData: isDeviceOnline ? zone.trendData : zone.trendData.map(() => 0),
        })),
      }
    : null;
  const primaryZone = displayedSummary?.zones?.[0] ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadSummary('refresh')} />}
        showsVerticalScrollIndicator={false}>
        <Header isOnline={isDeviceOnline && !errorMessage} />

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#3c6255" />
            <Text style={styles.stateText}>Memuat data sensor...</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && !isDeviceOnline ? (
          <View style={styles.offlineBox}>
            <Text style={styles.offlineText}>
              Alat IoT tidak mengirim data selama lebih dari 1 menit. Semua nilai sensor diatur ke 0.
            </Text>
          </View>
        ) : null}

        {displayedSummary ? (
          <>
            <View style={styles.section}>
              <OverallStatusCard
                isOnline={isDeviceOnline}
                items={[
                  {
                    color: '#2563eb',
                    icon: 'water-percent',
                    label: 'Rata-rata Kelembapan Tanah',
                    status: getMoistureStatus(displayedSummary.stats.soilMoisture, isDeviceOnline),
                    value: `${displayedSummary.stats.soilMoisture}%`,
                  },
                  {
                    color: '#3c6255',
                    icon: 'valve',
                    label: 'Katup Aktif',
                    value: `${displayedSummary.stats.activeZones} katup`,
                  },
                  {
                    color: '#c2410c',
                    icon: 'thermometer',
                    label: 'Suhu Rata-rata',
                    value: `${displayedSummary.stats.temperature} C`,
                  },
                  {
                    color: '#f59e0b',
                    icon: 'white-balance-sunny',
                    label: 'Intensitas Cahaya',
                    value: `${displayedSummary.stats.lightIntensity} lux`,
                  },
                ]}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.zoneList}>
                {primaryZone ? (
                  <ZoneCard
                    airHumidity={primaryZone.airHumidity}
                    fieldName=""
                    initialValveOn={primaryZone.initialValveOn}
                    isExpanded
                    key={primaryZone.id}
                    lightIntensity={primaryZone.lightIntensity}
                    soilMoisture={primaryZone.moisture}
                    temperature={primaryZone.temperature}
                    trendData={primaryZone.trendData}
                    zoneName="Lahan Tomat"
                  />
                ) : (
                  <View style={styles.stateBox}>
                    <Text style={styles.stateText}>Zona utama belum tersedia.</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: globalStyles.colors.backgroundLight,
    flex: 1,
  },
  content: {
    paddingBottom: 84,
  },
  section: {
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  sectionTitle: {
    color: globalStyles.colors.textDark,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  zoneList: {
    gap: 12,
  },
  stateBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 42,
  },
  stateText: {
    color: globalStyles.colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#fff1e8',
    borderColor: '#fed7aa',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    padding: 14,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '700',
  },
  offlineBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
  },
  offlineText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
  },
});
