import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type QuickActionButtonProps = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

export function QuickActionButton({ label, icon, onPress }: QuickActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <MaterialCommunityIcons name={icon} size={22} color="#ffffff" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#3c6255',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  label: {
    color: '#ffffff',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
