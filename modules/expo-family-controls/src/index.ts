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

type ExpoFamilyControlsModule = {
  requestAuthorization(): Promise<AuthorizationStatus>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  openFamilyActivityPicker(): Promise<SerializedSelection>;
  getSavedSelection(): Promise<SerializedSelection | null>;
  applyShieldFromSavedSelection(): Promise<AppliedShieldResult>;
  clearShield(): Promise<boolean>;
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

export async function applyShieldFromSavedSelection(): Promise<AppliedShieldResult> {
  return ExpoFamilyControls.applyShieldFromSavedSelection();
}

export async function clearShield(): Promise<boolean> {
  return ExpoFamilyControls.clearShield();
}

export type { AuthorizationStatus };
