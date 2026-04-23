import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { globalStyles } from '@/src/styles/globalStyles';

export default function Header({ isOnline = true }) {
  const statusColor = isOnline ? '#2E7D32' : '#D32F2F';
  const statusText = isOnline ? 'Sistem Online' : 'Sistem Offline';

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <MaterialCommunityIcons name="leaf" size={25} color="#ffffff" />
        </View>
        <View style={styles.brandTextWrap}>
          <Text style={styles.appName}>Irigasi SmartDrip</Text>
        </View>
      </View>

      <View style={styles.rightColumn}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 84,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  logo: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.86)',
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  brandTextWrap: {
    flex: 1,
    gap: 5,
  },
  appName: {
    color: '#ffffff',
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  statusRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '700',
  },
});
