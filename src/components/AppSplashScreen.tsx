import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function AppSplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <MaterialCommunityIcons name="leaf" size={60} color="#ffffff" />
      </View>
      <Text style={styles.title}>Irigasi SmartDrip</Text>
      <Text style={styles.subtitle}>Sistem irigasi cerdas untuk kebun yang lebih sehat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#3c6255',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoBadge: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 36,
    borderWidth: 3,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 22,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
