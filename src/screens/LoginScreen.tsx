import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppPreferences } from '@/src/context/AppPreferencesContext';
import { globalStyles } from '@/src/styles/globalStyles';

function LoginField({
  icon,
  label,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  showPasswordToggle = false,
  value,
  theme,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  value: string;
  theme: {
    card: string;
    text: string;
    mutedText: string;
    border: string;
    iconBackground: string;
  };
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>{label}</Text>
      <View style={[styles.inputShell, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.iconBackground }]}>
          <MaterialCommunityIcons color={globalStyles.colors.primaryGreenDark} name={icon} size={18} />
        </View>
        <TextInput
          autoCapitalize="none"
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.mutedText}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          style={[styles.input, { color: theme.text }]}
          value={value}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
            onPress={() => setIsPasswordVisible((current) => !current)}
            style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons
              color={theme.mutedText}
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { profile, signIn, theme } = useAppPreferences();
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    const result = signIn({ email, password });

    if (!result.success) {
      Alert.alert('Login gagal', result.message ?? 'Silakan cek kembali data akun Anda.');
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.heroWrap}>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
          <View style={styles.heroCard}>
            <View style={styles.brandBadge}>
              <MaterialCommunityIcons color={globalStyles.colors.primaryGreenDark} name="sprout" size={22} />
            </View>
            <Text style={styles.eyebrow}>MFarm SmartDrip</Text>
            <Text style={styles.title}>Login untuk membuka dashboard irigasi Anda.</Text>
            <Text style={styles.subtitle}>
              Masuk dengan email akun yang aktif. Untuk demo lokal, password minimal 8 karakter sudah bisa digunakan.
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Masuk Akun</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>
              Email aktif saat ini: {profile.email}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>
              Akun admin: admin@mfarm.id / admin12345
            </Text>

            <LoginField
              icon="email-outline"
              label="Email"
              onChangeText={setEmail}
              placeholder="nama@email.com"
              theme={theme}
              value={email}
            />
            <LoginField
              icon="lock-outline"
              label="Password"
              onChangeText={setPassword}
              placeholder="Minimal 8 karakter"
              secureTextEntry
              showPasswordToggle
              theme={theme}
              value={password}
            />

            <Pressable onPress={handleSignIn} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons color="#ffffff" name="login" size={20} />
              <Text style={styles.primaryButtonText}>Login Sekarang</Text>
            </Pressable>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>Belum punya akun?</Text>
            <Text style={[styles.infoBody, { color: theme.mutedText }]}>
              Buat akun baru lewat form registrasi, lalu Anda bisa langsung masuk ke aplikasi.
            </Text>
            <Link href="/register" asChild>
              <Pressable style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border }, pressed && styles.pressed]}>
                <MaterialCommunityIcons color={globalStyles.colors.primaryGreen} name="account-plus-outline" size={18} />
                <Text style={styles.secondaryButtonText}>Buka Registrasi</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  heroWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  glowTop: {
    backgroundColor: '#DFF3E4',
    borderRadius: 32,
    height: 160,
    left: 30,
    opacity: 0.9,
    position: 'absolute',
    right: 30,
    top: 20,
  },
  glowBottom: {
    backgroundColor: '#F6E8C8',
    borderRadius: 28,
    height: 120,
    left: 10,
    opacity: 0.85,
    position: 'absolute',
    right: 78,
    top: 150,
  },
  heroCard: {
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 28,
    padding: 22,
  },
  brandBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F8E8',
    borderRadius: 16,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  eyebrow: {
    color: '#D7F7DF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 37,
    marginTop: 10,
  },
  subtitle: {
    color: '#E9F7ED',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  content: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 16,
  },
  formCard: {
    borderRadius: 24,
    elevation: 3,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  fieldBlock: {
    marginTop: 16,
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
  iconWrap: {
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
  visibilityButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 56,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 52,
  },
  secondaryButtonText: {
    color: globalStyles.colors.primaryGreen,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
});
