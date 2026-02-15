import { requireNativeModule } from 'expo-modules-core';

type AuthorizationStatus = 'notDetermined' | 'denied' | 'approved' | 'unknown';

export type SerializedSelection = {
  data: string;
  applicationsCount: number;
  categoriesCount: number;
  webDomainsCount: number;
};

export type AppliedShieldResult = {
  appsCount: number;
  categoriesCount: number;
  webDomainsCount: number;
};

export type BlockState = {
  eveningStart: string;
  eveningEnd: string;
  dailyResetTime: string;
  dailyEnabled?: boolean;
  eveningEnabled?: boolean;
  eveningOverrideWindowSeconds?: number;
  eveningOverrideUntil: number;
  dailyUnlockedUntil?: number;
  isEveningWindow: boolean;
  isOverrideActive: boolean;
  hasSelection: boolean;
  emergencyActive?: boolean;
  emergencyUntil?: number;
};

type ExpoFamilyControlsModule = {
  requestAuthorization(): Promise<AuthorizationStatus>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  openFamilyActivityPicker(): Promise<SerializedSelection>;
  getSavedSelection(): Promise<SerializedSelection | null>;
  openDailyPicker(): Promise<SerializedSelection>;
  getDailySelection(): Promise<SerializedSelection | null>;
  openEveningPicker(): Promise<SerializedSelection>;
  getEveningSelection(): Promise<SerializedSelection | null>;
  getScheduleSettings(): Promise<{
    dailyEnabled: boolean;
    dailyResetTime: string;
    eveningEnabled: boolean;
    eveningStart: string;
    eveningEnd: string;
    eveningOverrideWindowSeconds: number;
  }>;
  setDailyEnabled(enabled: boolean): Promise<boolean>;
  setDailyResetTime(time: string): Promise<boolean>;
  setEveningEnabled(enabled: boolean): Promise<boolean>;
  setEveningSchedule(start: string, end: string): Promise<boolean>;
  setEveningOverrideWindowSeconds(seconds: number): Promise<boolean>;
  setDailyUnlockedUntil(timestamp: number): Promise<boolean>;
  getDailyUnlockedUntil(): Promise<number>;
  clearDailyUnlockedUntil(): Promise<boolean>;
  applyCurrentShieldsNow(): Promise<boolean>;
  applyShieldFromSavedSelection(): Promise<AppliedShieldResult>;
  clearShield(): Promise<boolean>;
  clearEveningOverride(): Promise<boolean>;
  getBlockState(): Promise<BlockState>;
  startEmergencyBlock(): Promise<boolean>;
  clearEmergencyBlock(): Promise<boolean>;
};

const ExpoFamilyControls = requireNativeModule<ExpoFamilyControlsModule>('ExpoFamilyControls');

export async function requestAuthorization(): Promise<AuthorizationStatus> {
  return ExpoFamilyControls.requestAuthorization();
}

export async function getAuthorizationStatus(): Promise<AuthorizationStatus> {
  return ExpoFamilyControls.getAuthorizationStatus();
}

export async function openFamilyActivityPicker(): Promise<SerializedSelection> {
  return ExpoFamilyControls.openFamilyActivityPicker();
}

export async function getSavedSelection(): Promise<SerializedSelection | null> {
  return ExpoFamilyControls.getSavedSelection();
}

export async function openDailyPicker(): Promise<SerializedSelection> {
  return ExpoFamilyControls.openDailyPicker();
}

export async function getDailySelection(): Promise<SerializedSelection | null> {
  return ExpoFamilyControls.getDailySelection();
}

export async function openEveningPicker(): Promise<SerializedSelection> {
  return ExpoFamilyControls.openEveningPicker();
}

export async function getEveningSelection(): Promise<SerializedSelection | null> {
  return ExpoFamilyControls.getEveningSelection();
}

export async function getScheduleSettings(): Promise<{
  dailyEnabled: boolean;
  dailyResetTime: string;
  eveningEnabled: boolean;
  eveningStart: string;
  eveningEnd: string;
  eveningOverrideWindowSeconds: number;
}> {
  return ExpoFamilyControls.getScheduleSettings();
}

export async function setDailyEnabled(enabled: boolean): Promise<boolean> {
  return ExpoFamilyControls.setDailyEnabled(enabled);
}

export async function setDailyResetTime(time: string): Promise<boolean> {
  return ExpoFamilyControls.setDailyResetTime(time);
}

export async function setEveningEnabled(enabled: boolean): Promise<boolean> {
  return ExpoFamilyControls.setEveningEnabled(enabled);
}

export async function setEveningSchedule(start: string, end: string): Promise<boolean> {
  return ExpoFamilyControls.setEveningSchedule(start, end);
}

export async function setEveningOverrideWindowSeconds(seconds: number): Promise<boolean> {
  return ExpoFamilyControls.setEveningOverrideWindowSeconds(seconds);
}

export async function setDailyUnlockedUntil(timestamp: number): Promise<boolean> {
  return ExpoFamilyControls.setDailyUnlockedUntil(timestamp);
}

export async function getDailyUnlockedUntil(): Promise<number> {
  return ExpoFamilyControls.getDailyUnlockedUntil();
}

export async function clearDailyUnlockedUntil(): Promise<boolean> {
  return ExpoFamilyControls.clearDailyUnlockedUntil();
}

export async function applyCurrentShieldsNow(): Promise<boolean> {
  return ExpoFamilyControls.applyCurrentShieldsNow();
}

export async function applyShieldFromSavedSelection(): Promise<AppliedShieldResult> {
  return ExpoFamilyControls.applyShieldFromSavedSelection();
}

export async function clearShield(): Promise<boolean> {
  return ExpoFamilyControls.clearShield();
}

export async function clearEveningOverride(): Promise<boolean> {
  return ExpoFamilyControls.clearEveningOverride();
}

export async function getBlockState(): Promise<BlockState> {
  return ExpoFamilyControls.getBlockState();
}

export async function startEmergencyBlock(): Promise<boolean> {
  return ExpoFamilyControls.startEmergencyBlock();
}

export async function clearEmergencyBlock(): Promise<boolean> {
  return ExpoFamilyControls.clearEmergencyBlock();
}

export type { AuthorizationStatus };
