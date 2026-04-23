import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppPreferences } from '@/src/context/AppPreferencesContext';
import { globalStyles } from '@/src/styles/globalStyles';

function InfoRow({ icon, label, value, field, draft, setDraft, isEditing, theme }) {
  return (
    <View style={[styles.infoRow, { borderTopColor: theme.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.iconBackground }]}>
        <MaterialCommunityIcons name={icon} size={19} color={globalStyles.colors.primaryGreen} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoLabel, { color: theme.mutedText }]}>{label}</Text>
        {isEditing ? (
          <TextInput
            onChangeText={(text) => setDraft((current) => ({ ...current, [field]: text }))}
            placeholderTextColor={theme.mutedText}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            value={draft[field]}
          />
        ) : (
          <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

function MetricItem({ value, label, theme }) {
  return (
    <View style={styles.metricItem}>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.mutedText }]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, theme } = useAppPreferences();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const initials = profile.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const startEditing = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const saveProfile = () => {
    if (!draft.name.trim()) {
      Alert.alert('Profil belum lengkap', 'Nama tidak boleh kosong.');
      return;
    }

    updateProfile({
      ...draft,
      name: draft.name.trim(),
      role: draft.role.trim(),
      location: draft.location.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      farmName: draft.farmName.trim(),
      farmArea: draft.farmArea.trim(),
      activeSince: draft.activeSince.trim(),
    });
    setIsEditing(false);
    Alert.alert('Profil tersimpan', 'Perubahan profil berhasil disimpan.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>{isEditing ? 'Ubah Profil' : 'Profil Akun'}</Text>
        <Pressable onPress={isEditing ? saveProfile : startEditing} style={styles.iconButton}>
          <MaterialCommunityIcons name={isEditing ? 'check' : 'pencil'} size={22} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.card }]}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
          {isEditing ? (
            <View style={styles.heroInputs}>
              <TextInput
                onChangeText={(text) => setDraft((current) => ({ ...current, name: text }))}
                placeholder="Nama"
                placeholderTextColor={theme.mutedText}
                style={[styles.heroInput, { borderColor: theme.border, color: theme.text }]}
                value={draft.name}
              />
              <TextInput
                onChangeText={(text) => setDraft((current) => ({ ...current, role: text }))}
                placeholder="Peran"
                placeholderTextColor={theme.mutedText}
                style={[styles.heroInput, { borderColor: theme.border, color: theme.text }]}
                value={draft.role}
              />
            </View>
          ) : (
            <>
              <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
              <Text style={[styles.role, { color: theme.mutedText }]}>{profile.role}</Text>
            </>
          )}
          <View style={styles.locationPill}>
            <MaterialCommunityIcons name="map-marker" size={15} color={globalStyles.colors.primaryGreenDark} />
            {isEditing ? (
              <TextInput
                onChangeText={(text) => setDraft((current) => ({ ...current, location: text }))}
                placeholder="Lokasi"
                placeholderTextColor={globalStyles.colors.primaryGreenDark}
                style={styles.locationInput}
                value={draft.location}
              />
            ) : (
              <Text style={styles.locationText}>{profile.location}</Text>
            )}
          </View>
        </View>

        <View style={[styles.metricsCard, { backgroundColor: theme.card }]}>
          <MetricItem value="3" label="Zona aktif" theme={theme} />
          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
          <MetricItem value="12" label="Jadwal" theme={theme} />
          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
          <MetricItem value="98%" label="Online" theme={theme} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Informasi Kontak</Text>
          <InfoRow field="email" draft={draft} icon="email-outline" isEditing={isEditing} label="Email" setDraft={setDraft} theme={theme} value={profile.email} />
          <InfoRow field="phone" draft={draft} icon="phone-outline" isEditing={isEditing} label="Nomor Telepon" setDraft={setDraft} theme={theme} value={profile.phone} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Informasi Kebun</Text>
          <InfoRow field="farmName" draft={draft} icon="sprout-outline" isEditing={isEditing} label="Nama Kebun" setDraft={setDraft} theme={theme} value={profile.farmName} />
          <InfoRow field="farmArea" draft={draft} icon="texture-box" isEditing={isEditing} label="Luas Lahan" setDraft={setDraft} theme={theme} value={profile.farmArea} />
          <InfoRow field="activeSince" draft={draft} icon="calendar-check" isEditing={isEditing} label="Aktif Sejak" setDraft={setDraft} theme={theme} value={profile.activeSince} />
        </View>

        <Pressable
          onPress={isEditing ? saveProfile : startEditing}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <MaterialCommunityIcons name={isEditing ? 'content-save' : 'account-edit'} size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{isEditing ? 'Simpan Profil' : 'Ubah Profil'}</Text>
        </Pressable>

        {isEditing ? (
          <Pressable onPress={cancelEditing} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
            <Text style={styles.secondaryButtonText}>Batal</Text>
          </Pressable>
        ) : null}
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
    paddingHorizontal: 10,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  topTitle: {
    color: '#ffffff',
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    gap: 12,
    padding: 14,
    paddingBottom: 34,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  avatarLarge: {
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderColor: globalStyles.colors.primaryGreen,
    borderRadius: 36,
    borderWidth: 2,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarInitial: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 24,
    fontWeight: '800',
  },
  name: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  role: {
    color: '#5b655f',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  locationPill: {
    alignItems: 'center',
    backgroundColor: '#F1F8F2',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationText: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 13,
    fontWeight: '700',
  },
  locationInput: {
    color: globalStyles.colors.primaryGreenDark,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 150,
    padding: 0,
  },
  heroInputs: {
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  heroInput: {
    borderBottomWidth: 1,
    fontSize: 17,
    fontWeight: '700',
    minHeight: 38,
    textAlign: 'center',
  },
  metricsCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  metricValue: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#5b655f',
    fontSize: 12,
    fontWeight: '700',
  },
  metricDivider: {
    backgroundColor: '#E0E0E0',
    height: 34,
    width: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    paddingHorizontal: 14,
    paddingTop: 12,
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
    marginBottom: 6,
  },
  infoRow: {
    alignItems: 'center',
    borderTopColor: '#E8E8E8',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
  },
  infoIcon: {
    alignItems: 'center',
    backgroundColor: '#F1F8F2',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '700',
  },
  infoValue: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  input: {
    borderBottomWidth: 1,
    fontSize: 15,
    fontWeight: '700',
    minHeight: 34,
    paddingHorizontal: 0,
    paddingVertical: 2,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: globalStyles.colors.primaryGreen,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryButtonText: {
    color: globalStyles.colors.primaryGreen,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
