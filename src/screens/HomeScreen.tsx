import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '@/src/components/Header';
import QuickActionButton from '@/src/components/QuickActionButton';
import OverallStatusCard from '@/src/components/StatCard';
import ZoneCard from '@/src/components/ZoneCard';
import { fetchFarmSummary } from '@/src/services/api';
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
    } catch {
      setErrorMessage('Data kebun belum bisa dimuat. Coba refresh sebentar lagi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadSummary('poll');
    }, 20000);

    return () => clearInterval(intervalId);
  }, [loadSummary]);

  const showAction = (message: string) => {
    Alert.alert('Aksi cepat', message);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadSummary('refresh')} />}
        showsVerticalScrollIndicator={false}>
        <Header isOnline={!errorMessage} />

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

        {summary ? (
          <>
            <View style={styles.section}>
              <OverallStatusCard
                items={[
                  {
                    color: '#2563eb',
                    icon: 'water-percent',
                    label: 'Rata-rata Kelembapan Tanah',
                    value: `${summary.stats.soilMoisture}%`,
                  },
                  {
                    color: '#3c6255',
                    icon: 'valve',
                    label: 'Katup Aktif',
                    value: `${summary.stats.activeZones} katup`,
                  },
                  {
                    color: '#c2410c',
                    icon: 'weather-partly-cloudy',
                    label: 'Cuaca Lokal',
                    value: `${summary.stats.temperature} C`,
                  },
                  {
                    color: '#f59e0b',
                    icon: 'white-balance-sunny',
                    label: 'Intensitas Cahaya',
                    value: `${summary.stats.lightIntensity} lux`,
                  },
                ]}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.manualBar}>
                <QuickActionButton
                  backgroundColor="transparent"
                  iconName="water-pump"
                  onPress={() => showAction('Perintah irigasi siap dikirim ke perangkat.')}
                  title="Siram Manual"
                />
                <QuickActionButton
                  backgroundColor="#F1E3D5"
                  iconName="stop-circle"
                  onPress={() => showAction('Semua katup akan dihentikan.')}
                  title="Hentikan Semua"
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.zoneList}>
                {summary.zones.map((zone) => (
                  <ZoneCard
                    airHumidity={zone.airHumidity}
                    fieldName={zone.crop}
                    initialValveOn={zone.initialValveOn}
                    isExpanded
                    key={zone.id}
                    lightIntensity={zone.lightIntensity}
                    soilMoisture={zone.moisture}
                    temperature={zone.temperature}
                    trendData={zone.trendData}
                    zoneName={zone.name}
                  />
                ))}
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  manualBar: {
    backgroundColor: globalStyles.colors.warningOrange,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
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
});
