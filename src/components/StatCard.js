import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { globalStyles } from '@/src/styles/globalStyles';

const defaultItems = [
  {
    icon: 'water-percent',
    label: 'Rata-rata Kelembapan Tanah',
    status: 'Optimal',
    value: '68%',
    color: globalStyles.colors.primaryBlue,
  },
  {
    icon: 'valve',
    label: 'Katup Aktif',
    value: '4 katup',
    color: globalStyles.colors.primaryGreen,
  },
  {
    icon: 'thermometer',
    label: 'Suhu Rata-rata',
    value: '29 C',
    color: globalStyles.colors.warningOrange,
  },
  {
    icon: 'white-balance-sunny',
    label: 'Intensitas Cahaya',
    value: '840 lux',
    color: '#f59e0b',
  },
];

const moistureStatusColors = {
  Kritis: '#b91c1c',
  Offline: '#64748b',
  Optimal: globalStyles.colors.primaryGreen,
  Peringatan: '#c2410c',
};

function parsePercentage(value) {
  const parsedValue = Number.parseFloat(String(value));

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(0, Math.min(parsedValue, 100));
}

export default function StatCard({ items = defaultItems, isOnline = true }) {
  const moisture = items.find((item) => item.label === 'Rata-rata Kelembapan Tanah') ?? defaultItems[0];
  const valves = items.find((item) => item.label === 'Katup Aktif') ?? defaultItems[1];
  const temperature =
    items.find((item) => item.label === 'Suhu Rata-rata' || item.label === 'Cuaca Lokal') ?? defaultItems[2];
  const light = items.find((item) => item.label === 'Intensitas Cahaya') ?? defaultItems[3];
  const moisturePercentage = parsePercentage(moisture.value);
  const moistureStatus = isOnline ? (moisture.status ?? 'Optimal') : 'Offline';
  const moistureStatusColor = moistureStatusColors[moistureStatus] ?? globalStyles.colors.primaryGreen;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Status Keseluruhan</Text>

      <View style={styles.contentRow}>
        <View style={styles.leftColumn}>
          <Text style={styles.lineText}>
            Rata-rata Kelembapan Tanah: <Text style={styles.boldText}>{moisture.value}</Text>{' '}
            <Text style={{ color: moistureStatusColor }}>({moistureStatus})</Text>
          </Text>
          <Text style={styles.lineText}>
            Katup Aktif: <Text style={styles.boldText}>{valves.value}</Text>
          </Text>
          <View style={styles.lightRow}>
            <MaterialCommunityIcons name={light.icon} size={15} color={light.color} />
            <Text style={styles.lineText}>
              Intensitas Cahaya: <Text style={styles.boldText}>{light.value}</Text>
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: moistureStatusColor,
                  width: `${moisturePercentage}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.weatherColumn}>
          <Text style={styles.weatherLabel}>Suhu Rata-rata</Text>
          <View style={styles.weatherRow}>
            <View>
              <Text style={styles.weatherValue}>{temperature.value}</Text>
              <Text style={[styles.weatherCaption, !isOnline && styles.offlineText]}>
                {isOnline ? 'Data sensor' : 'Offline'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={temperature.icon}
              size={28}
              color={isOnline ? temperature.color : '#64748b'}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: globalStyles.colors.cardBackground,
    borderRadius: 8,
    elevation: 3,
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.14,
    shadowRadius: 5,
  },
  title: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },
  contentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    gap: 3,
    paddingRight: 12,
  },
  lineText: {
    color: '#111111',
    fontSize: 12,
    lineHeight: 17,
  },
  lightRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  boldText: {
    fontWeight: '700',
  },
  progressTrack: {
    backgroundColor: '#DADADA',
    borderRadius: 3,
    height: 6,
    marginTop: 5,
    overflow: 'hidden',
    width: 116,
  },
  progressFill: {
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 3,
    height: 6,
  },
  weatherColumn: {
    minWidth: 84,
  },
  weatherLabel: {
    color: '#111111',
    fontSize: 12,
  },
  weatherRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  weatherValue: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
  },
  weatherCaption: {
    color: '#111111',
    fontSize: 12,
  },
  offlineText: {
    color: '#64748b',
  },
});
