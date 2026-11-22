import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, View } from 'react-native';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react-native';
import type { Category } from '../../domain/types';
import { BackButton } from '../../ui/BackButton';
import { Btn, Card, Copy, Page, color, row, wrap } from '../../ui/kit';

export type SentRequest = { id: string; organization: string; needs: Category[]; message: string };

export function RequestSent({ request, onView, onDone }: {
  request: SentRequest;
  onView: () => void;
  onDone: () => void;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    const animation = Animated.spring(progress, {
      toValue: 1,
      tension: 78,
      friction: 8,
      useNativeDriver: Platform.OS !== 'web',
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      if (reduced) progress.setValue(1);
      else animation.start();
    }).catch(() => { if (active) progress.setValue(1); });
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(`Request sent to ${request.organization}.`);
    return () => { active = false; animation.stop(); };
  }, [progress, request.organization]);

  return <Page title="Request sent" back={<BackButton label="Back to Community" onPress={onDone} />}>
    <View style={{ width: '100%', maxWidth: 460, alignSelf: 'center', gap: 16 }}>
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6, gap: 12 }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: color.pale, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{
            width: 64, height: 64, borderRadius: 32, backgroundColor: color.pine,
            alignItems: 'center', justifyContent: 'center', opacity: progress,
            transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) }],
          }}>
            <Check size={34} strokeWidth={3} color={color.paper} />
          </Animated.View>
        </View>
        <View accessibilityLiveRegion="polite">
          <Copy style={{ textAlign: 'center' }}>You can follow updates in Activity.</Copy>
        </View>
      </View>
      <Card>
        <View style={[row, { alignItems: 'flex-start' }]}>
          <LockKeyhole size={17} color={color.pine} />
          <View style={{ flex: 1, gap: 2 }}>
            <Copy kind="small" tint={color.muted}>Sent privately to</Copy>
            <Copy kind="strong">{request.organization}</Copy>
          </View>
        </View>
        {!!request.needs.length && <View style={[wrap, { columnGap: 6, rowGap: 6 }]}>
          {request.needs.map((need) => <View key={need} style={{ backgroundColor: color.pale, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 9 }}>
            <Copy kind="small" tint={color.pine}>{need === 'Other' ? 'Other help' : need}</Copy>
          </View>)}
        </View>}
        <View style={{ borderTopWidth: 1, borderColor: color.line, paddingTop: 10, gap: 3 }}>
          <Copy kind="small" tint={color.muted}>Your message</Copy>
          <Copy numberOfLines={5}>{request.message}</Copy>
        </View>
      </Card>
      <View style={{ gap: 8 }}>
        <Btn label="View request" icon={ArrowRight} stretch onPress={onView} />
        <Btn label="Done" secondary stretch onPress={onDone} />
      </View>
    </View>
  </Page>;
}
