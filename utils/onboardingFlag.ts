import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOULD_SHOW_ONBOARDING_KEY = 'shouldShowOnboarding';

type Listener = (value: boolean | null) => void;

const listeners = new Set<Listener>();

export async function readShouldShowOnboardingFlag(): Promise<boolean | null> {
  try {
    const value = await AsyncStorage.getItem(SHOULD_SHOW_ONBOARDING_KEY);
    if (value === null) {
      return null;
    }
    return value === 'true';
  } catch (error) {
    console.error('[OnboardingFlag] Failed to read flag', error);
    return null;
  }
}

export async function setShouldShowOnboardingFlag(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SHOULD_SHOW_ONBOARDING_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.error('[OnboardingFlag] Failed to persist flag', error);
  } finally {
    notifyListeners(value);
  }
}

export async function clearShouldShowOnboardingFlag(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SHOULD_SHOW_ONBOARDING_KEY);
  } catch (error) {
    console.error('[OnboardingFlag] Failed to clear flag', error);
  } finally {
    notifyListeners(null);
  }
}

export function subscribeShouldShowOnboardingFlag(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(value: boolean | null) {
  listeners.forEach((listener) => {
    try {
      listener(value);
    } catch (error) {
      console.error('[OnboardingFlag] Listener failed', error);
    }
  });
}

export { SHOULD_SHOW_ONBOARDING_KEY };

