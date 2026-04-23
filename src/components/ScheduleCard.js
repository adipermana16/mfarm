import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { getSwitchColors } from '@/src/styles/globalStyles';

export default function ScheduleCard({ schedule, onToggleChange }) {
  const [isEnabled, setIsEnabled] = useState(schedule.isEnabled);
  const [isUpdating, setIsUpdating] = useState(false);
  const switchColors = getSwitchColors(isEnabled);

  const handleToggle = async (nextValue) => {
    const previousValue = isEnabled;

    setIsEnabled(nextValue);
    setIsUpdating(true);

    try {
      await onToggleChange?.(schedule.id, nextValue);
    } catch {
      setIsEnabled(previousValue);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleWrap}>
          <Text style={styles.scheduleName}>{schedule.name}</Text>
          <Text style={styles.zoneName}>{schedule.zoneName}</Text>
        </View>
        <Switch
          disabled={isUpdating}
          onValueChange={handleToggle}
          thumbColor={switchColors.thumbColor}
          trackColor={switchColors.trackColor}
          value={isEnabled}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.repeatText}>{schedule.days} pukul {schedule.time}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <MaterialCommunityIcons name="clock-outline" size={18} color="#333333" />
        <Text style={styles.daysText}>{schedule.duration}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
  },
  scheduleName: {
    color: '#111111',
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  zoneName: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 3,
  },
  divider: {
    backgroundColor: '#E3E3E3',
    height: 1,
  },
  infoRow: {
    minHeight: 34,
    justifyContent: 'center',
  },
  repeatText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '400',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  daysText: {
    color: '#111111',
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  enabledBadge: {
    backgroundColor: '#e9f7ef',
  },
  disabledBadge: {
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  enabledText: {
    color: '#2f855a',
  },
  disabledText: {
    color: '#64748b',
  },
});
