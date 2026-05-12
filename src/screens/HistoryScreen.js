import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIotAutoRefresh } from '@/src/hooks/useIotAutoRefresh';
import { fetchIotReadings } from '@/src/services/api';
import { globalStyles } from '@/src/styles/globalStyles';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);
const initialHistory = {
  chartData: [],
  exportRows: [],
  latestReading: null,
  pastEvents: [],
  selectedMonth: null,
};

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function normalizeReadings(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.readings)) {
    return payload.readings;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function getReadingTimestamp(reading) {
  return (
    reading?.timestamp ??
    reading?.recordedAt ??
    reading?.createdAt ??
    reading?.updatedAt ??
    reading?.time ??
    reading?.date ??
    reading?.created_at ??
    reading?.updated_at ??
    null
  );
}

function findValueByKeys(object, keys, visited = new WeakSet()) {
  if (object == null || typeof object !== 'object') {
    return null;
  }

  if (visited.has(object)) {
    return null;
  }

  visited.add(object);

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      return object[key];
    }
  }

  for (const value of Object.values(object)) {
    if (typeof value === 'object' && value !== null) {
      const nested = findValueByKeys(value, keys, visited);
      if (nested != null) {
        return nested;
      }
    }
  }

  return null;
}

const PUMP_KEYS = [
  'pump',
  'pumpValue',
  'pump_value',
  'pumpStatus',
  'pump_status',
  'pumpState',
  'pump_state',
  'pumpOn',
  'pumpOff',
  'state',
  'status',
  'value',
  'val',
];

function normalizeValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'on' || normalized === 'true') {
      return 1;
    }
    if (normalized === 'off' || normalized === 'false') {
      return 0;
    }
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof value === 'object' && value !== null) {
    const nested = findValueByKeys(value, PUMP_KEYS);
    if (nested != null) {
      return normalizeValue(nested);
    }
  }

  return null;
}

function getNumericValue(reading, keys) {
  const value = findValueByKeys(reading, keys);
  return normalizeValue(value);
}

