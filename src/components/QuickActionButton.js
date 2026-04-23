import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function QuickActionButton({ title, iconName, backgroundColor, onPress }) {
  const isLightButton = backgroundColor === 'transparent' || backgroundColor === '#F1E3D5';
  const foregroundColor = isLightButton ? '#111111' : '#ffffff';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.pressed,
      ]}>
      <MaterialCommunityIcons name={iconName} size={20} color={foregroundColor} />
      <Text style={[styles.title, { color: foregroundColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    elevation: 0,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  title: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
