import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppPreferences } from '@/src/context/AppPreferencesContext';
import { resendRegistrationOtp, verifyRegistrationOtp } from '@/src/services/api';
import { globalStyles } from '@/src/styles/globalStyles';

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    destination?: string;
    expiresAt?: string;
    requestId?: string;
  }>();
  const { applyRegisteredAccount, theme } = useAppPreferences();
  const [otp, setOtp] = useState('');
  const [expiresAt, setExpiresAt] = useState(params.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  const otpBoxes = useMemo(() => {
    const digits = otp.slice(0, 6).split('');
    return Array.from({ length: 6 }, (_, index) => digits[index] ?? '');
  }, [otp]);

  const submitOtp = async () => {
    if (!params.requestId) {
      Alert.alert('Sesi registrasi tidak ditemukan', 'Silakan ulangi proses registrasi dari awal.');
      router.replace('/register');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('OTP belum valid', 'Masukkan 6 digit OTP yang aktif.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await verifyRegistrationOtp(params.requestId, otp);
      applyRegisteredAccount({
        email: result.user.email,
        fullName: result.user.fullName,
        phone: result.user.phone,
      });
      Alert.alert('Registrasi berhasil', 'Akun Anda sudah dibuat dan siap digunakan.', [
        {
          onPress: () => router.replace('/(tabs)'),
          text: 'Lanjut ke Home',
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP tidak dapat diverifikasi.';
      Alert.alert('Verifikasi gagal', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!params.requestId) {
      Alert.alert('Sesi tidak ditemukan', 'Silakan kembali ke formulir registrasi.');
      return;
    }

    try {
      setIsResending(true);
      const result = await resendRegistrationOtp(params.requestId);
      setExpiresAt(result.expiresAt);
      setOtp('');
      Alert.alert('OTP dikirim ulang', `Kode baru telah dikirim ke ${result.maskedDestination}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP tidak dapat dikirim ulang.';
      Alert.alert('Gagal kirim ulang OTP', message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Verifikasi OTP</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons color={globalStyles.colors.primaryGreenDark} name="cellphone-key" size={24} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Masukkan kode OTP 6 digit</Text>
          <Text style={[styles.heroSubtitle, { color: theme.mutedText }]}>
            Kami telah mengirim kode verifikasi ke {params.destination ?? 'kontak Anda'}.
          </Text>
        </View>

        <View style={styles.otpGroup}>
          <Pressable onPress={() => null} style={styles.otpVisual}>
            {otpBoxes.map((digit, index) => (
              <View key={`otp-${index}`} style={[styles.otpBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.otpDigit, { color: theme.text }]}>{digit || '•'}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
            placeholder="Masukkan 6 digit OTP"
            placeholderTextColor={theme.mutedText}
            style={[styles.hiddenInput, { borderColor: theme.border, color: theme.text }]}
            value={otp}
          />
        </View>

        <View style={[styles.timerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.timerRow}>
            <MaterialCommunityIcons color={globalStyles.colors.warningOrange} name="timer-outline" size={18} />
            <Text style={[styles.timerLabel, { color: theme.text }]}>Masa aktif OTP</Text>
          </View>
          <Text style={styles.timerValue}>{formatRemainingTime(remainingSeconds)}</Text>
          <Text style={[styles.timerHint, { color: theme.mutedText }]}>
            Kode akan kedaluwarsa setelah 5 menit. Gunakan kirim ulang jika waktu habis.
          </Text>
        </View>

        <Pressable onPress={submitOtp} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isSubmitting && styles.disabledButton]}>
          <MaterialCommunityIcons color="#ffffff" name="check-decagram-outline" size={20} />
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'Memverifikasi...' : 'Verifikasi dan Buat Akun'}</Text>
        </Pressable>

        <Pressable
          disabled={isResending}
          onPress={handleResendOtp}
          style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }, pressed && styles.pressed, isResending && styles.disabledButton]}>
          <MaterialCommunityIcons color={globalStyles.colors.primaryGreen} name="refresh" size={18} />
          <Text style={styles.secondaryButtonText}>{isResending ? 'Mengirim ulang...' : 'Kirim Ulang OTP'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 14,
  },
  headerButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    textAlign: 'center',
  },
  otpGroup: {
    marginBottom: 24,
  },
  otpVisual: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  otpBox: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 46,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '900',
  },
  hiddenInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 8,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    textAlign: 'center',
  },
  timerCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  timerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  timerValue: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  timerHint: {
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
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 54,
  },
  secondaryButtonText: {
    color: globalStyles.colors.primaryGreen,
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
});
