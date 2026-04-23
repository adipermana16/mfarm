import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type StatCardProps = {
  title: string;
  value: string;
  unit?: string;
  status: string;
  icon: IconName;
  accentColor: string;
};

export function StatCard({ title, value, unit, status, icon, accentColor }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
        <MaterialCommunityIcons name={icon} size={23} color={accentColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Text style={[styles.status, { color: accentColor }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e6eadf',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 142,
    padding: 14,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  title: {
    color: '#5b655f',
    fontSize: 13,
    fontWeight: '700',
  },
  valueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 4,
  },
  value: {
    color: '#17251f',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 0,
  },
  unit: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
  },
  status: {
    fontSize: 12,
    fontWeight: '800',
  },
});