function getPumpValue(reading) {
  return getNumericValue(reading, PUMP_KEYS);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function buildHistoryFromReadings(readings, selectedMonth) {
  const filteredEntries = readings
    .map((reading, index) => {
      const timestamp = getReadingTimestamp(reading);
      const date = timestamp ? new Date(timestamp) : null;

      if (!date || Number.isNaN(date.getTime())) {
        return null;
      }

      return {
        airHumidity: getNumericValue(reading, ['airHumidity', 'air_humidity', 'humidity']),
        date,
        id: reading.id ?? reading._id ?? `${timestamp}-${index}`,
        lightIntensity: getNumericValue(reading, ['lightIntensity', 'light_intensity', 'lux']),
        moisture: getNumericValue(reading, ['soilMoisture', 'soil_moisture', 'moisture']),
        pump: getPumpValue(reading),
        pumpStatus: getPumpValue(reading),
        raw: reading,
        temperature: getNumericValue(reading, ['temperature', 'temp']),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.date.getTime() - left.date.getTime());

  const monthEntries = filteredEntries.filter(
    (entry) =>
      entry.date.getMonth() + 1 === selectedMonth.month &&
      entry.date.getFullYear() === selectedMonth.year,
  );

  const entriesForChart = monthEntries.slice().sort((left, right) => left.date.getTime() - right.date.getTime());
  const groupedByDay = new Map();

  entriesForChart.forEach((entry) => {
    const day = entry.date.getDate();
    const currentGroup = groupedByDay.get(day) ?? { total: 0, count: 0 };
    if (typeof entry.moisture === 'number') {
      currentGroup.total += entry.moisture;
      currentGroup.count += 1;
    }
    groupedByDay.set(day, currentGroup);
  });

  const chartData = Array.from(groupedByDay.entries())
    .map(([day, group]) => ({
      day: String(day).padStart(2, '0'),
      value: group.count > 0 ? Math.round(group.total / group.count) : 0,
    }))
    .slice(-7);

   const pastEvents = monthEntries.slice(0, 3).map((entry) => {
    const airHumidityText = typeof entry.airHumidity === 'number' ? `${Math.round(entry.airHumidity)}%` : '-';
    const moistureText = typeof entry.moisture === 'number' ? `${Math.round(entry.moisture)}%` : '-';
    const pumpText = (() => {
      if (typeof entry.pump === 'number') {
        return entry.pump > 0 ? '1' : '0';
      }
      if (entry.pumpStatus != null) {
        const status = String(entry.pumpStatus).toLowerCase();
        if (status === 'on' || status === 'true' || status === '1') {
          return '1';
        }
        if (status === 'off' || status === 'false' || status === '0') {
          return '0';
        }
        return String(entry.pumpStatus);
      }
      return '-';
    })();
    const temperatureText = typeof entry.temperature === 'number' ? `${Math.round(entry.temperature)} C` : '-';
    const lightText = typeof entry.lightIntensity === 'number' ? `${Math.round(entry.lightIntensity)} lux` : '-';
    return {
      airHumidity: airHumidityText,
      date: formatDate(entry.date),
      id: entry.id,
      moisture: moistureText,
      pump: pumpText,
      temperature: temperatureText,
      time: formatTime(entry.date),
      water: lightText,
    };
  });

  const exportRows = monthEntries.map((entry) => ({
    kelembapanUdara: entry.airHumidity != null ? Math.round(entry.airHumidity) : '',
    cahayaLux: entry.lightIntensity != null ? Math.round(entry.lightIntensity) : '',
    kelembapanTanah: entry.moisture != null ? Math.round(entry.moisture) : '',
    pump: (() => {
      if (entry.pumpStatus != null) {
        const status = String(entry.pumpStatus).toLowerCase();
        if (status === 'on' || status === 'true' || status === '1') {
          return '1';
        }
        if (status === 'off' || status === 'false' || status === '0') {
          return '0';
        }
        return String(entry.pumpStatus);
      }
      if (typeof entry.pump === 'number') {
        return entry.pump > 0 ? '1' : '0';
      }
      return '';
    })(),
    pumpStatus: entry.pumpStatus ?? '',
    suhu: entry.temperature != null ? Math.round(entry.temperature) : '',
    tanggal: formatDate(entry.date),
    waktu: formatTime(entry.date),
    timestamp: entry.date.toISOString(),
  }));

  return {
    chartData,
    exportRows,
    latestReading: filteredEntries[0] ?? null,
    pastEvents,
    selectedMonth: {
      label: `${MONTH_LABELS[selectedMonth.month - 1]} ${selectedMonth.year}`,
    },
  };
}

function HistoricalChart({ chartData, selectedMonthLabel, onOpenMonthPicker }) {
  const maxValue = Math.max(...chartData.map((item) => item.value), 100);

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Historis Kelembapan Tanah</Text>
        <Pressable onPress={onOpenMonthPicker} style={({ pressed }) => [styles.monthFilter, pressed && styles.monthFilterPressed]}>
          <Text style={styles.monthLabel}>{selectedMonthLabel}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color="#111111" />
        </Pressable>
      </View>

      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          {[100, 75, 50, 25, 0].map((label) => (
            <Text key={label} style={styles.axisLabel}>{label}</Text>
          ))}
        </View>
        <View style={styles.plotArea}>
          {[0, 1, 2, 3, 4].map((line) => (
            <View key={line} style={[styles.gridLine, { top: line * 26 }]} />
          ))}
          <View style={styles.barRow}>
            {chartData.length > 0 ? (
              chartData.map((item) => (
                <View key={item.day} style={styles.barSlot}>
                  <View style={[styles.bar, { height: Math.max(8, (item.value / maxValue) * 104) }]} />
                  <Text style={styles.dayLabel}>{item.day}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyChartWrap}>
                <Text style={styles.emptyChartText}>Belum ada data IoT pada bulan ini.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

function PastEvents({ pastEvents }) {
  return (
    <Card style={styles.eventsCard}>
      <Text style={styles.cardTitle}>Riwayat Pembacaan IoT</Text>
      <View style={styles.eventsList}>
        {pastEvents.length > 0 ? (
          pastEvents.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <Text style={styles.eventText}>{event.date}: {event.time}, Tanah {event.moisture}, Udara {event.airHumidity}, Suhu {event.temperature}</Text>
              <View style={styles.eventMetaWrap}>
                <Text style={styles.eventWater}>{event.water}</Text>
                <Text style={styles.eventPump}>Pump {event.pump}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyEventsText}>Belum ada riwayat pembacaan IoT untuk periode ini.</Text>
        )}
      </View>
    </Card>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState(initialHistory);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const isRequestingRef = useRef(false);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  });

  const loadHistory = useCallback(async (mode = 'initial') => {
    if (isRequestingRef.current) {
      return;
    }

    isRequestingRef.current = true;

try {
       if (mode === 'refresh') {
         setIsRefreshing(true);
       } else if (mode === 'initial') {
         setIsLoading(true);
       }
       setErrorMessage(null);
       const payload = await fetchIotReadings();
       const readings = normalizeReadings(payload);
       const nextHistory = buildHistoryFromReadings(readings, selectedMonth);
       setHistory(nextHistory);
     } catch {
       setErrorMessage('Riwayat data IoT belum bisa dimuat.');
     } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useFocusEffect(
    useCallback(() => {
      loadHistory('poll');
    }, [loadHistory]),
  );

  useIotAutoRefresh(
    useCallback(() => {
      loadHistory('poll');
    }, [loadHistory]),
  );

  const handleSelectMonth = useCallback((month) => {
    setSelectedMonth((current) => ({
      ...current,
      month,
    }));
  }, []);

  const handleSelectYear = useCallback((year) => {
    setSelectedMonth((current) => ({
      ...current,
      year,
    }));
  }, []);

  const applyMonthFilter = useCallback(() => {
    setIsMonthPickerVisible(false);
  }, []);

  const handleDownloadData = useCallback(async () => {
    if (history.exportRows.length === 0) {
      Alert.alert('Data belum tersedia', 'Belum ada data IoT pada periode ini untuk diunduh.');
      return;
    }

    const fileName = `riwayat-iot-${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}.csv`;
    const csvHeader = ['timestamp', 'tanggal', 'waktu', 'kelembapan_tanah', 'kelembapan_udara', 'suhu', 'cahaya_lux', 'pump', 'pump_status'];
    const csvRows = history.exportRows.map((row) =>
      [
        row.timestamp,
        row.tanggal,
        row.waktu,
        row.kelembapanTanah,
        row.kelembapanUdara,
        row.suhu,
        row.cahayaLux,
        row.pump,
        row.pumpStatus,
      ]
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const csvContent = [csvHeader.join(','), ...csvRows].join('\n');

    try {
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          Alert.alert('Unduhan dibatalkan', 'Folder penyimpanan belum dipilih.');
          return;
        }

        const directoryUri = permissions.directoryUri;
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(directoryUri, fileName.replace(/\.csv$/i, ''), 'text/csv');
        await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, csvContent);

        Alert.alert('Unduhan berhasil', `File CSV disimpan ke folder yang dipilih dengan nama ${fileName}.`);
        return;
      }

      const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!baseDirectory) {
        throw new Error('Direktori penyimpanan tidak tersedia.');
      }

      const fileUri = `${baseDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      Alert.alert('Unduhan berhasil', `File CSV disimpan di:\n${fileUri}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File CSV belum bisa dibuat.';
      Alert.alert('Unduhan gagal', message);
    }
  }, [history.exportRows, selectedMonth.month, selectedMonth.year]);

  const selectedMonthLabel = history.selectedMonth?.label ?? `${MONTH_LABELS[selectedMonth.month - 1]} ${selectedMonth.year}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" onPress={() => router.back()} />
        <Text style={styles.topTitle}>Riwayat</Text>
        <Pressable onPress={handleDownloadData} style={({ pressed }) => [styles.downloadButton, pressed && styles.downloadButtonPressed]}>
          <MaterialCommunityIcons name="download" size={18} color="#ffffff" />
          <Text style={styles.downloadButtonText}>Unduh</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadHistory('refresh')} />}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#3c6255" />
            <Text style={styles.stateText}>Memuat riwayat data IoT...</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : null}

        {history.latestReading ? (
          <Card>
            <Text style={styles.lastCycleTitle}>Pembacaan Terakhir: <Text style={styles.boldText}>{formatDate(history.latestReading.date)}</Text></Text>
            <Text style={styles.lastCycleText}>Pukul {formatTime(history.latestReading.date)}</Text>
            <Text style={styles.lastCycleText}>
              Kelembapan Tanah {history.latestReading.moisture != null ? `${Math.round(history.latestReading.moisture)}%` : '-'},
              {' '}Suhu {history.latestReading.temperature != null ? `${Math.round(history.latestReading.temperature)} C` : '-'}
            </Text>
            <Text style={styles.lastCycleText}>
              Kelembapan Udara {history.latestReading.airHumidity != null ? `${Math.round(history.latestReading.airHumidity)}%` : '-'},
              {' '}Pump {history.latestReading.pump != null ? String(history.latestReading.pump) : history.latestReading.pumpStatus != null ? (() => {
                const status = String(history.latestReading.pumpStatus).toLowerCase();
                if (status === 'on' || status === 'true' || status === '1') return '1';
                if (status === 'off' || status === 'false' || status === '0') return '0';
                return String(history.latestReading.pumpStatus);
              })() : '-'}
            </Text>
            <Text style={styles.lastCycleText}>
              Cahaya {history.latestReading.lightIntensity != null ? `${Math.round(history.latestReading.lightIntensity)} lux` : '-'}
            </Text>
          </Card>
        ) : null}

        <HistoricalChart
          chartData={history.chartData}
          onOpenMonthPicker={() => setIsMonthPickerVisible(true)}
          selectedMonthLabel={selectedMonthLabel}
        />
        <PastEvents pastEvents={history.pastEvents} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isMonthPickerVisible}
        onRequestClose={() => setIsMonthPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsMonthPickerVisible(false)}>
          <Pressable style={styles.monthModalCard} onPress={() => null}>
            <Text style={styles.monthModalTitle}>Pilih Bulan dan Tahun</Text>
            <View style={styles.yearOptions}>
              {YEAR_OPTIONS.map((year) => {
                const isActive = selectedMonth.year === year;

                return (
                  <Pressable
                    key={year}
                    onPress={() => handleSelectYear(year)}
                    style={({ pressed }) => [
                      styles.yearOption,
                      isActive && styles.yearOptionActive,
                      pressed && styles.monthOptionPressed,
                    ]}>
                    <Text style={[styles.yearOptionText, isActive && styles.monthOptionTextActive]}>
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.monthOptions}>
              {MONTH_LABELS.map((label, index) => {
                const monthNumber = index + 1;
                const isActive = selectedMonth.month === monthNumber;

                return (
                  <Pressable
                    key={label}
                    onPress={() => handleSelectMonth(monthNumber)}
                    style={({ pressed }) => [
                      styles.monthOption,
                      isActive && styles.monthOptionActive,
                      pressed && styles.monthOptionPressed,
                    ]}>
                    <Text style={[styles.monthOptionText, isActive && styles.monthOptionTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={applyMonthFilter} style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}>
              <Text style={styles.applyButtonText}>Terapkan</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: globalStyles.colors.backgroundLight,
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    flexDirection: 'row',
    gap: 12,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  topTitle: {
    color: '#ffffff',
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  downloadButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  downloadButtonPressed: {
    opacity: 0.82,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    gap: 10,
    padding: 8,
    paddingBottom: 24,
  },
  stateBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  stateText: {
    color: '#5b655f',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
  },
  lastCycleTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
  },
  lastCycleText: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 22,
  },
  monthFilter: {
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  monthFilterPressed: {
    opacity: 0.85,
  },
  monthLabel: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 64,
    textAlign: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    height: 156,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingRight: 6,
    width: 26,
  },
  axisLabel: {
    color: '#444444',
    fontSize: 10,
    textAlign: 'right',
  },
  plotArea: {
    flex: 1,
    paddingHorizontal: 8,
    position: 'relative',
  },
  gridLine: {
    backgroundColor: '#E9E9E9',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  barRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    height: 136,
    justifyContent: 'space-between',
    paddingTop: 1,
  },
  barSlot: {
    alignItems: 'center',
    flex: 1,
    height: 136,
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: '#58A05C',
    borderRadius: 2,
    width: 19,
  },
  dayLabel: {
    color: '#444444',
    fontSize: 10,
    marginTop: 5,
  },
  eventsCard: {
    paddingBottom: 2,
  },
  eventsList: {
    marginTop: 8,
  },
  eventRow: {
    borderBottomColor: '#D8D8D8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  eventText: {
    color: '#111111',
    flex: 1,
    fontSize: 14,
  },
  eventWater: {
    color: '#111111',
    fontSize: 14,
    textAlign: 'right',
  },
  eventMetaWrap: {
    alignItems: 'flex-end',
    gap: 2,
    justifyContent: 'center',
  },
  eventPump: {
    color: '#5b655f',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyChartWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyChartText: {
    color: '#5b655f',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyEventsText: {
    color: '#5b655f',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  monthModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  monthModalTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  monthOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  yearOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  monthOption: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    minWidth: '22%',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  monthOptionActive: {
    backgroundColor: globalStyles.colors.primaryGreen,
  },
  monthOptionPressed: {
    opacity: 0.86,
  },
  monthOptionText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
  },
  monthOptionTextActive: {
    color: '#ffffff',
  },
  yearOption: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  yearOptionActive: {
    backgroundColor: globalStyles.colors.primaryGreen,
  },
  yearOptionText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 10,
    marginTop: 16,
    paddingVertical: 12,
  },
  applyButtonPressed: {
    opacity: 0.88,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
