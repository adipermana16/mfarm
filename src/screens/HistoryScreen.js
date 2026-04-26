import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchHistory } from '@/src/services/api';
import { globalStyles } from '@/src/styles/globalStyles';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);
const initialHistory = {
  chartData: [],
  lastCycle: null,
  pastEvents: [],
  selectedMonth: null,
};

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function HistoricalChart({ chartData, selectedMonthLabel, onOpenMonthPicker }) {
  const maxValue = Math.max(...chartData.map((item) => item.value), 400);

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Data Historis Siklus Penyiraman</Text>
        <Pressable onPress={onOpenMonthPicker} style={({ pressed }) => [styles.monthFilter, pressed && styles.monthFilterPressed]}>
          <Text style={styles.monthLabel}>{selectedMonthLabel}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color="#111111" />
        </Pressable>
      </View>

      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          {[400, 300, 200, 100, 0].map((label) => (
            <Text key={label} style={styles.axisLabel}>{label}</Text>
          ))}
        </View>
        <View style={styles.plotArea}>
          {[0, 1, 2, 3, 4].map((line) => (
            <View key={line} style={[styles.gridLine, { top: line * 26 }]} />
          ))}
          <View style={styles.barRow}>
            {chartData.map((item) => (
              <View key={item.day} style={styles.barSlot}>
                <View style={[styles.bar, { height: Math.max(8, (item.value / maxValue) * 104) }]} />
                <Text style={styles.dayLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}

function PastEvents({ pastEvents }) {
  return (
    <Card style={styles.eventsCard}>
      <Text style={styles.cardTitle}>Riwayat Kejadian</Text>
      <View style={styles.eventsList}>
        {pastEvents.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <Text style={styles.eventText}>{event.date}: {event.time}, {event.zone}, {event.duration}</Text>
            <Text style={styles.eventWater}>{event.water}</Text>
          </View>
        ))}
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
      const data = await fetchHistory(selectedMonth);
      setHistory(data);
    } catch {
      setErrorMessage('Riwayat belum bisa dimuat.');
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

      const intervalId = setInterval(() => {
        loadHistory('poll');
      }, 5000);

      const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          loadHistory('poll');
        }
      });

      return () => {
        clearInterval(intervalId);
        appStateSubscription.remove();
      };
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

  const selectedMonthLabel = history.selectedMonth?.label ?? `${MONTH_LABELS[selectedMonth.month - 1]} ${selectedMonth.year}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" onPress={() => router.back()} />
        <Text style={styles.topTitle}>Riwayat</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadHistory('refresh')} />}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#3c6255" />
            <Text style={styles.stateText}>Memuat riwayat...</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : null}

        {history.lastCycle ? (
          <Card>
            <Text style={styles.lastCycleTitle}>Siklus Terakhir: <Text style={styles.boldText}>{history.lastCycle.date}</Text></Text>
            <Text style={styles.lastCycleText}>{history.lastCycle.zone}</Text>
            <Text style={styles.lastCycleText}>{history.lastCycle.duration}, {history.lastCycle.water}</Text>
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
