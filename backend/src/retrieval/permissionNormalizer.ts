/**
 * Permission name and category normalization for the retrieval layer.
 *
 * Owns: readable label and candidate category token.
 * Does NOT own: risk assessment, expected/unusual judgment — those belong to Member 3.
 *
 * Category vocabulary is TO BE FINALIZED with Member 3.
 * Unmapped permissions return category: null — do not guess.
 */

import { RetrievedPermission } from '../types';

interface PermissionMapping {
  name: string;
  category: string | null;
}

// Prefix-based and exact-match mappings.
// Exact matches are checked first, then prefix matches.
const EXACT_MAPPINGS: Record<string, PermissionMapping> = {
  'android.permission.ACCESS_FINE_LOCATION': { name: 'Precise Location', category: 'location' },
  'android.permission.ACCESS_COARSE_LOCATION': { name: 'Approximate Location', category: 'location' },
  'android.permission.ACCESS_BACKGROUND_LOCATION': { name: 'Background Location', category: 'location' },
  'android.permission.READ_CONTACTS': { name: 'Read Contacts', category: 'contacts' },
  'android.permission.WRITE_CONTACTS': { name: 'Write Contacts', category: 'contacts' },
  'android.permission.GET_ACCOUNTS': { name: 'Account Access', category: 'contacts' },
  'android.permission.CAMERA': { name: 'Camera', category: 'camera' },
  'android.permission.RECORD_AUDIO': { name: 'Microphone', category: 'microphone' },
  'android.permission.READ_MEDIA_IMAGES': { name: 'Read Photos', category: 'photos' },
  'android.permission.READ_MEDIA_VIDEO': { name: 'Read Videos', category: 'photos' },
  'android.permission.READ_MEDIA_AUDIO': { name: 'Read Audio Files', category: 'files' },
  'android.permission.READ_EXTERNAL_STORAGE': { name: 'Read Storage', category: 'files' },
  'android.permission.WRITE_EXTERNAL_STORAGE': { name: 'Write Storage', category: 'files' },
  'android.permission.READ_SMS': { name: 'Read SMS', category: 'messages' },
  'android.permission.SEND_SMS': { name: 'Send SMS', category: 'messages' },
  'android.permission.RECEIVE_SMS': { name: 'Receive SMS', category: 'messages' },
  'android.permission.READ_CALL_LOG': { name: 'Read Call Log', category: 'phone' },
  'android.permission.CALL_PHONE': { name: 'Make Phone Calls', category: 'phone' },
  'android.permission.READ_PHONE_STATE': { name: 'Phone State Access', category: 'phone' },
  'android.permission.READ_PHONE_NUMBERS': { name: 'Phone Number Access', category: 'phone' },
  'android.permission.READ_CALENDAR': { name: 'Read Calendar', category: 'calendar' },
  'android.permission.WRITE_CALENDAR': { name: 'Write Calendar', category: 'calendar' },
  'android.permission.BLUETOOTH_SCAN': { name: 'Bluetooth Scan', category: 'nearby_devices' },
  'android.permission.BLUETOOTH_CONNECT': { name: 'Bluetooth Connect', category: 'nearby_devices' },
  'android.permission.UWB_RANGING': { name: 'Nearby Device Ranging', category: 'nearby_devices' },
  'android.permission.BODY_SENSORS': { name: 'Body Sensors', category: 'health_information' },
  'android.permission.ACTIVITY_RECOGNITION': { name: 'Physical Activity', category: 'health_information' },
};

/**
 * Convert a raw Android permission identifier into a readable label and
 * a candidate category token. Category is null when no mapping is found.
 *
 * A permission indicates the app requests or may request a capability.
 * It does NOT prove data collection or upload.
 */
export function normalizePermission(raw: string): RetrievedPermission {
  const trimmed = raw.trim();

  // Exact match first
  if (trimmed in EXACT_MAPPINGS) {
    return { raw: trimmed, ...EXACT_MAPPINGS[trimmed] };
  }

  // Produce a readable fallback from the identifier
  // e.g. "android.permission.USE_BIOMETRIC" → "Use Biometric"
  const parts = trimmed.split('.');
  const last = parts[parts.length - 1] ?? trimmed;
  const readable = last
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return { raw: trimmed, name: readable, category: null };
}

/**
 * Normalize an array of raw permission strings into RetrievedPermission objects.
 * Deduplicates by raw identifier.
 */
export function normalizePermissions(rawPermissions: string[]): RetrievedPermission[] {
  const seen = new Set<string>();
  const result: RetrievedPermission[] = [];

  for (const raw of rawPermissions) {
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    result.push(normalizePermission(raw));
  }

  return result;
}
