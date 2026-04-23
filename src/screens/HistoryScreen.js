import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { globalStyles } from '@/src/styles/globalStyles';

const chartData = [
  { day: 'Sen', value: 220 },
  { day: 'Sel', value: 160 },
  { day: 'Rab', value: 290 },
  { day: 'Kam', value: 170 },
  { day: 'Jum', value: 250 },
  { day: 'Sab', value: 335 },
  { day: 'Min', value: 80 },
];

const pastEvents = [
  { id: 'event-1', date: '19 Okt', time: '07:00', zone: 'Zona A', duration: '30 menit', water: '510 L' },
  { id: 'event-2', date: '18 Okt', time: '07:00', zone: 'Zona A', duration: '30 menit', water: '510 L' },
  { id: 'event-3', date: '17 Okt', time: '07:00', zone: 'Zona A', duration: '30 menit', water: '510 L' },
];

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function HistoricalChart() {
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

function PastEvents() {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" onPress={() => router.back()} />
        <Text style={styles.topTitle}>Riwayat</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.lastCycleTitle}>Siklus Terakhir: <Text style={styles.boldText}>20 Okt 2023</Text></Text>
          <Text style={styles.lastCycleText}>Zona A - Lahan Tomat</Text>
          <Text style={styles.lastCycleText}>30 menit, 500 liter</Text>
        </Card>

        <HistoricalChart />
        <PastEvents />
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
