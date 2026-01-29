import { requireNativeModule } from 'expo-modules-core';

type AuthorizationStatus = 'notDetermined' | 'denied' | 'approved' | 'unknown';

export type SerializedSelection = {
  data: string;
  applicationsCount: number;
  categoriesCount: number;
  webDomainsCount: number;
};

type ExpoFamilyControlsModule = {
  requestAuthorization(): Promise<AuthorizationStatus>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  openFamilyActivityPicker(): Promise<SerializedSelection>;
  getSavedSelection(): Promise<SerializedSelection | null>;
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

export type { AuthorizationStatus };
