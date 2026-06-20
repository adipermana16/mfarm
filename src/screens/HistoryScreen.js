import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIotAutoRefresh } from '@/src/hooks/useIotAutoRefresh';
import { fetchHistory, fetchIotReadings } from '@/src/services/api';
import { mergeIotReadings, readCachedIotReadings, saveIotReadingsToCache } from '@/src/services/iotHistoryCache';
import { globalStyles } from '@/src/styles/globalStyles';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const YEAR_WINDOW = 5;
const DOWNLOAD_STATE_FILE_NAME = 'history-download-state.json';
const initialHistory = {
  chartData: [],
  exportRows: [],
  hasDownloadedFilter: false,
  lastDownloadedAt: null,
  latestReading: null,
  pastEvents: [],
  selectedDate: null,
};
const initialDateOptions = {
  dates: [],
  days: [],
  months: [],
  years: [],
};
const HISTORY_MODES = {
  ALL: 'all',
  DATE: 'date',
};
const DATE_KEYS = [
  'timestamp',
  'recordedAt',
  'recorded_at',
  'createdAt',
  'updatedAt',
  'date',
  'created_at',
  'updated_at',
  'tanggal',
  'waktuTanggal',
  'datetime',
  'dateTime',
];
const TIME_KEYS = ['waktu', 'jam', 'time'];
const MONTH_NAME_TO_NUMBER = {
  ags: 8,
  agu: 8,
  agustus: 8,
  apr: 4,
  april: 4,
  aug: 8,
  august: 8,
  dec: 12,
  december: 12,
  des: 12,
  desember: 12,
  feb: 2,
  februari: 2,
  february: 2,
  jan: 1,
  januari: 1,
  january: 1,
  jul: 7,
  juli: 7,
  july: 7,
  jun: 6,
  juni: 6,
  june: 6,
  mar: 3,
  maret: 3,
  march: 3,
  may: 5,
  mei: 5,
  nov: 11,
  november: 11,
  oct: 10,
  october: 10,
  okt: 10,
  oktober: 10,
  sep: 9,
  september: 9,
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

  return [];
}

function normalizeTimeParts(timeText) {
  if (timeText == null) {
    return [0, 0, 0];
  }

  const match = String(timeText).trim().match(/^(\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?/);

  if (!match) {
    return [0, 0, 0];
  }

  return [
    Number(match[1]) || 0,
    Number(match[2]) || 0,
    Number(match[3]) || 0,
  ];
}

function parseLocalDateParts(day, month, year, timeText = null) {
  const parsedDay = Number(day);
  const parsedMonth = Number(month);
  const parsedYear = Number(year);

  if (!parsedDay || !parsedMonth || !parsedYear) {
    return null;
  }

  const [hours, minutes, seconds] = normalizeTimeParts(timeText);
  const date = new Date(parsedYear, parsedMonth - 1, parsedDay, hours, minutes, seconds);

  if (
    date.getFullYear() !== parsedYear ||
    date.getMonth() + 1 !== parsedMonth ||
    date.getDate() !== parsedDay
  ) {
    return null;
  }

  return date;
}

function parseReadingDateValue(value, timeValue = null) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const epochMs = value < 100000000000 ? value * 1000 : value;
    const date = new Date(epochMs);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  if (/^\d+$/.test(text)) {
    return parseReadingDateValue(Number(text), timeValue);
  }

  const slashOrDashDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T,]+(.+))?$/);
  if (slashOrDashDate) {
    return parseLocalDateParts(slashOrDashDate[1], slashOrDashDate[2], slashOrDashDate[3], slashOrDashDate[4] ?? timeValue);
  }

  const yearFirstDate = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[ T,]+(.+))?$/);
  if (yearFirstDate && !text.includes('T') && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)) {
    return parseLocalDateParts(yearFirstDate[3], yearFirstDate[2], yearFirstDate[1], yearFirstDate[4] ?? timeValue);
  }

  const namedMonthDate = text
    .toLowerCase()
    .replace(/\./g, '')
    .match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})(?:[,\s]+(.+))?$/);
  if (namedMonthDate) {
    const month = MONTH_NAME_TO_NUMBER[namedMonthDate[2]];
    if (month) {
      return parseLocalDateParts(namedMonthDate[1], month, namedMonthDate[3], namedMonthDate[4] ?? timeValue);
    }
  }

  const parsedDate = new Date(timeValue ? `${text} ${timeValue}` : text);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

