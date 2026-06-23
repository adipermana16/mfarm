import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppPreferences } from '@/src/context/AppPreferencesContext';
import { globalStyles } from '@/src/styles/globalStyles';

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  confirmPassword: '',
  email: '',
  fullName: '',
  password: '',
  phone: '',
};

function InputField({
  icon,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  theme,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  label: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  theme: {
    card: string;
    text: string;
    mutedText: string;
    border: string;
    iconBackground: string;
  };
  value: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>{label}</Text>
      <View style={[styles.inputShell, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.inputIconWrap, { backgroundColor: theme.iconBackground }]}>
          <MaterialCommunityIcons color={globalStyles.colors.primaryGreenDark} name={icon} size={19} />
        </View>
        <TextInput
          autoCapitalize="none"
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.mutedText}
          secureTextEntry={secureTextEntry}
          style={[styles.input, { color: theme.text }]}
          value={value}
        />
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { applyRegisteredAccount, theme } = useAppPreferences();
  const [form, setForm] = useState<FormState>(initialForm);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completion = useMemo(() => {
    const values = Object.values(form);
    const filledFields = values.filter((value) => value.trim().length > 0).length;

    return Math.round((filledFields / values.length) * 100);
  }, [form]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (Object.values(form).some((value) => !value.trim())) {
      return 'Semua field registrasi wajib diisi.';
    }

    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      return 'Format email belum valid.';
    }

    if (form.password.trim().length < 8) {
      return 'Password minimal 8 karakter.';
    }

    if (form.password !== form.confirmPassword) {
      return 'Konfirmasi password harus sama dengan password.';
    }

    if (!agreeTerms) {
      return 'Setujui syarat layanan untuk melanjutkan registrasi.';
    }

    return null;
  };

  const submitRegistration = async () => {
    const validationError = validateForm();

    if (validationError) {
      Alert.alert('Registrasi belum bisa diproses', validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await applyRegisteredAccount({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        password: form.password,
        phone: form.phone.trim(),
      });
      Alert.alert('Registrasi berhasil', 'Akun baru berhasil dibuat dan siap digunakan.', [
        {
          onPress: () => router.replace('/(tabs)'),
          text: 'Lanjut ke Home',
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sistem belum bisa memproses registrasi.';
      Alert.alert('Registrasi gagal', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <View style={styles.heroBackdropTop} />
          <View style={styles.heroBackdropBottom} />
          <View style={styles.heroCard}>
            <View style={styles.topBar}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <MaterialCommunityIcons color="#ffffff" name="arrow-left" size={24} />
              </Pressable>
              <View style={styles.previewPill}>
                <MaterialCommunityIcons color="#ffffff" name="shield-check-outline" size={16} />
                <Text style={styles.previewText}>Akun siap dibuat</Text>
              </View>
            </View>

            <View style={styles.heroHeader}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons color={globalStyles.colors.primaryGreenDark} name="sprout" size={20} />
              </View>
              <Text style={styles.heroEyebrow}>Registrasi Pengguna</Text>
              <Text style={styles.heroTitle}>Buat akun baru dan langsung masuk ke aplikasi.</Text>
              <Text style={styles.heroSubtitle}>
                Setelah form selesai dikirim, akun akan langsung aktif tanpa kode OTP tambahan.
              </Text>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressMeta}>
                <Text style={styles.progressLabel}>Kelengkapan formulir</Text>
                <Text style={styles.progressValue}>{completion}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completion}%` }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Akun</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>
              Lengkapi identitas dasar untuk pembuatan akun pengguna baru.
            </Text>

            <InputField
              icon="account-outline"
              label="Nama Lengkap"
              onChangeText={(text) => updateField('fullName', text)}
              placeholder="Masukkan nama lengkap"
              theme={theme}
              value={form.fullName}
            />
            <InputField
              icon="email-outline"
              keyboardType="email-address"
              label="Email"
              onChangeText={(text) => updateField('email', text)}
              placeholder="nama@email.com"
              theme={theme}
              value={form.email}
            />
            <InputField
              icon="phone-outline"
              keyboardType="phone-pad"
              label="Nomor HP"
              onChangeText={(text) => updateField('phone', text)}
              placeholder="+62 8xx xxxx xxxx"
              theme={theme}
              value={form.phone}
            />
            <InputField
              icon="lock-outline"
              label="Password"
              onChangeText={(text) => updateField('password', text)}
              placeholder="Minimal 8 karakter"
              secureTextEntry
              theme={theme}
              value={form.password}
            />
            <InputField
              icon="shield-check-outline"
              label="Konfirmasi Password"
              onChangeText={(text) => updateField('confirmPassword', text)}
              placeholder="Ulangi password"
              secureTextEntry
              theme={theme}
              value={form.confirmPassword}
            />

            <Pressable
              onPress={() => setAgreeTerms((current) => !current)}
              style={({ pressed }) => [styles.termsRow, { borderColor: theme.border }, pressed && styles.pressed]}>
              <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                {agreeTerms ? <MaterialCommunityIcons color="#ffffff" name="check" size={15} /> : null}
              </View>
              <Text style={[styles.termsText, { color: theme.text }]}>
                Saya setuju untuk memproses data akun untuk kebutuhan login aplikasi.
              </Text>
            </Pressable>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryHeader}>
              <MaterialCommunityIcons color={globalStyles.colors.warningOrange} name="lightning-bolt" size={20} />
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Validasi aktif</Text>
            </View>
            <Text style={[styles.summaryBody, { color: theme.mutedText }]}>
              Password minimal 8 karakter dan konfirmasi password harus sama sebelum akun baru dibuat.
            </Text>
          </View>

          <Pressable onPress={submitRegistration} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isSubmitting && styles.disabledButton]}>
            <MaterialCommunityIcons color="#ffffff" name="account-plus-outline" size={20} />
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Membuat akun...' : 'Buat Akun'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
  },
  heroWrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  heroBackdropTop: {
    backgroundColor: '#DFF3E4',
    borderRadius: 32,
    height: 180,
    left: 28,
    opacity: 0.9,
    position: 'absolute',
    right: 28,
    top: 16,
  },
  heroBackdropBottom: {
    backgroundColor: '#F6E8C8',
    borderRadius: 28,
    height: 130,
    left: 8,
    opacity: 0.8,
    position: 'absolute',
    right: 72,
    top: 140,
  },
  heroCard: {
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 28,
    overflow: 'hidden',
    paddingBottom: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  previewPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  previewText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroHeader: {
    paddingTop: 28,
  },
  heroBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F8E8',
    borderRadius: 16,
    height: 34,
    justifyContent: 'center',
    marginBottom: 14,
    width: 34,
  },
  heroEyebrow: {
    color: '#D7F7DF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 35,
    marginTop: 10,
  },
  heroSubtitle: {
    color: '#E9F7ED',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 300,
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    marginTop: 24,
    padding: 14,
  },
  progressMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#F4FFF6',
    fontSize: 13,
    fontWeight: '700',
  },
  progressValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999,
    height: 10,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#F6E8C8',
    borderRadius: 999,
    height: '100%',
  },
  sectionWrap: {
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  sectionCard: {
    borderRadius: 24,
    elevation: 3,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 6,
  },
  fieldBlock: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputShell: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 12,
  },
  inputIconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  termsRow: {
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    padding: 14,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: '#D1D5DB',
    borderRadius: 8,
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    width: 22,
  },
  checkboxActive: {
    backgroundColor: globalStyles.colors.primaryGreen,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  summaryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  summaryBody: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  disabledButton: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
});
