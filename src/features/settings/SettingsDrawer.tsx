import { useEffect, useMemo, useState } from 'react';
import { Animated, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Btn, Copy, color, row } from '../../ui/kit';
import { SettingsOptions } from './Settings';

export function SettingsEdge({ open }: { open: () => void }) {
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) => dx < -12 && Math.abs(dx) > Math.abs(dy) * 1.4,
    onPanResponderRelease: (_, { dx, dy }) => {
      if (dx < -38 && Math.abs(dx) > Math.abs(dy)) open();
    },
  }), [open]);

  return (
    <View
      {...responder.panHandlers}
      collapsable={false}
      aria-hidden
      importantForAccessibility="no"
      style={[styles.edge, Platform.OS === 'web' && webEdge]}
    />
  );
}

export function SettingsDrawer({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width - 24, 392);
  const [offset] = useState(() => new Animated.Value(panelWidth));
  useEffect(() => {
    const transition = Animated.timing(offset, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' });
    transition.start();
    return () => offset.stopAnimation();
  }, [offset]);

  return (
    <Modal transparent visible onRequestClose={onClose}>
      <View style={styles.modal} accessibilityViewIsModal>
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close settings"
          onPress={onClose}
        />
        <Animated.View style={[styles.panel, { width: panelWidth, transform: [{ translateX: offset }] }]}>
          <SafeAreaView style={styles.safePanel}>
            <View style={styles.header}>
              <View accessibilityRole="header"><Copy kind="title">Settings</Copy></View>
              <Btn label="Done" quiet onPress={onClose} />
            </View>
            <ScrollView
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              <SettingsOptions />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const webEdge = { position: 'absolute', touchAction: 'pan-y' } as ViewStyle;

const styles = StyleSheet.create({
  edge: { position: 'absolute', right: 0, top: 0, bottom: 56, width: 18 },
  modal: { flex: 1, overflow: 'hidden', alignItems: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: '#17181A55' },
  panel: { flex: 1, backgroundColor: color.bg, boxShadow: '0 0 24px #17181A30' },
  safePanel: { flex: 1 },
  header: { ...row, justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 9, backgroundColor: color.paper },
  content: { gap: 12, padding: 16 },
});