async function fetchMonthHistoryReadings(selectedDate) {
  const daysInMonth = getDaysInMonth(selectedDate.year, selectedDate.month);
  const dailyResults = await Promise.allSettled(
    Array.from({ length: daysInMonth }, (_, index) =>
      fetchHistory({
        day: index + 1,
        month: selectedDate.month,
        year: selectedDate.year,
      }),
    ),
  );

  return dailyResults.flatMap((result) => (
    result.status === 'fulfilled' ? normalizeReadings(result.value) : []
  ));
}

async function fetchAllHistoryReadings(selectedDate, includeMonthHistory = true) {
  const cachedReadings = await readCachedIotReadings();
  const [iotReadingsResult, historyResult, monthHistoryResult] = await Promise.allSettled([
    fetchIotReadings(),
    fetchHistory(),
    includeMonthHistory ? fetchMonthHistoryReadings(selectedDate) : Promise.resolve([]),
  ]);

  const iotReadings = iotReadingsResult.status === 'fulfilled'
    ? normalizeReadings(iotReadingsResult.value)
    : [];
  const historyReadings = historyResult.status === 'fulfilled'
    ? normalizeReadings(historyResult.value)
    : [];
  const monthHistoryReadings = monthHistoryResult.status === 'fulfilled'
    ? monthHistoryResult.value
    : [];

  if (
    iotReadingsResult.status === 'rejected' &&
    historyResult.status === 'rejected' &&
    monthHistoryResult.status === 'rejected' &&
    cachedReadings.length === 0
  ) {
    throw iotReadingsResult.reason ?? historyResult.reason;
  }

  const mergedReadings = mergeIotReadings(cachedReadings, historyReadings, monthHistoryReadings, iotReadings);
  return saveIotReadingsToCache(mergedReadings);
}

function getReadingTimestamp(reading) {
  const dateValue = findValueByKeys(reading, DATE_KEYS);
  const timeValue = findValueByKeys(reading, TIME_KEYS);
  return dateValue ?? timeValue ?? null;
}

