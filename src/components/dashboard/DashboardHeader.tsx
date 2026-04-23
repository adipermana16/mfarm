import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type DashboardHeaderProps = {
  farmerName: string;
  location: string;
  lastUpdated: string;
};

export function DashboardHeader({ farmerName, location, lastUpdated }: DashboardHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.eyebrow}>Dasbor Utama</Text>
        <Text style={styles.title}>Halo, {farmerName}</Text>
      </View>
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="map-marker-radius" size={18} color="#3c6255" />
        <Text style={styles.metaText}>{location}</Text>
      </View>
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="clock-outline" size={18} color="#6b7280" />
        <Text style={styles.subtleText}>Diperbarui {lastUpdated}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  eyebrow: {
    color: '#3c6255',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#17251f',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 2,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  metaText: {
    color: '#3c6255',
    fontSize: 14,
    fontWeight: '700',
  },
  subtleText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
