import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSchedule, fetchFarmSummary } from '@/src/services/api';
import { buttonStyles, controlStyles, globalStyles, sharedStyles } from '@/src/styles/globalStyles';

const days = [
  { label: 'Sn', value: 'mon' },
  { label: 'Sl', value: 'tue' },
  { label: 'Rb', value: 'wed' },
  { label: 'Km', value: 'thu' },
  { label: 'Jm', value: 'fri' },
  { label: 'Sb', value: 'sat' },
  { label: 'Mg', value: 'sun' },
];

const triggerOptions = [
  { label: 'Hanya Waktu', value: 'time_only' },
  { label: 'Jika Tanah < 45%', value: 'soil_below_45' },
  { label: 'Lewati Jika Hujan', value: 'skip_if_rain' },
];

function DropdownField({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <View style={styles.fieldGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.dropdownButton} onPress={() => setIsOpen((current) => !current)}>
        <Text style={styles.dropdownText}>{selectedOption?.label ?? 'Pilih opsi'}</Text>
        <MaterialCommunityIcons name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color="#3c6255" />
      </Pressable>

      {isOpen ? (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={[styles.dropdownItem, option.value === value && styles.dropdownItemActive]}>
              <Text style={[styles.dropdownItemText, option.value === value && styles.dropdownItemTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function AddScheduleScreen() {
  const router = useRouter();
  const [scheduleName, setScheduleName] = useState('Siram Pagi');
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedDays, setSelectedDays] = useState(['mon', 'wed', 'fri']);
  const [startTime, setStartTime] = useState('06:00');
  const [duration, setDuration] = useState(15);
  const [triggerLogic, setTriggerLogic] = useState('time_only');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoadingZones, setIsLoadingZones] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadZones() {
      try {
        setIsLoadingZones(true);
        setErrorMessage(null);
        const summary = await fetchFarmSummary();
        if (!isMounted) {
          return;
        }

        const nextZones = summary.zones.map((zone) => ({
          label: `${zone.name} - ${zone.crop}`,
          value: zone.id,
        }));

        setZones(nextZones);
        setSelectedZone((currentZone) => currentZone || nextZones[0]?.value || '');
      } catch {
        if (isMounted) {
          setErrorMessage('Daftar zona belum bisa dimuat dari backend.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingZones(false);
        }
      }
    }

    loadZones();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedZoneLabel = useMemo(
    () => zones.find((zone) => zone.value === selectedZone)?.label,
    [selectedZone, zones],
  );

  const toggleDay = (dayValue) => {
    setSelectedDays((currentDays) =>
      currentDays.includes(dayValue)
        ? currentDays.filter((value) => value !== dayValue)
        : [...currentDays, dayValue],
    );
  };

  const handleSave = async () => {
    if (!scheduleName.trim()) {
      setErrorMessage('Nama jadwal wajib diisi.');
      return;
    }

    if (selectedDays.length === 0) {
      setErrorMessage('Pilih minimal satu hari.');
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      setErrorMessage('Gunakan format JJ:MM untuk waktu mulai.');
      return;
    }

    if (!selectedZone) {
      setErrorMessage('Zona tujuan belum tersedia.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await createSchedule({
        duration,
        name: scheduleName.trim(),
        selectedDays,
        selectedZone,
        startTime,
        triggerLogic,
      });
      Alert.alert('Jadwal tersimpan', 'Jadwal irigasi baru sudah disimpan.');
      router.back();
    } catch {
      setErrorMessage('Jadwal belum bisa disimpan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>Tambah Jadwal Baru</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[sharedStyles.card, styles.card]}>
          <View style={styles.header}>
            <Text style={styles.title}>Atur Jadwal</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nama Jadwal</Text>
            <TextInput
              onChangeText={setScheduleName}
              placeholder="Contoh: Siram Pagi"
              placeholderTextColor="#767577"
              style={styles.input}
              value={scheduleName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Zona Tujuan</Text>
            {isLoadingZones ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color={globalStyles.colors.primaryGreen} />
                <Text style={styles.inlineLoadingText}>Memuat zona kebun...</Text>
              </View>
            ) : zones.length > 0 ? (
              <DropdownField label="" onChange={setSelectedZone} options={zones} value={selectedZone} />
            ) : (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>Belum ada zona yang tersedia.</Text>
              </View>
            )}
            {!isLoadingZones && selectedZoneLabel ? (
              <Text style={styles.helperText}>Terhubung ke backend: {selectedZoneLabel}</Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Hari</Text>
            <View style={styles.dayPicker}>
              {days.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    onPress={() => toggleDay(day.value)}
                    style={[
                      styles.dayButton,
                      controlStyles.dayCircle,
                      isSelected && controlStyles.selectedDayCircle,
                      isSelected && styles.dayButtonActive,
                    ]}>
                    <Text style={[styles.dayText, isSelected && controlStyles.selectedDayText]}>{day.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Waktu Mulai</Text>
            <View style={styles.timeRow}>
              <TextInput
                keyboardType="numbers-and-punctuation"
                onChangeText={setStartTime}
                placeholder="07:00"
                placeholderTextColor="#767577"
                style={[styles.input, styles.timeInput]}
                value={startTime}
              />
              <View style={[styles.input, styles.timeInput, styles.timePreview]}>
                <Text style={styles.timePreviewText}>{startTime} AM</Text>
              </View>
            </View>
          </View>

          <View style={styles.durationHeader}>
            <Text style={styles.label}>Durasi</Text>
            <Text style={styles.durationValue}>{duration} Menit</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Slider
              maximumTrackTintColor="#D7D7D7"
              maximumValue={60}
              minimumTrackTintColor={globalStyles.colors.primaryBlue}
              minimumValue={5}
              onValueChange={(value) => setDuration(Math.round(value / 5) * 5)}
              step={5}
              thumbTintColor={globalStyles.colors.primaryBlue}
              value={duration}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Opsi Pemicu</Text>
            <DropdownField label="" onChange={setTriggerLogic} options={triggerOptions} value={triggerLogic} />
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [
              buttonStyles.saveButton,
              styles.saveButton,
              (pressed || isSaving) && styles.saveButtonPressed,
            ]}>
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[buttonStyles.saveButtonText, styles.saveButtonText]}>Simpan Jadwal</Text>
            )}
          </Pressable>
        </View>
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
    minHeight: 70,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 36,
  },
  topTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 34,
  },
  header: {
    gap: 6,
  },
  title: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    gap: 18,
    marginBottom: 0,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '400',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#BDBDBD',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111111',
    fontSize: 18,
    fontWeight: '400',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  dropdownButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#BDBDBD',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  dropdownText: {
    color: '#111111',
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderColor: '#BDBDBD',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#F0F0F0',
  },
  dropdownItemText: {
    color: '#4b5a52',
    fontSize: 14,
    fontWeight: '400',
  },
  dropdownItemTextActive: {
    color: '#111111',
  },
  dayPicker: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  dayButton: {
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: globalStyles.colors.primaryBlue,
  },
  dayText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '400',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 14,
  },
  timeInput: {
    flex: 1,
    textAlign: 'center',
  },
  timePreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePreviewText: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '400',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  columnField: {
    flex: 1,
  },
  durationPill: {
    alignItems: 'center',
    backgroundColor: '#f8faf6',
    borderColor: '#dce5d8',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  durationText: {
    color: '#17251f',
    fontSize: 16,
    fontWeight: '900',
  },
  durationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationValue: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '400',
  },
  sliderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: '#fff1e8',
    borderColor: '#fed7aa',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    color: '#c2410c',
    fontSize: 13,
    fontWeight: '800',
  },
  helperText: {
    color: '#5b655f',
    fontSize: 12,
    fontWeight: '600',
  },
  inlineLoading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
  },
  inlineLoadingText: {
    color: '#5b655f',
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: globalStyles.colors.primaryGreen,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
    marginVertical: 0,
    minHeight: 46,
  },
  saveButtonPressed: {
    opacity: 0.86,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
});
