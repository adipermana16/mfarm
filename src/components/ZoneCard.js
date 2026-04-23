import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Polygon, Polyline, Stop } from 'react-native-svg';

import { dataStyles, getSwitchColors, globalStyles } from '@/src/styles/globalStyles';

function buildArcPath(value) {
  const clampedValue = Math.max(0, Math.min(value, 100));
  const startAngle = 180;
  const endAngle = 180 + (clampedValue / 100) * 180;
  const radius = 48;
  const center = 58;

  const toPoint = (angle) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(radians),
      y: center + radius * Math.sin(radians),
    };
  };

  const start = toPoint(startAngle);
  const end = toPoint(endAngle);
  const largeArcFlag = clampedValue > 50 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function buildTrendPoints(values) {
  if (!values.length) {
    return '';
  }

  const width = 260;
  const height = 64;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - minValue) / range) * 46 - 9;
      return `${x},${y}`;
    })
    .join(' ');
}

/**
 * @param {{
 *   zoneName: string;
 *   fieldName: string;
 *   soilMoisture: number;
 *   temperature: number;
 *   lightIntensity?: number;
 *   airHumidity: number;
 *   trendData?: number[];
 *   initialValveOn?: boolean;
 *   isExpanded?: boolean;
 * }} props
 */
export default function ZoneCard({
  zoneName,
  fieldName,
  soilMoisture,
  temperature,
  lightIntensity,
  airHumidity,
  trendData = [],
  initialValveOn = false,
  isExpanded = true,
}) {
  const [isValveOn, setIsValveOn] = useState(initialValveOn);
  const gaugePath = useMemo(() => buildArcPath(soilMoisture), [soilMoisture]);
  const trendPoints = useMemo(() => buildTrendPoints(trendData), [trendData]);
  const switchColors = getSwitchColors(isValveOn);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.zoneTitle}>
            {zoneName} - {fieldName}
          </Text>
        </View>
        <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#111111" />
      </View>

      {!isExpanded ? (
        <View style={styles.collapsedBody}>
          <Text style={styles.collapsedText}>Rata-rata Kelembapan Tanah: {soilMoisture}% (Optimal)</Text>
          <View style={styles.collapsedDivider} />
          <Text style={styles.collapsedText}>Suhu: {temperature} C</Text>
          <Text style={styles.collapsedText}>Intensitas Cahaya: {lightIntensity ?? 0} lux</Text>
          <Text style={styles.collapsedText}>Katup Aktif: {isValveOn ? '2/4' : 'Mati'}</Text>
          <Text style={styles.collapsedText}>Cuaca Lokal: 29 C</Text>
        </View>
      ) : (
        <>

      <View style={styles.bodyRow}>
        <View style={[styles.gaugeWrap, dataStyles.gaugeContainer]}>
          <Svg width={132} height={76} viewBox="0 0 116 72">
            <Path d="M 10 58 A 48 48 0 1 1 106 58" fill="none" stroke="#E2E2E2" strokeWidth={20} />
            <Path d={gaugePath} fill="none" stroke={globalStyles.colors.primaryGreen} strokeWidth={20} />
            <Path d="M 58 58 L 72 15" stroke="#111111" strokeLinecap="round" strokeWidth={3} />
          </Svg>
          <Text style={[styles.gaugeValue, dataStyles.gaugeText]}>{soilMoisture}%</Text>
          <Text style={styles.gaugeLabel}>Kelembapan Tanah</Text>
        </View>

        <View style={styles.sensorPanel}>
          <View style={styles.sensorRow}>
            <Text style={styles.sensorLabel}>Suhu</Text>
            <Text style={styles.sensorValue}>{temperature} C</Text>
          </View>
          <View style={styles.sensorRow}>
            <Text style={styles.sensorLabel}>Kelembapan</Text>
            <Text style={styles.sensorValue}>{airHumidity}%</Text>
          </View>
          <View style={styles.sensorRow}>
            <Text style={styles.sensorLabel}>Intensitas Cahaya</Text>
            <Text style={styles.sensorValue}>{lightIntensity ?? 0} lux</Text>
          </View>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Katup</Text>
              <Text style={[styles.valveTextOn, styles.openText]}>{isValveOn ? 'BUKA' : 'MATI'}</Text>
            </View>
            <Switch
              onValueChange={setIsValveOn}
              thumbColor={switchColors.thumbColor}
              trackColor={switchColors.trackColor}
              value={isValveOn}
            />
          </View>
        </View>
      </View>

      <View style={[styles.trendBox, dataStyles.chartContainer]}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>Tren Kelembapan</Text>
          <Text style={styles.trendMeta}>6 jam terakhir</Text>
        </View>
        <Svg width="100%" height={72} viewBox="0 0 260 64" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor="#2D9CDB" stopOpacity="0.28" />
              <Stop offset="1" stopColor="#2D9CDB" stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Polygon fill="url(#trendFill)" points={`0,64 ${trendPoints} 260,64`} />
          <Polyline fill="none" points={trendPoints} stroke="#1688C7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        </Svg>
        <View style={styles.axisRow}>
          <Text style={styles.axisText}>0h</Text>
          <Text style={styles.axisText}>6h</Text>
          <Text style={styles.axisText}>12h</Text>
          <Text style={styles.axisText}>16h</Text>
          <Text style={styles.axisText}>24h</Text>
        </View>
      </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: globalStyles.colors.cardBackground,
    borderRadius: 8,
    elevation: 3,
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  zoneTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0,
  },
  fieldName: {
    color: globalStyles.colors.textLight,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  valveBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  valveBadgeOn: {
    backgroundColor: '#E8F5E9',
  },
  valveBadgeOff: {
    backgroundColor: '#f1f5f9',
  },
  valveBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  valveTextOn: {
    color: globalStyles.colors.primaryGreen,
  },
  valveTextOff: {
    color: '#64748b',
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gaugeWrap: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
    minHeight: 116,
    padding: 0,
  },
  gaugeValue: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: -2,
  },
  gaugeLabel: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
    textAlign: 'center',
  },
  sensorPanel: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  sensorRow: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 3,
    minHeight: 38,
  },
  sensorLabel: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '400',
  },
  sensorValue: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  switchLabel: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '400',
  },
  trendBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: -2,
    padding: 0,
  },
  trendHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  trendTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
  },
  trendMeta: {
    display: 'none',
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  axisText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '400',
  },
  openText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  collapsedBody: {
    gap: 5,
  },
  collapsedText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '400',
  },
  collapsedDivider: {
    backgroundColor: '#E3E3E3',
    height: 1,
    marginTop: 2,
  },
});
