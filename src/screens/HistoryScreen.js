import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchHistory } from '@/src/services/api';
import { globalStyles } from '@/src/styles/globalStyles';

const initialHistory = {
  chartData: [],
  lastCycle: null,
  pastEvents: [],
};

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function HistoricalChart({ chartData }) {
  const maxValue = 400;

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Data Historis</Text>
        <View style={styles.segmented}>
          <Text style={[styles.segmentText, styles.segmentActive]}>Terakhir</Text>
          <Text style={styles.segmentText}>atau Bulan</Text>
        </View>
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

  const loadHistory = useCallback(async (mode = 'initial') => {
    try {
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else if (mode === 'initial') {
        setIsLoading(true);
      }
      setErrorMessage(null);
      const data = await fetchHistory();
      setHistory(data);
    } catch {
      setErrorMessage('Riwayat belum bisa dimuat.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadHistory('poll');
    }, 20000);

    return () => clearInterval(intervalId);
  }, [loadHistory]);

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

        <HistoricalChart chartData={history.chartData} />
        <PastEvents pastEvents={history.pastEvents} />
      </ScrollView>
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
  segmented: {
    backgroundColor: '#D9D9D9',
    borderRadius: 4,
    flexDirection: 'row',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  segmentText: {
    color: '#111111',
    fontSize: 12,
    marginHorizontal: 2,
  },
  segmentActive: {
    fontWeight: '700',
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
    height: 136,
    justifyContent: 'space-around',
    paddingTop: 1,
  },
  barSlot: {
    alignItems: 'center',
    height: 136,
    justifyContent: 'flex-end',
    width: 22,
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
});
