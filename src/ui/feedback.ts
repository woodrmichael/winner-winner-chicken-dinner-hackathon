import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function tapFeedback() {
  if (Platform.OS === 'android') {
    void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick).catch(() => {});
  } else if (Platform.OS === 'ios') {
    void Haptics.selectionAsync().catch(() => {});
  }
}

export function confirmFeedback() {
  if (Platform.OS === 'android') {
    void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
  } else if (Platform.OS === 'ios') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
}
