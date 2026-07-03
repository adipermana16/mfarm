import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createAutomationRule,
  deleteAutomationRule,
  fetchAutomationHistory,
  fetchAutomationRules,
  fetchFarmSummary,
  fetchIotControl,
  fetchIotReadings,
  fetchIrrigationZones,
  fetchWaterTank,
  fetchWaterUsage,
  updateAutomationRule,
  updateIrrigationZone,
} from '@/src/services/api';
import { getSwitchColors, globalStyles } from '@/src/styles/globalStyles';

const DAYS = [
  { id: 'mon', label: 'Sen' },
  { id: 'tue', label: 'Sel' },
  { id: 'wed', label: 'Rab' },
  { id: 'thu', label: 'Kam' },
  { id: 'fri', label: 'Jum' },
  { id: 'sat', label: 'Sab' },
  { id: 'sun', label: 'Min' },
];

const MODES = [
  { label: 'Kelembapan Tanah', value: 'Soil Moisture' },
  { label: 'Jadwal', value: 'Schedule' },
  { label: 'Hybrid', value: 'Hybrid' },
];
const PRIORITIES = [
  { label: 'Tinggi', value: 'High' },
  { label: 'Sedang', value: 'Medium' },
  { label: 'Rendah', value: 'Low' },
];
const DEFAULT_ZONE_ID = 'zone-a';

const fallbackZones = [
  {
    id: DEFAULT_ZONE_ID,
    zoneName: 'Lahan Tomat',
    esp32Device: 'ESP32-DRIP-01',
    relay: 'Relay 1',
    soilMoistureSensor: 'Sensor Kelembapan 1',
    pump: 'Pompa Utama',
    status: 'Aktif',
  },
];

const fallbackRules = [
  {
    id: 'rule-001',
    ruleName: 'Otomatisasi Tomat Pagi',
    irrigationZone: DEFAULT_ZONE_ID,
    mode: 'Hybrid',
    minimumMoisture: '45',
    maximumMoisture: '70',
    startTime: '06:00',
    endTime: '06:15',
    activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    irrigationDuration: '15',
    priority: 'High',
    status: true,
  },
];

const fallbackHistory = [
  {
    id: 'hist-001',
    date: '2026-06-26',
    time: '06:00',
    rule: 'Morning Tomato Automation',
    zone: 'Lahan Tomat',
    moistureBefore: 42,
    moistureAfter: 57,
    duration: 15,
    waterUsed: 12,
    status: 'Selesai',
  },
];

const fallbackTank = {
  estimatedLiter: 320,
  lastUpdate: 'Baru saja',
  status: 'Normal',
  waterLevel: 78,
};

const fallbackUsage = {
  currentFlow: 1.8,
  todayUsage: 24,
  weeklyUsage: 138,
  monthlyUsage: 514,
  chart: [12, 18, 15, 21, 24, 19, 29],
};

const fallbackFarmSummary = {
  lastUpdated: null,
  stats: {
    activeZones: 0,
    soilMoisture: 0,
    waterTank: 0,
  },
  zones: [],
};

const fallbackIotControl = {
  activeAutomationRule: null,
  activeSchedule: null,
  checkedAt: null,
  controlSource: 'none',
  pumpOn: false,
  zoneId: DEFAULT_ZONE_ID,
};

function makeRuleForm(zoneId = DEFAULT_ZONE_ID) {
  return {
    activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    endTime: '06:15',
    irrigationDuration: '15',
    irrigationZone: zoneId,
    maximumMoisture: '70',
    minimumMoisture: '45',
    mode: 'Soil Moisture',
    priority: 'Medium',
    ruleName: '',
    startTime: '06:00',
    status: true,
  };
}

function makeZoneForm() {
  return {
    esp32Device: fallbackZones[0].esp32Device,
    pump: fallbackZones[0].pump,
    relay: fallbackZones[0].relay,
    soilMoistureSensor: fallbackZones[0].soilMoistureSensor,
    status: fallbackZones[0].status,
    zoneName: fallbackZones[0].zoneName,
  };
}

function normalizeList(payload, fallback) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.rules)) {
    return payload.rules;
  }
  if (Array.isArray(payload?.zones)) {
    return payload.zones;
  }
  if (Array.isArray(payload?.history)) {
    return payload.history;
  }
  return fallback;
}

function getRuleId(rule) {
  return rule.id ?? rule.ruleId ?? rule.rule_id;
}

function getZoneId(zone) {
  return zone.id ?? zone.zoneId ?? zone.zone_id;
}

function getZoneName(zone) {
  return zone.zoneName ?? zone.name ?? zone.zone_name ?? 'Zona Irigasi';
}

function getRuleName(rule) {
  const name = rule.ruleName ?? rule.name ?? rule.rule_name ?? 'Aturan Otomatisasi';
  return name === 'Morning Tomato Automation' ? 'Otomatisasi Tomat Pagi' : name;
}

function isRuleActive(rule) {
  return Boolean(rule.status ?? rule.isEnabled ?? rule.is_enabled);
}

function getModeLabel(mode) {
  return MODES.find((item) => item.value === mode)?.label ?? mode;
}

function getStatusLabel(status) {
  if (status === true) {
    return 'Aktif';
  }
  if (status === false) {
    return 'Nonaktif';
  }
  const labels = {
    Active: 'Aktif',
    Completed: 'Selesai',
    Inactive: 'Nonaktif',
    Normal: 'Normal',
    critical: 'Kritis',
    none: 'Tidak ada',
    optimal: 'Optimal',
    schedule: 'Jadwal',
    warning: 'Perhatian',
  };
  return labels[status] ?? status;
}

