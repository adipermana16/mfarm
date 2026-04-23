import { StyleSheet } from 'react-native';

export const globalStyles = Object.freeze({
  colors: {
    primaryGreen: '#43A047',
    primaryGreenDark: '#2E7D32',
    primaryBlue: '#2196F3',
    warningOrange: '#F4A261',
    backgroundLight: '#F7F8F6',
    cardBackground: '#FFFFFF',
    textDark: '#1F1F1F',
    textLight: '#666666',
    inactiveGray: '#767577',
    borderLight: '#E3E3E3',
  },
  typography: {
    fontFamily: 'System',
    headerFontSize: 24,
    cardTitleFontSize: 16,
    sensorValueFontSize: 36,
    bodyFontSize: 14,
  },
});

export const sharedStyles = StyleSheet.create({
  container: {
    backgroundColor: globalStyles.colors.backgroundLight,
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: globalStyles.colors.cardBackground,
    borderRadius: 12,
    elevation: 4,
    marginBottom: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
});

export function getSwitchColors(isActive) {
  return {
    thumbColor: isActive ? globalStyles.colors.cardBackground : '#f4f3f4',
    trackColor: {
      false: globalStyles.colors.inactiveGray,
      true: globalStyles.colors.primaryGreen,
    },
  };
}

export const controlStyles = StyleSheet.create({
  dayCircle: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginHorizontal: 4,
    width: 36,
  },
  selectedDayCircle: {
    backgroundColor: globalStyles.colors.primaryBlue,
  },
  selectedDayText: {
    color: globalStyles.colors.cardBackground,
    fontWeight: 'bold',
  },
});

export const buttonStyles = StyleSheet.create({
  saveButton: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 8,
    elevation: 3,
    marginVertical: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  saveButtonText: {
    color: globalStyles.colors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  warningActionButton: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.warningOrange,
    borderRadius: 10,
    padding: 15,
  },
});

export const dataStyles = StyleSheet.create({
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  gaugeText: {
    color: globalStyles.colors.primaryGreen,
    fontSize: globalStyles.typography.sensorValueFontSize,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: globalStyles.colors.cardBackground,
    borderRadius: 8,
    marginVertical: 10,
    padding: 10,
  },
});
