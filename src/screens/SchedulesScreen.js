import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScheduleCard from '@/src/components/ScheduleCard';
import { globalStyles } from '@/src/styles/globalStyles';

const fallbackSchedules = [
  {
    id: 'schedule-a',
    name: 'Siram Pagi',
    zoneName: 'Zona A',
    fieldName: 'Lahan Tomat',
    time: '06:00',
    duration: '15 menit',
    days: 'Sen, Rab, Jum',
    isEnabled: true,
  },
  {
    id: 'schedule-b',
    name: 'Siram Sore',
    zoneName: 'Zona B',
    fieldName: 'Lahan Cabai',
    time: '17:30',
    duration: '20 menit',
    days: 'Setiap hari',
    isEnabled: true,
  },
  {
    id: 'schedule-c',
    name: 'Kabut Siang',
    zoneName: 'Zona C',
    fieldName: 'Lahan Selada',
    time: '09:15',
    duration: '10 menit',
    days: 'Sel, Kam, Sab',
    isEnabled: false,
  },
];

async function fetchSchedules() {
  // Ganti fungsi ini dengan query database/API saat backend sudah tersedia.
  return new Promise((resolve) => {
    setTimeout(() => resolve(fallbackSchedules), 400);
  });
}

async function updateScheduleStatus(scheduleId, isEnabled) {
  // Ganti fungsi ini dengan request PATCH/PUT ke API saat backend tersedia.
  return new Promise((resolve) => {
    setTimeout(() => resolve({ scheduleId, isEnabled }), 250);
  });
}

export default function SchedulesScreen() {
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadSchedules = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);
      const data = await fetchSchedules();
      setSchedules(data);
    } catch {
      setErrorMessage('Jadwal belum bisa dimuat.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const openAddSchedule = () => {
    router.push('/add-schedule');
  };

  const handleToggleSchedule = async (scheduleId, isEnabled) => {
    await updateScheduleStatus(scheduleId, isEnabled);
    setSchedules((currentSchedules) =>
      currentSchedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, isEnabled } : schedule,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={schedules}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#3c6255" />
              <Text style={styles.stateText}>Memuat jadwal...</Text>
            </View>
          ) : (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>{errorMessage ?? 'Belum ada jadwal.'}</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleBar}>
              <View style={styles.titleLeft}>
                <MaterialCommunityIcons name="leaf" size={24} color={globalStyles.colors.primaryGreen} />
                <Text style={styles.screenTitle}>Jadwal</Text>
              </View>
            </View>
            <View style={styles.tabBar}>
              <Pressable style={[styles.tabButton, styles.activeTab]}>
                <Text style={[styles.tabText, styles.activeTabText]}>Jadwal</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/history')} style={styles.tabButton}>
                <Text style={styles.tabText}>Riwayat</Text>
              </Pressable>
            </View>
          </View>
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadSchedules(true)} />}
        renderItem={({ item }) => (
          <ScheduleCard onToggleChange={handleToggleSchedule} schedule={item} />
        )}
        showsVerticalScrollIndicator={false}
      />

      <Pressable accessibilityRole="button" onPress={openAddSchedule} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
        <Text style={styles.fabText}>Tambah Jadwal Baru</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: globalStyles.colors.backgroundLight,
    flex: 1,
  },
  content: {
    gap: 14,
    paddingBottom: 118,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    gap: 14,
    marginBottom: 2,
  },
  titleBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
  },
  titleLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  screenTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0,
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderBottomColor: '#D7D7D7',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  activeTab: {
    borderBottomColor: globalStyles.colors.primaryGreen,
    borderBottomWidth: 2,
  },
  tabText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '400',
  },
  activeTabText: {
    color: globalStyles.colors.primaryGreen,
    fontWeight: '600',
  },
  stateBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 50,
  },
  stateText: {
    color: '#5b655f',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 24,
    bottom: 28,
    elevation: 5,
    flexDirection: 'row',
    gap: 9,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    left: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 14,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fabPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});