function getControlSourceLabel(source) {
  const labels = {
    automation: 'Otomatisasi',
    none: 'Tidak ada kontrol aktif',
    schedule: 'Jadwal lama',
  };
  return labels[source] ?? source ?? 'Tidak ada kontrol aktif';
}

function getIotZoneName(zone) {
  if (zone.id === DEFAULT_ZONE_ID) {
    return 'Lahan Tomat';
  }

  if (zone.crop) {
    return `${zone.name} - ${zone.crop}`;
  }

  return zone.name ?? getZoneName(zone);
}

function buildIotZones(farmZones, configuredZones) {
  const activeFarmZones = farmZones.filter((zone) => zone.id === DEFAULT_ZONE_ID);
  const activeConfiguredZones = configuredZones.filter((zone) => getZoneId(zone) === DEFAULT_ZONE_ID);

  if (!farmZones.length) {
    return activeConfiguredZones.map((zone) => ({
      id: getZoneId(zone),
      name: getZoneName(zone),
      moisture: null,
      temperature: null,
      airHumidity: null,
      pumpOn: false,
      status: zone.status,
    }));
  }

  return activeFarmZones.map((zone) => {
    const configuredZone = configuredZones.find((item) => getZoneId(item) === zone.id);
    return {
      id: zone.id,
      airHumidity: zone.airHumidity,
      device: configuredZone?.esp32Device ?? configuredZone?.esp32_device ?? 'ESP32-DRIP-01',
      moisture: zone.moisture,
      name: getIotZoneName(zone),
      pump: configuredZone?.pump ?? 'Pompa Utama',
      pumpOn: Boolean(zone.initialValveOn),
      relay: configuredZone?.relay ?? 'Relay 1',
      status: zone.status,
      temperature: zone.temperature,
    };
  });
}

function resolveSingleIotZone(zonesData) {
  const normalizedZones = normalizeList(zonesData, fallbackZones);
  const matchingZone = normalizedZones.find((zone) => getZoneId(zone) === DEFAULT_ZONE_ID);
  return [matchingZone ?? fallbackZones[0]];
}

function resolveSingleFarmSummary(summaryData) {
  const summary = summaryData ?? fallbackFarmSummary;
  const zones = Array.isArray(summary.zones)
    ? summary.zones.filter((zone) => zone.id === DEFAULT_ZONE_ID)
    : [];
  const stats = {
    ...(summary.stats ?? {}),
  };

  if (zones.length) {
    stats.activeZones = zones.some((zone) => zone.initialValveOn) ? 1 : 0;
    stats.soilMoisture = Math.round(zones.reduce((total, zone) => total + Number(zone.moisture ?? 0), 0) / zones.length);
  }

  return {
    ...summary,
    stats,
    zones,
  };
}

function resolveSingleZoneRules(rulesData) {
  const normalizedRules = normalizeList(rulesData, fallbackRules);
  const matchingRules = normalizedRules.filter((rule) => {
    const zoneId = rule.irrigationZone ?? rule.zoneId ?? rule.zone_id ?? DEFAULT_ZONE_ID;
    return zoneId === DEFAULT_ZONE_ID;
  });

  return matchingRules.length ? matchingRules : fallbackRules;
}

function getRuleDuration(rule) {
  return Number(rule?.irrigationDuration ?? rule?.duration ?? rule?.durationMinutes ?? 0) || 0;
}

function getRuleMinimumMoisture(rule) {
  return Number(rule?.minimumMoisture ?? rule?.minimum_moisture ?? 45) || 45;
}

function getRuleTimeRange(rule) {
  const startTime = rule?.startTime ?? rule?.time ?? '-';
  const endTime = rule?.endTime;
  return endTime ? `${startTime} - ${endTime}` : startTime;
}

function getRuleDaysLabel(rule) {
  const days = rule?.activeDays ?? rule?.selectedDays ?? [];
  if (!days.length) {
    return 'Belum ada hari aktif';
  }

  return days
    .map((dayId) => DAYS.find((day) => day.id === dayId)?.label)
    .filter(Boolean)
    .join(', ');
}

function getPrimaryRule(rules, control) {
  if (control?.activeAutomationRule) {
    return control.activeAutomationRule;
  }

  return rules.find(isRuleActive) ?? rules[0] ?? fallbackRules[0];
}

function buildIotUsage(control, primaryRule, readings, fallbackUsageData) {
  const duration = getRuleDuration(primaryRule);
  const flowPerMinute = control?.pumpOn ? 0.8 : 0;
  const fallbackTodayUsage = fallbackUsageData.todayUsage ?? fallbackUsageData.today_usage ?? 0;
  const todayUsage = control?.pumpOn ? Math.round(flowPerMinute * Math.max(duration, 1)) : 0;
  const activePumpReadings = readings.filter((reading) => reading.zoneId === DEFAULT_ZONE_ID && reading.pumpOn).length;
  const chart = readings
    .filter((reading) => reading.zoneId === DEFAULT_ZONE_ID)
    .slice(0, 7)
    .map((reading) => (reading.pumpOn ? Math.max(1, duration) : 0))
    .reverse();

  return {
    chart: chart.length ? chart : [0, 0, 0, 0, 0, 0, todayUsage || fallbackTodayUsage],
    currentFlow: flowPerMinute,
    monthlyUsage: activePumpReadings ? activePumpReadings * Math.max(duration, 1) * 0.8 : fallbackUsageData.monthlyUsage ?? fallbackUsageData.monthly_usage ?? 0,
    todayUsage: todayUsage || fallbackTodayUsage,
    weeklyUsage: activePumpReadings ? activePumpReadings * Math.max(duration, 1) * 0.8 : fallbackUsageData.weeklyUsage ?? fallbackUsageData.weekly_usage ?? 0,
  };
}

