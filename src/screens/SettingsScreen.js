import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppPreferences } from '@/src/context/AppPreferencesContext';
import { getSwitchColors, globalStyles } from '@/src/styles/globalStyles';

function CardSection({ title, children, theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function RowItem({ icon, title, subtitle, onPress, theme, danger = false }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rowItem, { borderTopColor: theme.border }, pressed && styles.rowPressed]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.iconBackground }, danger && styles.rowIconDanger]}>
        <MaterialCommunityIcons name={icon} size={20} color={danger ? '#c2410c' : globalStyles.colors.primaryGreen} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowText, { color: theme.text }, danger && styles.dangerText]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: theme.mutedText }]}>{subtitle}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.mutedText} />
    </Pressable>
  );
}

function ToggleRow({ icon, title, subtitle, value, onValueChange, theme }) {
  const switchColors = getSwitchColors(value);

  return (
    <View style={[styles.rowItem, { borderTopColor: theme.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.iconBackground }]}>
        <MaterialCommunityIcons name={icon} size={20} color={globalStyles.colors.primaryGreen} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowText, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: theme.mutedText }]}>{subtitle}</Text> : null}
      </View>
      <Switch
        onValueChange={onValueChange}
        style={styles.switchControl}
        thumbColor={switchColors.thumbColor}
        trackColor={switchColors.trackColor}
        value={value}
      />
    </View>
  );
}

function AccountHeader({ onOpenProfile }) {
  const { profile, theme } = useAppPreferences();
  const initials = profile.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      onPress={onOpenProfile}
      style={({ pressed }) => [styles.accountCard, { backgroundColor: theme.card }, pressed && styles.rowPressed]}>
      <View style={styles.accountAvatar}>
        <Text style={styles.accountInitial}>{initials}</Text>
      </View>
      <View style={styles.accountInfo}>
        <Text style={[styles.accountName, { color: theme.text }]}>{profile.name}</Text>
        <Text style={[styles.accountRole, { color: theme.mutedText }]}>{profile.role}</Text>
        <View style={styles.accountMeta}>
          <MaterialCommunityIcons name="shield-check" size={14} color={globalStyles.colors.primaryGreenDark} />
          <Text style={styles.accountMetaText}>Akun terverifikasi</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.mutedText} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { darkMode, setDarkMode, theme } = useAppPreferences();
  const [leakAlerts, setLeakAlerts] = useState(true);
  const [soilMoisture, setSoilMoisture] = useState(true);
  const [systemStatus, setSystemStatus] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const openDetail = (title) => {
    Alert.alert(title, 'Halaman detail pengaturan ini akan dibuka.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Pengaturan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AccountHeader onOpenProfile={() => router.push('/profile')} />

        <CardSection title="Akun" theme={theme}>
          <RowItem
            icon="account-outline"
            onPress={() => router.push('/profile')}
            subtitle="Lihat dan ubah data akun"
            theme={theme}
            title="Profil Saya"
          />
        </CardSection>

        <CardSection title="Perangkat" theme={theme}>
          <RowItem
            icon="chip"
            onPress={() => openDetail('Pengendali SmartDrip')}
            subtitle="Online, terakhir sinkron 2 menit lalu"
            theme={theme}
            title="Pengendali SmartDrip"
          />
          <ToggleRow
            icon="sync"
            onValueChange={setAutoSync}
            subtitle="Kirim data sensor secara berkala"
            theme={theme}
            title="Sinkronisasi Otomatis"
            value={autoSync}
          />
        </CardSection>

        <CardSection title="Notifikasi" theme={theme}>
          <ToggleRow
            icon="pipe-leak"
            onValueChange={setLeakAlerts}
            subtitle="Kirim peringatan saat ada indikasi bocor"
            theme={theme}
            title="Peringatan Kebocoran"
            value={leakAlerts}
          />
          <ToggleRow
            icon="water-percent"
            onValueChange={setSoilMoisture}
            subtitle="Pantau ambang kelembapan tanah"
            theme={theme}
            title="Kelembapan Tanah"
            value={soilMoisture}
          />
          <ToggleRow
            icon="server-network"
            onValueChange={setSystemStatus}
            subtitle="Info ketika sistem online atau offline"
            theme={theme}
            title="Status Sistem"
            value={systemStatus}
          />
        </CardSection>

        <CardSection title="Tampilan Aplikasi" theme={theme}>
          <ToggleRow
            icon="theme-light-dark"
            onValueChange={setDarkMode}
            subtitle="Gunakan tema gelap untuk aplikasi"
            theme={theme}
            title="Mode Gelap"
            value={darkMode}
          />
        </CardSection>

        <CardSection title="Bantuan" theme={theme}>
          <RowItem
            icon="information-outline"
            onPress={() => openDetail('Versi Aplikasi')}
            subtitle="MFarm versi 1.0.0"
            theme={theme}
            title="Versi Aplikasi"
          />
          <RowItem
            danger
            icon="logout"
            onPress={() => openDetail('Keluar Akun')}
            subtitle="Akhiri sesi dari perangkat ini"
            theme={theme}
            title="Keluar Akun"
          />
        </CardSection>
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
    minHeight: 58,
    paddingHorizontal: 14,
  },
  topTitle: {
    color: '#ffffff',
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    gap: 12,
    padding: 12,
    paddingBottom: 82,
  },
  accountCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  accountAvatar: {
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderColor: globalStyles.colors.primaryGreen,
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  accountInitial: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 19,
    fontWeight: '800',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '800',
  },
  accountRole: {
    color: '#5b655f',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  accountMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 7,
  },
  accountMetaText: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  rowItem: {
    alignItems: 'center',
    borderTopColor: '#E7E7E7',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 62,
    paddingVertical: 8,
  },
  rowPressed: {
    opacity: 0.82,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: '#F1F8F2',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  rowIconDanger: {
    backgroundColor: '#fff1e8',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
  rowSubtitle: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2,
  },
  dangerText: {
    color: '#c2410c',
  },
  switchControl: {
    transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }],
  },
});
