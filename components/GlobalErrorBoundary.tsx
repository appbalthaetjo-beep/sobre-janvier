import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_ERROR_STORAGE_KEY = 'debug:lastError';

export type CapturedErrorPayload = {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
};

export async function readLastCapturedError(): Promise<CapturedErrorPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ERROR_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CapturedErrorPayload;
    if (!parsed?.message) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error('[ERROR BOUNDARY] Failed to read stored error', error);
    return null;
  }
}

export async function clearLastCapturedError(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_ERROR_STORAGE_KEY);
  } catch (error) {
    console.error('[ERROR BOUNDARY] Failed to clear stored error', error);
  }
}

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
};

type State = {
  error: Error | null;
};

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ERROR BOUNDARY] Caught render error', error, info);
    void this.persistError(error, info);
    const message = error?.message ?? 'Erreur inconnue';
    try {
      Alert.alert('Erreur inattendue', message);
    } catch {
      // ignore alert failures
    }
  }

  private handleReset = () => {
    this.setState({ error: null }, () => {
      try {
        this.props.onReset?.();
      } catch (resetError) {
        console.error('[ERROR BOUNDARY] Reset handler failed', resetError);
      }
    });
  };

  private async persistError(error: Error, info: React.ErrorInfo) {
    try {
      const payload: CapturedErrorPayload = {
        message: error?.message ?? 'Unknown error',
        stack: error?.stack,
        componentStack: info?.componentStack,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(LAST_ERROR_STORAGE_KEY, JSON.stringify(payload));
    } catch (storageError) {
      console.error('[ERROR BOUNDARY] Failed to persist error payload', storageError);
    }
  }

  render() {
    if (this.state.error) {
      const message = this.state.error?.message ?? 'Une erreur imprevue est survenue.';
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Quelque chose a mal tourne</Text>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Reessayer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#d1d1d1',
    marginBottom: 24,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
