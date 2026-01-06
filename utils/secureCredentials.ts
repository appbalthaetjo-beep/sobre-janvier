import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'auth:credentials';

type StoredCredentials = {
  email: string;
  password: string;
};

async function isSecureStorageAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    if (__DEV__) {
      console.warn('[SecureCredentials] SecureStore availability check failed', error);
    }
    return false;
  }
}

export async function saveAuthCredentials(email: string, password: string): Promise<void> {
  const trimmedEmail = email?.trim();
  if (!trimmedEmail || !password) {
    return;
  }

  if (!(await isSecureStorageAvailable())) {
    if (__DEV__) {
      console.warn('[SecureCredentials] SecureStore unavailable, skip credentials persist');
    }
    return;
  }

  try {
    const payload: StoredCredentials = {
      email: trimmedEmail.toLowerCase(),
      password,
    };

    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(payload), {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.warn('[SecureCredentials] Failed to persist credentials', error);
  }
}

export async function readAuthCredentials(): Promise<StoredCredentials | null> {
  if (!(await isSecureStorageAvailable())) {
    return null;
  }

  try {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredCredentials>;
    if (typeof parsed?.email === 'string' && typeof parsed?.password === 'string') {
      return {
        email: parsed.email,
        password: parsed.password,
      };
    }

    return null;
  } catch (error) {
    console.warn('[SecureCredentials] Failed to read credentials', error);
    return null;
  }
}

export async function clearAuthCredentials(): Promise<void> {
  if (!(await isSecureStorageAvailable())) {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  } catch (error) {
    console.warn('[SecureCredentials] Failed to clear credentials', error);
  }
}