function buildIotHistory(readings) {
  return readings
    .filter((reading) => reading.zoneId === DEFAULT_ZONE_ID)
    .map((reading, index) => {
      const timestamp = reading.recordedAt ?? reading.receivedAt;
      const parsed = timestamp ? new Date(timestamp) : null;
      return {
        id: `${reading.deviceId ?? DEFAULT_ZONE_ID}-${timestamp ?? index}`,
        date: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('id-ID') : '-',
        duration: reading.pumpOn ? 15 : 0,
        moistureAfter: reading.soilMoisture,
        moistureBefore: reading.soilMoisture,
        rule: reading.pumpOn ? 'Kontrol IoT Aktif' : 'Pembacaan Sensor IoT',
        status: reading.pumpOn ? 'Pompa menyala' : 'Pompa mati',
        time: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        waterUsed: reading.pumpOn ? 12 : 0,
        zone: 'Lahan Tomat',
      };
    });
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function CardSection({ title, icon, children, action }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <MaterialCommunityIcons name={icon} size={20} color={globalStyles.colors.primaryGreen} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

function Field({ label, value, onChangeText, keyboardType = 'default', placeholder }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#8a948f"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function Chip({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={globalStyles.colors.primaryGreen} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function MiniBarChart({ values }) {
  const maxValue = Math.max(...values, 1);
  return (
    <View style={styles.chart}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.chartColumn}>
          <View style={[styles.chartBar, { height: `${Math.max(12, (value / maxValue) * 100)}%` }]} />
        </View>
      ))}
    </View>
  );
}