function getReadingDate(reading) {
  const dateValue = findValueByKeys(reading, DATE_KEYS);
  const timeValue = findValueByKeys(reading, TIME_KEYS);
  return parseReadingDateValue(dateValue ?? timeValue, dateValue ? timeValue : null);
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

function getDownloadStateFileUri() {
  const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  return baseDirectory ? `${baseDirectory}${DOWNLOAD_STATE_FILE_NAME}` : null;
}

function getSelectedDateKey(selectedDate) {
  return [
    selectedDate.year,
    String(selectedDate.month).padStart(2, '0'),
    String(selectedDate.day).padStart(2, '0'),
  ].join('-');
}

function getDateLabel(selectedDate) {
  return `${String(selectedDate.day).padStart(2, '0')} ${MONTH_LABELS[selectedDate.month - 1]} ${selectedDate.year}`;
}

function isSameSelectedDate(date, selectedDate) {
  return (
    date.getDate() === selectedDate.day &&
    date.getMonth() + 1 === selectedDate.month &&
    date.getFullYear() === selectedDate.year
  );
}

function buildReadingEntries(readings) {
  return readings
    .map((reading, index) => {
      const timestamp = getReadingTimestamp(reading);
      const date = getReadingDate(reading);

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
}

function buildDateOptions(entries, selectedDate) {
  const dates = entries.map((entry) => ({
    day: entry.date.getDate(),
    key: getSelectedDateKey({
      day: entry.date.getDate(),
      month: entry.date.getMonth() + 1,
      year: entry.date.getFullYear(),
    }),
    month: entry.date.getMonth() + 1,
    year: entry.date.getFullYear(),
  }));
  const uniqueDates = Array.from(new Map(dates.map((date) => [date.key, date])).values())
    .sort((left, right) => right.key.localeCompare(left.key));
  return buildDateOptionsFromDates(uniqueDates, selectedDate);
}

function buildDateOptionsFromDates(uniqueDates, selectedDate) {
  const currentYear = new Date().getFullYear();
  const rangeYears = Array.from({ length: YEAR_WINDOW * 2 + 1 }, (_, index) => currentYear - YEAR_WINDOW + index);
  const years = Array.from(
    new Set([
      ...rangeYears,
      ...uniqueDates.map((date) => date.year),
      selectedDate.year,
    ]),
  ).sort((left, right) => right - left);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const days = Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.month) }, (_, index) => index + 1);

  return {
    dates: uniqueDates,
    days,
    months,
    years,
  };
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function clampSelectedDate(selectedDate) {
  return {
    ...selectedDate,
    day: Math.min(selectedDate.day, getDaysInMonth(selectedDate.year, selectedDate.month)),
  };
}

async function readDownloadState() {
  const fileUri = getDownloadStateFileUri();

  if (!fileUri) {
    return {};
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      return {};
    }

    const content = await FileSystem.readAsStringAsync(fileUri);
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeDownloadState(nextState) {
  const fileUri = getDownloadStateFileUri();

  if (!fileUri) {
    throw new Error('Direktori penyimpanan aplikasi tidak tersedia.');
  }

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(nextState));
}

function buildHistoryFromEntries(filteredEntries, selectedDate, historyMode = HISTORY_MODES.ALL) {
  const dateEntries = filteredEntries.filter((entry) => isSameSelectedDate(entry.date, selectedDate));
  const visibleDateEntries = historyMode === HISTORY_MODES.ALL ? filteredEntries : dateEntries;

  const entriesForChart = visibleDateEntries.slice().sort((left, right) => left.date.getTime() - right.date.getTime());
  const groupedEntries = new Map();

  entriesForChart.forEach((entry) => {
    const key = historyMode === HISTORY_MODES.ALL ? formatDate(entry.date) : formatTime(entry.date);
    const currentGroup = groupedEntries.get(key) ?? { total: 0, count: 0 };
    if (typeof entry.moisture === 'number') {
      currentGroup.total += entry.moisture;
      currentGroup.count += 1;
    }
    groupedEntries.set(key, currentGroup);
  });

  const chartData = Array.from(groupedEntries.entries())
    .map(([label, group]) => ({
      day: label,
      value: group.count > 0 ? Math.round(group.total / group.count) : 0,
    }))
    .slice(-7);

  const pastEvents = visibleDateEntries.map((entry) => {
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

  const exportRows = visibleDateEntries.map((entry) => ({
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
    timestamp: entry.date.toISOString(),
  }));

  return {
    chartData,
    exportRows,
    hasDownloadedFilter: false,
    lastDownloadedAt: null,
    latestReading: filteredEntries[0] ?? null,
    pastEvents,
    selectedDate: {
      label: getDateLabel(selectedDate),
    },
  };
}

function HistoricalChart({ chartData, selectedDateLabel, onOpenDatePicker }) {
  const maxValue = Math.max(...chartData.map((item) => item.value), 100);

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Historis Kelembapan Tanah</Text>
        <Pressable onPress={onOpenDatePicker} style={({ pressed }) => [styles.monthFilter, pressed && styles.monthFilterPressed]}>
          <Text style={styles.monthLabel}>{selectedDateLabel}</Text>
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
                <Text style={styles.emptyChartText}>Belum ada data IoT.</Text>
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
  const [availableDateOptions, setAvailableDateOptions] = useState(initialDateOptions);
  const [historyMode, setHistoryMode] = useState(HISTORY_MODES.ALL);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return {
      day: now.getDate(),
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
      const nextSelectedDate = clampSelectedDate(selectedDate);
      const readings = await fetchAllHistoryReadings(nextSelectedDate, mode !== 'poll');
      const entries = buildReadingEntries(readings);
      const nextDateOptions = buildDateOptions(entries, nextSelectedDate);
      setAvailableDateOptions(nextDateOptions);
      if (getSelectedDateKey(nextSelectedDate) !== getSelectedDateKey(selectedDate)) {
        setSelectedDate(nextSelectedDate);
      }
      const nextHistory = buildHistoryFromEntries(
        entries,
        nextSelectedDate,
        historyMode,
      );
      setHistory(nextHistory);
    } catch {
      setErrorMessage('Riwayat data IoT belum bisa dimuat.');
    } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [historyMode, selectedDate]);

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

  const handleSelectDay = useCallback((day) => {
    setSelectedDate((current) => ({
      ...current,
      day,
    }));
  }, []);

  const handleSelectMonth = useCallback((month) => {
    setSelectedDate((current) => clampSelectedDate({
      ...current,
      month,
    }));
  }, []);

  const handleSelectYear = useCallback((year) => {
    setSelectedDate((current) => clampSelectedDate({
      ...current,
      year,
    }));
  }, []);

  const applyMonthFilter = useCallback(() => {
    setHistoryMode(HISTORY_MODES.DATE);
    setIsMonthPickerVisible(false);
  }, []);

  const showAllHistory = useCallback(() => {
    setHistoryMode(HISTORY_MODES.ALL);
  }, []);

  const handleDownloadData = useCallback(async () => {
    if (history.exportRows.length === 0) {
      Alert.alert('Data belum tersedia', 'Belum ada data IoT pada periode ini untuk diunduh.');
      return;
    }

    const fileName = historyMode === HISTORY_MODES.ALL
      ? 'riwayat-iot-semua.csv'
      : `riwayat-iot-${getSelectedDateKey(selectedDate)}.csv`;
    const csvHeader = ['timestamp', 'kelembapan_tanah', 'kelembapan_udara', 'suhu', 'cahaya_lux', 'pump', 'pump_status'];
    const csvRows = history.exportRows.map((row) =>
      [
        row.timestamp,
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
  }, [history.exportRows, historyMode, selectedDate]);

  const handleResetDownloadedData = useCallback(() => {
    Alert.alert(
      'Hapus reset unduhan?',
      `Data ${getDateLabel(selectedDate)} akan ditampilkan lagi dari awal.`,
      [
        {
          style: 'cancel',
          text: 'Batal',
        },
        {
          text: 'Tampilkan Lagi',
          onPress: async () => {
            try {
              const downloadState = await readDownloadState();
              delete downloadState[getSelectedDateKey(selectedDate)];
              await writeDownloadState(downloadState);
              await loadHistory('poll');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Data belum bisa ditampilkan ulang.';
              Alert.alert('Reset gagal', message);
            }
          },
        },
      ],
    );
  }, [loadHistory, selectedDate]);

  const selectedDateLabel = historyMode === HISTORY_MODES.ALL
    ? 'Semua Data'
    : history.selectedDate?.label ?? getDateLabel(selectedDate);
  const currentDateOptions = buildDateOptionsFromDates(availableDateOptions.dates, selectedDate);

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

        <View style={styles.historyModeRow}>
          <Pressable
            onPress={showAllHistory}
            style={({ pressed }) => [
              styles.historyModeButton,
              historyMode === HISTORY_MODES.ALL && styles.historyModeButtonActive,
              pressed && styles.monthOptionPressed,
            ]}>
            <Text style={[styles.historyModeText, historyMode === HISTORY_MODES.ALL && styles.historyModeTextActive]}>
              Semua
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsMonthPickerVisible(true)}
            style={({ pressed }) => [
              styles.historyModeButton,
              historyMode === HISTORY_MODES.DATE && styles.historyModeButtonActive,
              pressed && styles.monthOptionPressed,
            ]}>
            <Text style={[styles.historyModeText, historyMode === HISTORY_MODES.DATE && styles.historyModeTextActive]}>
              {getDateLabel(selectedDate)}
            </Text>
          </Pressable>
        </View>

        <HistoricalChart
          chartData={history.chartData}
          onOpenDatePicker={() => setIsMonthPickerVisible(true)}
          selectedDateLabel={selectedDateLabel}
        />
        {history.hasDownloadedFilter ? (
          <Card style={styles.downloadInfoCard}>
            <Text style={styles.downloadInfoText}>
              Data yang tampil saat ini hanya data baru setelah unduhan terakhir
              {history.lastDownloadedAt ? ` pada ${formatDate(history.lastDownloadedAt)} ${formatTime(history.lastDownloadedAt)}` : ''}.
            </Text>
            <Pressable onPress={handleResetDownloadedData} style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}>
              <MaterialCommunityIcons name="delete" size={18} color="#8b1e1e" />
              <Text style={styles.resetButtonText}>Hapus reset unduhan</Text>
            </Pressable>
          </Card>
        ) : null}
        <PastEvents pastEvents={history.pastEvents} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isMonthPickerVisible}
        onRequestClose={() => setIsMonthPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsMonthPickerVisible(false)}>
          <Pressable style={styles.monthModalCard} onPress={() => null}>
            <Text style={styles.monthModalTitle}>Pilih Hari, Bulan, dan Tahun</Text>
            <View style={styles.yearStepper}>
              <Pressable
                onPress={() => handleSelectYear(selectedDate.year - 1)}
                style={({ pressed }) => [styles.yearStepButton, pressed && styles.monthOptionPressed]}>
                <MaterialCommunityIcons name="chevron-left" size={20} color="#111111" />
              </Pressable>
              <Text style={styles.yearStepperText}>{selectedDate.year}</Text>
              <Pressable
                onPress={() => handleSelectYear(selectedDate.year + 1)}
                style={({ pressed }) => [styles.yearStepButton, pressed && styles.monthOptionPressed]}>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#111111" />
              </Pressable>
            </View>
            <View style={styles.yearOptions}>
              {currentDateOptions.years.map((year) => {
                const isActive = selectedDate.year === year;

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
              {currentDateOptions.months.map((monthNumber) => {
                const isActive = selectedDate.month === monthNumber;

                return (
                  <Pressable
                    key={monthNumber}
                    onPress={() => handleSelectMonth(monthNumber)}
                    style={({ pressed }) => [
                      styles.monthOption,
                      isActive && styles.monthOptionActive,
                      pressed && styles.monthOptionPressed,
                    ]}>
                    <Text style={[styles.monthOptionText, isActive && styles.monthOptionTextActive]}>
                      {MONTH_LABELS[monthNumber - 1]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.dayOptions}>
              {currentDateOptions.days.map((day) => {
                const isActive = selectedDate.day === day;

                return (
                  <Pressable
                    key={day}
                    onPress={() => handleSelectDay(day)}
                    style={({ pressed }) => [
                      styles.dayOption,
                      isActive && styles.monthOptionActive,
                      pressed && styles.monthOptionPressed,
                    ]}>
                    <Text style={[styles.monthOptionText, isActive && styles.monthOptionTextActive]}>
                      {String(day).padStart(2, '0')}
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
  resetButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fdeaea',
    borderColor: '#efcaca',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resetButtonPressed: {
    opacity: 0.85,
  },
  resetButtonText: {
    color: '#8b1e1e',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    gap: 10,
    padding: 8,
    paddingBottom: 24,
  },
  downloadInfoCard: {
    gap: 10,
  },
  downloadInfoText: {
    color: '#5b655f',
    fontSize: 13,
    lineHeight: 20,
  },
  historyModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  historyModeButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d7ddd9',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 10,
  },
  historyModeButtonActive: {
    backgroundColor: globalStyles.colors.primaryGreen,
    borderColor: globalStyles.colors.primaryGreen,
  },
  historyModeText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  historyModeTextActive: {
    color: '#ffffff',
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
  dayOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  yearOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  yearStepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 12,
  },
  yearStepButton: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 44,
  },
  yearStepperText: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'center',
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
  dayOption: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
