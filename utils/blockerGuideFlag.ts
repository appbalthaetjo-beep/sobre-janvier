import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hasSeenBlockerGuide';

export const hasSeenBlockerGuide = async (): Promise<boolean> =>
  (await AsyncStorage.getItem(KEY)) === 'true';

export const markBlockerGuideSeen = (): void => {
  AsyncStorage.setItem(KEY, 'true');
};
