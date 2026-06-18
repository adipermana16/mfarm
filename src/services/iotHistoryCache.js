import * as FileSystem from 'expo-file-system/legacy';

const IOT_HISTORY_CACHE_FILE_NAME = 'iot-history-cache.json';

function getIotHistoryCacheFileUri() {
  const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  return baseDirectory ? `${baseDirectory}${IOT_HISTORY_CACHE_FILE_NAME}` : null;
}

function getReadingTimestamp(reading) {
  return (
    reading?.timestamp ??
    reading?.recordedAt ??
    reading?.recorded_at ??
    reading?.createdAt ??
    reading?.updatedAt ??
    reading?.date ??
    reading?.tanggal ??
    reading?.waktuTanggal ??
    reading?.datetime ??
    reading?.dateTime ??
    reading?.time ??
    reading?.created_at ??
    reading?.updated_at ??
    null
  );
}

function getReadingCacheKey(reading, index) {
  const timestamp = getReadingTimestamp(reading);
  const time = reading?.waktu ?? reading?.jam ?? '';
  return reading?.id ?? reading?._id ?? (timestamp ? `${timestamp}-${time}` : null) ?? JSON.stringify(reading) ?? `reading-${index}`;
}

export function mergeIotReadings(...readingGroups) {
  const mergedReadings = [];
  const seenKeys = new Set();

  readingGroups.flat().forEach((reading, index) => {
    if (reading == null || typeof reading !== 'object') {
      return;
    }

    const key = getReadingCacheKey(reading, index);

    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    mergedReadings.push(reading);
  });

  return mergedReadings;
}

export async function readCachedIotReadings() {
  const fileUri = getIotHistoryCacheFileUri();

  if (!fileUri) {
    return [];
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      return [];
    }

    const content = await FileSystem.readAsStringAsync(fileUri);
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveIotReadingsToCache(readings) {
  const fileUri = getIotHistoryCacheFileUri();

  if (!fileUri) {
    return readings;
  }

  const cachedReadings = await readCachedIotReadings();
  const nextReadings = mergeIotReadings(cachedReadings, readings);
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(nextReadings));

  return nextReadings;
}
