import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type ZoneCardProps = {
  name: string;
  crop: string;
  moisture: number;
  temperature: number;
  status: 'optimal' | 'warning' | 'critical';
};

const statusMap = {
  optimal: { label: 'Optimal', color: '#2f855a', background: '#e9f7ef' },
  warning: { label: 'Perlu cek', color: '#b7791f', background: '#fff7db' },
  critical: { label: 'Kritis', color: '#c2410c', background: '#fff1e8' },
};

export function ZoneCard({ name, crop, moisture, temperature, status }: ZoneCardProps) {
  const statusStyle = statusMap[status];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.crop}>{crop}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusStyle.background }]}>
          <Text style={[styles.badgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
        </View>
      </View>
      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="water-percent" size={20} color="#2563eb" />
          <Text style={styles.metricText}>{moisture}% tanah</Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="thermometer" size={20} color="#c2410c" />
          <Text style={styles.metricText}>{temperature} C</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e6eadf',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  name: {
    color: '#17251f',
    fontSize: 16,
    fontWeight: '800',
  },
  crop: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: '#f6f7f2',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  metricText: {
    color: '#374151',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
});