export default function AutomaticIrrigationScreen() {
  const [rules, setRules] = useState(fallbackRules);
  const [zones, setZones] = useState(fallbackZones);
  const [history, setHistory] = useState(fallbackHistory);
  const [farmSummary, setFarmSummary] = useState(fallbackFarmSummary);
  const [iotControl, setIotControl] = useState(fallbackIotControl);
  const [iotReadings, setIotReadings] = useState([]);
  const [tank, setTank] = useState(fallbackTank);
  const [usage, setUsage] = useState(fallbackUsage);
  const [ruleForm, setRuleForm] = useState(makeRuleForm());
  const [zoneForm, setZoneForm] = useState(makeZoneForm());
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const loadAutomation = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const [rulesResult, zonesResult, historyResult, tankResult, usageResult, summaryResult, readingsResult] = await Promise.allSettled([
        fetchAutomationRules(),
        fetchIrrigationZones(),
        fetchAutomationHistory(),
        fetchWaterTank(),
        fetchWaterUsage(),
        fetchFarmSummary(),
        fetchIotReadings(10),
      ]);

      const rulesData = rulesResult.status === 'fulfilled' ? rulesResult.value : fallbackRules;
      const zonesData = zonesResult.status === 'fulfilled' ? zonesResult.value : fallbackZones;
      const historyData = historyResult.status === 'fulfilled' ? historyResult.value : fallbackHistory;
      const tankData = tankResult.status === 'fulfilled' ? tankResult.value : fallbackTank;
      const usageData = usageResult.status === 'fulfilled' ? usageResult.value : fallbackUsage;
      const summaryData = summaryResult.status === 'fulfilled' ? summaryResult.value : fallbackFarmSummary;
      const readingsData = readingsResult.status === 'fulfilled' ? readingsResult.value : [];
      const nextZones = resolveSingleIotZone(zonesData);
      const nextSummary = resolveSingleFarmSummary(summaryData);
      const primaryIotZone = DEFAULT_ZONE_ID;
      const primaryDevice = nextZones.find((zone) => getZoneId(zone) === primaryIotZone)?.esp32Device ?? 'esp32-drip-01';
      let controlData = fallbackIotControl;

      try {
        controlData = await fetchIotControl({ deviceId: primaryDevice, zoneId: primaryIotZone });
      } catch {
        controlData = fallbackIotControl;
      }

      setZones(nextZones);
      setRules(resolveSingleZoneRules(rulesData));
      setHistory(normalizeList(historyData, fallbackHistory));
      setFarmSummary(nextSummary);
      setIotControl(controlData ?? fallbackIotControl);
      setIotReadings(normalizeList(readingsData, []));
      setTank({ ...fallbackTank, ...(tankData?.data ?? tankData ?? {}) });
      setUsage({ ...fallbackUsage, ...(usageData?.data ?? usageData ?? {}) });
      setRuleForm((current) => ({ ...current, irrigationZone: primaryIotZone }));

      if (rulesResult.status === 'rejected' || zonesResult.status === 'rejected' || historyResult.status === 'rejected') {
        setNotice('Sebagian endpoint otomatisasi belum tersedia. Data IoT lama tetap ditampilkan.');
      }
    } catch {
      setNotice('Data otomatisasi dan IoT belum bisa dimuat. Aplikasi memakai data lokal modul.');
      setRules(fallbackRules);
      setZones(fallbackZones);
      setHistory(fallbackHistory);
      setFarmSummary(fallbackFarmSummary);
      setIotControl(fallbackIotControl);
      setIotReadings([]);
      setTank(fallbackTank);
      setUsage(fallbackUsage);
      setRuleForm(makeRuleForm(DEFAULT_ZONE_ID));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAutomation();
  }, [loadAutomation]);

  const summary = useMemo(() => {
    const activeRules = rules.filter(isRuleActive).length;
    const todayKey = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].id;
    const scheduledToday = rules.filter((rule) => (rule.activeDays ?? rule.selectedDays ?? []).includes(todayKey)).length;
    const liveZones = farmSummary.zones ?? [];
    const averageMoisture =
      farmSummary.stats?.soilMoisture ??
      (liveZones.length
        ? Math.round(liveZones.reduce((total, zone) => total + Number(zone.moisture ?? 0), 0) / liveZones.length)
        : 0);
    const latestReading = iotReadings[0];
    const activeRule = getPrimaryRule(rules, iotControl);
    const liveTodayUsage = iotControl.pumpOn ? Math.round(Math.max(getRuleDuration(activeRule), 1) * 0.8) : 0;

    return {
      activeRules,
      averageMoisture,
      lastExecution: history[0] ? `${history[0].date} ${history[0].time}` : '-',
      lastIotUpdate: formatDateTime(latestReading?.receivedAt ?? latestReading?.recordedAt ?? farmSummary.lastUpdated),
      pumpStatus: iotControl.pumpOn ? 'Pompa menyala' : 'Pompa mati',
      scheduledToday,
      todayUsage: `${liveTodayUsage} L`,
      totalRules: rules.length,
    };
  }, [farmSummary, history, iotControl, iotReadings, rules]);

  const recommendation = useMemo(() => {
    const currentTankLevel = farmSummary.stats?.waterTank ?? tank.waterLevel ?? tank.water_level ?? 0;
    if (currentTankLevel < 20) {
      return 'Tangki air berada di bawah 20%. Isi ulang sebelum irigasi otomatis berjalan.';
    }
    const liveMoisture = farmSummary.stats?.soilMoisture;
    if (typeof liveMoisture === 'number' && liveMoisture < 45) {
      return 'Kelembapan tanah dari IoT berada di bawah batas. Durasi penyiraman yang disarankan adalah 15 menit.';
    }
    const activeRule = rules.find(isRuleActive);
    if (!activeRule) {
      return 'Tidak perlu penyiraman.';
    }
    const minMoisture = getRuleMinimumMoisture(activeRule);
    if (minMoisture >= 45) {
      return 'Kelembapan tanah berada di bawah batas. Durasi penyiraman yang disarankan adalah 15 menit.';
    }
    return 'Tidak perlu penyiraman.';
  }, [farmSummary, rules, tank]);

  const updateRuleForm = (field, value) => {
    setRuleForm((current) => ({ ...current, [field]: value }));
  };

  const updateZoneForm = (field, value) => {
    setZoneForm((current) => ({ ...current, [field]: value }));
  };

  const resetRuleForm = () => {
    setEditingRuleId(null);
    setRuleForm(makeRuleForm(getZoneId(zones[0]) ?? DEFAULT_ZONE_ID));
  };

  const resetZoneForm = () => {
    setEditingZoneId(null);
    setZoneForm({
      esp32Device: fallbackZones[0].esp32Device,
      pump: fallbackZones[0].pump,
      relay: fallbackZones[0].relay,
      soilMoistureSensor: fallbackZones[0].soilMoistureSensor,
      status: fallbackZones[0].status,
      zoneName: fallbackZones[0].zoneName,
    });
  };

  const saveRule = async () => {
    if (!ruleForm.ruleName.trim()) {
      Alert.alert('Nama aturan wajib diisi.');
      return;
    }

    const payload = { ...ruleForm, irrigationZone: DEFAULT_ZONE_ID };
    const localRule = {
      ...payload,
      id: editingRuleId ?? `rule-${Date.now()}`,
    };

    try {
      const savedRule = editingRuleId
        ? await updateAutomationRule(editingRuleId, payload)
        : await createAutomationRule(payload);
      const nextRule = savedRule?.data ?? savedRule ?? localRule;
      setRules((current) =>
        editingRuleId
          ? current.map((item) => (getRuleId(item) === editingRuleId ? nextRule : item))
          : [nextRule, ...current],
      );
    } catch {
      setRules((current) =>
        editingRuleId
          ? current.map((item) => (getRuleId(item) === editingRuleId ? localRule : item))
          : [localRule, ...current],
      );
      setNotice('Aturan disimpan lokal karena endpoint otomatisasi belum tersedia.');
    }

    resetRuleForm();
  };

  const editRule = (rule) => {
    setEditingRuleId(getRuleId(rule));
    setRuleForm({
      ...makeRuleForm(getZoneId(zones[0]) ?? DEFAULT_ZONE_ID),
      ...rule,
      activeDays: rule.activeDays ?? rule.selectedDays ?? [],
      irrigationZone: rule.irrigationZone ?? rule.zoneId ?? DEFAULT_ZONE_ID,
      maximumMoisture: String(rule.maximumMoisture ?? rule.maximum_moisture ?? '70'),
      minimumMoisture: String(rule.minimumMoisture ?? rule.minimum_moisture ?? '45'),
      ruleName: getRuleName(rule),
      status: isRuleActive(rule),
    });
  };

  const removeRule = async (ruleId) => {
    try {
      await deleteAutomationRule(ruleId);
    } catch {
      setNotice('Aturan dihapus lokal karena endpoint otomatisasi belum tersedia.');
    }
    setRules((current) => current.filter((item) => getRuleId(item) !== ruleId));
  };

  const toggleRule = async (rule) => {
    const ruleId = getRuleId(rule);
    const nextRule = { ...rule, status: !isRuleActive(rule), isEnabled: !isRuleActive(rule) };
    setRules((current) => current.map((item) => (getRuleId(item) === ruleId ? nextRule : item)));
    try {
      await updateAutomationRule(ruleId, nextRule);
    } catch {
      setNotice('Status aturan diperbarui lokal karena endpoint otomatisasi belum tersedia.');
    }
  };

  const saveZone = async () => {
    if (!zoneForm.zoneName.trim()) {
      Alert.alert('Nama zona wajib diisi.');
      return;
    }

    const singleZoneId = editingZoneId ?? DEFAULT_ZONE_ID;
    const localZone = {
      ...zoneForm,
      id: singleZoneId,
    };

    try {
      const savedZone = await updateIrrigationZone(singleZoneId, zoneForm);
      const nextZone = savedZone?.data ?? savedZone ?? localZone;
      setZones((current) =>
        current.map((item) => (getZoneId(item) === singleZoneId ? nextZone : item)),
      );
    } catch {
      setZones((current) =>
        current.map((item) => (getZoneId(item) === singleZoneId ? localZone : item)),
      );
      setNotice('Zona Lahan Tomat disimpan lokal karena endpoint otomatisasi belum tersedia.');
    }

    setEditingZoneId(singleZoneId);
  };

  const editZone = (zone) => {
    setEditingZoneId(getZoneId(zone));
    setZoneForm({
      esp32Device: zone.esp32Device ?? zone.esp32_device ?? '',
      pump: zone.pump ?? '',
      relay: zone.relay ?? '',
      soilMoistureSensor: zone.soilMoistureSensor ?? zone.soil_moisture_sensor ?? '',
      status: getStatusLabel(zone.status ?? 'Aktif'),
      zoneName: getZoneName(zone),
    });
  };

  const toggleDay = (dayId) => {
    setRuleForm((current) => {
      const hasDay = current.activeDays.includes(dayId);
      return {
        ...current,
        activeDays: hasDay
          ? current.activeDays.filter((item) => item !== dayId)
          : [...current.activeDays, dayId],
      };
    });
  };

  const modeNeedsMoisture = ruleForm.mode === 'Soil Moisture' || ruleForm.mode === 'Hybrid';
  const modeNeedsSchedule = ruleForm.mode === 'Schedule' || ruleForm.mode === 'Hybrid';
  const tankLevel = tank.waterLevel ?? tank.water_level ?? 0;
  const liveIotZones = buildIotZones(farmSummary.zones ?? [], zones);
  const primaryRule = getPrimaryRule(rules, iotControl);
  const liveMoisture = farmSummary.stats?.soilMoisture ?? liveIotZones[0]?.moisture ?? 0;
  const iotUsage = buildIotUsage(iotControl, primaryRule, iotReadings, usage);
  const chartValues = iotUsage.chart;
  const iotHistory = buildIotHistory(iotReadings);
  const displayedHistory = iotHistory.length ? iotHistory : history.filter((item) => item.zone === 'Lahan Tomat');
  const iotTankLevel = farmSummary.stats?.waterTank ?? tankLevel;
  const iotTankStatus = iotTankLevel < 20 ? 'Kritis' : iotTankLevel < 50 ? 'Perhatian' : 'Normal';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.titleLeft}>
            <MaterialCommunityIcons name="water-pump" size={24} color={globalStyles.colors.primaryGreen} />
            <Text style={styles.screenTitle}>Irigasi Otomatis</Text>
          </View>
          {isLoading ? <ActivityIndicator color={globalStyles.colors.primaryGreen} /> : null}
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.metricsGrid}>
          <MetricCard icon="playlist-check" label="Total Aturan Otomatisasi" value={summary.totalRules} />
          <MetricCard icon="toggle-switch" label="Aturan Aktif" value={summary.activeRules} />
          <MetricCard icon="calendar-today" label="Terjadwal Hari Ini" value={summary.scheduledToday} />
          <MetricCard icon="water-pump" label="Status Otomatisasi Pompa" value={summary.pumpStatus} />
          <MetricCard icon="water-percent" label="Rata-rata Kelembapan Tanah" value={`${summary.averageMoisture}%`} />
          <MetricCard icon="cup-water" label="Penggunaan Air Hari Ini" value={summary.todayUsage} />
        </View>

        <CardSection icon="clock-check-outline" title="Eksekusi Otomatisasi Terakhir">
          <Text style={styles.largeValue}>{summary.lastExecution}</Text>
        </CardSection>

        <CardSection icon="access-point-check" title="Data IoT Saat Ini">
          <View style={styles.iotStatusRow}>
            <View style={styles.iotStatusItem}>
              <Text style={styles.iotStatusLabel}>Status Pompa</Text>
              <Text style={styles.iotStatusValue}>{summary.pumpStatus}</Text>
            </View>
            <View style={styles.iotStatusItem}>
              <Text style={styles.iotStatusLabel}>Sumber Kontrol</Text>
              <Text style={styles.iotStatusValue}>{getControlSourceLabel(iotControl.controlSource)}</Text>
            </View>
          </View>
          <Text style={styles.bodyText}>Update IoT terakhir: {summary.lastIotUpdate}</Text>
          {iotControl.activeAutomationRule ? (
            <Text style={styles.bodyText}>
              Aturan aktif: {getRuleName(iotControl.activeAutomationRule)}
            </Text>
          ) : null}
          {iotControl.activeSchedule ? (
            <Text style={styles.bodyText}>
              Jadwal aktif: {iotControl.activeSchedule.name}
            </Text>
          ) : null}

          {liveIotZones.map((zone) => (
            <View key={zone.id} style={styles.iotZoneCard}>
              <View style={styles.iotZoneHeader}>
                <Text style={styles.listTitle}>{zone.name}</Text>
                <Text style={styles.statusText}>{getStatusLabel(zone.status)}</Text>
              </View>
              <View style={styles.iotMetricRow}>
                <View style={styles.iotMetricItem}>
                  <Text style={styles.iotMetricLabel}>Kelembapan</Text>
                  <Text style={styles.iotMetricValue}>{zone.moisture ?? 0}%</Text>
                </View>
                <View style={styles.iotMetricItem}>
                  <Text style={styles.iotMetricLabel}>Suhu</Text>
                  <Text style={styles.iotMetricValue}>{zone.temperature ?? 0} C</Text>
                </View>
                <View style={styles.iotMetricItem}>
                  <Text style={styles.iotMetricLabel}>Udara</Text>
                  <Text style={styles.iotMetricValue}>{zone.airHumidity ?? 0}%</Text>
                </View>
              </View>
              <Text style={styles.listSubtitle}>
                {zone.device} - {zone.relay} - {zone.pump} - Pompa {zone.pumpOn ? 'menyala' : 'mati'}
              </Text>
            </View>
          ))}
        </CardSection>

        <CardSection
          action={
            <Pressable onPress={resetRuleForm} style={styles.smallAction}>
              <Text style={styles.smallActionText}>Tambah Aturan</Text>
            </Pressable>
          }
          icon="playlist-plus"
          title="Aturan Otomatisasi">
          <Field label="Nama Aturan" onChangeText={(value) => updateRuleForm('ruleName', value)} value={ruleForm.ruleName} />

          <Text style={styles.fieldLabel}>Zona Irigasi</Text>
          <View style={styles.chipRow}>
            {zones.map((zone) => {
              const zoneId = getZoneId(zone);
              return (
                <Chip
                  active={ruleForm.irrigationZone === zoneId}
                  key={zoneId}
                  label={getZoneName(zone)}
                  onPress={() => updateRuleForm('irrigationZone', zoneId)}
                />
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Mode</Text>
          <View style={styles.chipRow}>
            {MODES.map((mode) => (
              <Chip
                active={ruleForm.mode === mode.value}
                key={mode.value}
                label={mode.label}
                onPress={() => updateRuleForm('mode', mode.value)}
              />
            ))}
          </View>

          {modeNeedsMoisture ? (
            <View style={styles.twoColumns}>
              <Field
                keyboardType="numeric"
                label="Kelembapan Minimum"
                onChangeText={(value) => updateRuleForm('minimumMoisture', value)}
                value={ruleForm.minimumMoisture}
              />
              <Field
                keyboardType="numeric"
                label="Kelembapan Maksimum"
                onChangeText={(value) => updateRuleForm('maximumMoisture', value)}
                value={ruleForm.maximumMoisture}
              />
            </View>
          ) : null}

          {modeNeedsSchedule ? (
            <>
              <View style={styles.twoColumns}>
                <Field label="Waktu Mulai" onChangeText={(value) => updateRuleForm('startTime', value)} value={ruleForm.startTime} />
                <Field label="Waktu Selesai" onChangeText={(value) => updateRuleForm('endTime', value)} value={ruleForm.endTime} />
              </View>
              <Text style={styles.fieldLabel}>Hari Aktif</Text>
              <View style={styles.dayRow}>
                {DAYS.map((day) => (
                  <Pressable
                    key={day.id}
                    onPress={() => toggleDay(day.id)}
                    style={[styles.dayButton, ruleForm.activeDays.includes(day.id) && styles.dayButtonActive]}>
                    <Text style={[styles.dayText, ruleForm.activeDays.includes(day.id) && styles.dayTextActive]}>
                      {day.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.twoColumns}>
            <Field
              keyboardType="numeric"
              label="Durasi Irigasi"
              onChangeText={(value) => updateRuleForm('irrigationDuration', value)}
              value={ruleForm.irrigationDuration}
            />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Prioritas</Text>
              <View style={styles.chipRow}>
                {PRIORITIES.map((priority) => (
                  <Chip
                    active={ruleForm.priority === priority.value}
                    key={priority.value}
                    label={priority.label}
                    onPress={() => updateRuleForm('priority', priority.value)}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Status</Text>
            <Switch
              onValueChange={(value) => updateRuleForm('status', value)}
              thumbColor={getSwitchColors(ruleForm.status).thumbColor}
              trackColor={getSwitchColors(ruleForm.status).trackColor}
              value={ruleForm.status}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={resetRuleForm} style={[styles.formButton, styles.cancelButton]}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable onPress={saveRule} style={[styles.formButton, styles.saveButton]}>
              <Text style={styles.saveText}>Simpan</Text>
            </Pressable>
          </View>
        </CardSection>

        <CardSection icon="format-list-bulleted" title="Manajemen Aturan">
          {rules.map((rule) => {
            const ruleId = getRuleId(rule);
            return (
              <View key={ruleId} style={styles.listItem}>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{getRuleName(rule)}</Text>
                  <Text style={styles.listSubtitle}>
                    {getModeLabel(rule.mode)} - {rule.irrigationDuration ?? rule.duration ?? 0} menit
                  </Text>
                </View>
                <Switch
                  onValueChange={() => toggleRule(rule)}
                  thumbColor={getSwitchColors(isRuleActive(rule)).thumbColor}
                  trackColor={getSwitchColors(isRuleActive(rule)).trackColor}
                  value={isRuleActive(rule)}
                />
                <Pressable onPress={() => editRule(rule)} style={styles.iconButton}>
                  <MaterialCommunityIcons name="pencil" size={18} color={globalStyles.colors.primaryGreenDark} />
                </Pressable>
                <Pressable onPress={() => removeRule(ruleId)} style={styles.iconButton}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#c2410c" />
                </Pressable>
              </View>
            );
          })}
        </CardSection>

        <CardSection
          icon="map-marker-radius-outline"
          title="Manajemen Zona Lahan Tomat">
          <Field label="Nama Zona" onChangeText={(value) => updateZoneForm('zoneName', value)} value={zoneForm.zoneName} />
          <Field label="Perangkat ESP32" onChangeText={(value) => updateZoneForm('esp32Device', value)} value={zoneForm.esp32Device} />
          <View style={styles.twoColumns}>
            <Field label="Relay" onChangeText={(value) => updateZoneForm('relay', value)} value={zoneForm.relay} />
            <Field label="Pompa" onChangeText={(value) => updateZoneForm('pump', value)} value={zoneForm.pump} />
          </View>
          <Field
            label="Sensor Kelembapan Tanah"
            onChangeText={(value) => updateZoneForm('soilMoistureSensor', value)}
            value={zoneForm.soilMoistureSensor}
          />
          <Field label="Status" onChangeText={(value) => updateZoneForm('status', value)} value={zoneForm.status} />
          <View style={styles.actionRow}>
            <Pressable onPress={resetZoneForm} style={[styles.formButton, styles.cancelButton]}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable onPress={saveZone} style={[styles.formButton, styles.saveButton]}>
              <Text style={styles.saveText}>Simpan</Text>
            </Pressable>
          </View>
          {zones.map((zone) => {
            const zoneId = getZoneId(zone);
            return (
              <View key={zoneId} style={styles.listItem}>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{getZoneName(zone)}</Text>
                  <Text style={styles.listSubtitle}>
                    {zone.esp32Device ?? zone.esp32_device} - {zone.relay} - {getStatusLabel(zone.status)}
                  </Text>
                </View>
                <Pressable onPress={() => editZone(zone)} style={styles.iconButton}>
                  <MaterialCommunityIcons name="pencil" size={18} color={globalStyles.colors.primaryGreenDark} />
                </Pressable>
              </View>
            );
          })}
        </CardSection>

        <CardSection icon="calendar-clock" title="Jadwal Otomatis">
          <Text style={styles.largeValue}>{getRuleTimeRange(primaryRule)}</Text>
          <Text style={styles.bodyText}>
            {getRuleDuration(primaryRule)} menit - {getRuleDaysLabel(primaryRule)}
          </Text>
          <Text style={styles.bodyText}>
            Zona: Lahan Tomat - Status pompa IoT: {iotControl.pumpOn ? 'menyala' : 'mati'}
          </Text>
        </CardSection>

        <CardSection icon="source-branch" title="Otomatisasi Hybrid">
          <Text style={styles.bodyText}>
            Mode aktif: {getModeLabel(primaryRule?.mode)}. Kelembapan IoT Lahan Tomat saat ini {liveMoisture}%.
          </Text>
          <Text style={styles.bodyText}>
            Pompa menyala hanya saat aturan Lahan Tomat sesuai dan kelembapan tanah berada di bawah batas {getRuleMinimumMoisture(primaryRule)}%.
          </Text>
        </CardSection>

        <CardSection icon="cup-water" title="Monitoring Tangki Air">
          <View style={styles.tankRow}>
            <Text style={styles.tankValue}>{iotTankLevel}%</Text>
            <View style={styles.tankTrack}>
              <View style={[styles.tankFill, { width: `${Math.min(100, Math.max(0, iotTankLevel))}%` }]} />
            </View>
          </View>
          <Text style={styles.bodyText}>Estimasi Liter: {Math.round(iotTankLevel * 4.1)} L</Text>
          <Text style={styles.bodyText}>Status: {iotTankStatus}</Text>
          <Text style={styles.bodyText}>Pembaruan Terakhir: {summary.lastIotUpdate}</Text>
          {iotTankLevel < 20 ? <Text style={styles.warningText}>Peringatan: level air di bawah 20%.</Text> : null}
        </CardSection>

        <CardSection icon="chart-bar" title="Penggunaan Air">
          <View style={styles.metricsGrid}>
            <MetricCard icon="waves" label="Aliran Saat Ini" value={`${iotUsage.currentFlow} L/m`} />
            <MetricCard icon="water" label="Penggunaan Hari Ini" value={`${iotUsage.todayUsage} L`} />
            <MetricCard icon="calendar-week" label="Penggunaan Mingguan" value={`${Math.round(iotUsage.weeklyUsage)} L`} />
            <MetricCard icon="calendar-month" label="Penggunaan Bulanan" value={`${Math.round(iotUsage.monthlyUsage)} L`} />
          </View>
          <MiniBarChart values={chartValues} />
        </CardSection>

        <CardSection icon="history" title="Riwayat Irigasi">
          {displayedHistory.map((item) => (
            <View key={item.id ?? `${item.date}-${item.time}`} style={styles.historyItem}>
              <Text style={styles.listTitle}>{getRuleName({ ruleName: item.rule })}</Text>
              <Text style={styles.listSubtitle}>
                {item.date} {item.time} - {item.zone}
              </Text>
              <Text style={styles.listSubtitle}>
                Kelembapan {item.moistureBefore}% ke {item.moistureAfter}% - {item.duration} menit - {item.waterUsed} L
              </Text>
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
          ))}
        </CardSection>

        <CardSection icon="lightbulb-on-outline" title="Rekomendasi Pintar">
          <Text style={styles.bodyText}>{recommendation}</Text>
        </CardSection>

        <CardSection icon="bell-ring-outline" title="Notifikasi">
          <View style={styles.notificationRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={globalStyles.colors.warningOrange} />
            <Text style={styles.bodyText}>Tanah terlalu kering</Text>
          </View>
          <View style={styles.notificationRow}>
            <MaterialCommunityIcons name="water-alert-outline" size={18} color={globalStyles.colors.warningOrange} />
            <Text style={styles.bodyText}>Tangki air habis</Text>
          </View>
          <View style={styles.notificationRow}>
            <MaterialCommunityIcons name="access-point-off" size={18} color={globalStyles.colors.warningOrange} />
            <Text style={styles.bodyText}>Sensor offline</Text>
          </View>
          <View style={styles.notificationRow}>
            <MaterialCommunityIcons name="electric-switch" size={18} color={globalStyles.colors.warningOrange} />
            <Text style={styles.bodyText}>Relay gagal</Text>
          </View>
          <View style={styles.notificationRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={globalStyles.colors.primaryGreen} />
            <Text style={styles.bodyText}>Penyiraman selesai</Text>
          </View>
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
  content: {
    gap: 12,
    padding: 12,
    paddingBottom: 88,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
  },
  titleLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  screenTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0,
  },
  notice: {
    color: '#5b655f',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 104,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  metricIcon: {
    alignItems: 'center',
    backgroundColor: '#F1F8F2',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    marginBottom: 8,
    width: 32,
  },
  metricLabel: {
    color: '#5b655f',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  metricValue: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    gap: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitleWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  cardTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '800',
  },
  smallAction: {
    backgroundColor: '#F1F8F2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallActionText: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 12,
    fontWeight: '800',
  },
  largeValue: {
    color: '#111111',
    fontSize: 21,
    fontWeight: '800',
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#F7F8F6',
    borderColor: '#E3E3E3',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderColor: '#D7D7D7',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: globalStyles.colors.primaryGreen,
    borderColor: globalStyles.colors.primaryGreen,
  },
  chipText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  dayButton: {
    alignItems: 'center',
    borderColor: '#D7D7D7',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 45,
  },
  dayButtonActive: {
    backgroundColor: globalStyles.colors.primaryBlue,
    borderColor: globalStyles.colors.primaryBlue,
  },
  dayText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '800',
  },
  dayTextActive: {
    color: '#ffffff',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    minHeight: 45,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: globalStyles.colors.primaryGreen,
  },
  cancelButton: {
    backgroundColor: '#F7F8F6',
    borderColor: '#D7D7D7',
    borderWidth: 1,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '800',
  },
  listItem: {
    alignItems: 'center',
    borderTopColor: '#E7E7E7',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
  },
  listText: {
    flex: 1,
  },
  listTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '800',
  },
  listSubtitle: {
    color: '#5b655f',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#F7F8F6',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  bodyText: {
    color: '#4b554f',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  iotStatusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iotStatusItem: {
    backgroundColor: '#F7F8F6',
    borderRadius: 8,
    flex: 1,
    padding: 10,
  },
  iotStatusLabel: {
    color: '#5b655f',
    fontSize: 12,
    fontWeight: '700',
  },
  iotStatusValue: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  iotZoneCard: {
    borderTopColor: '#E7E7E7',
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 10,
  },
  iotZoneHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iotMetricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iotMetricItem: {
    backgroundColor: '#F7F8F6',
    borderRadius: 8,
    flex: 1,
    padding: 9,
  },
  iotMetricLabel: {
    color: '#5b655f',
    fontSize: 11,
    fontWeight: '700',
  },
  iotMetricValue: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },
  tankRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  tankValue: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 28,
    fontWeight: '800',
  },
  tankTrack: {
    backgroundColor: '#E7E7E7',
    borderRadius: 8,
    flex: 1,
    height: 16,
    overflow: 'hidden',
  },
  tankFill: {
    backgroundColor: globalStyles.colors.primaryGreen,
    height: '100%',
  },
  warningText: {
    color: '#c2410c',
    fontSize: 13,
    fontWeight: '800',
  },
  chart: {
    alignItems: 'flex-end',
    backgroundColor: '#F7F8F6',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    height: 130,
    padding: 12,
  },
  chartColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 6,
    width: '100%',
  },
  historyItem: {
    borderTopColor: '#E7E7E7',
    borderTopWidth: 1,
    gap: 2,
    paddingTop: 10,
  },
  statusText: {
    color: globalStyles.colors.primaryGreenDark,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  notificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
