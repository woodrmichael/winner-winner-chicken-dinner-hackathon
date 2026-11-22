import { useRef, useState, type ComponentRef, type PropsWithChildren, type ReactNode, type Ref } from 'react';
import {
  Platform,
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { confirmFeedback, tapFeedback } from './feedback';

export const color = {
  bg: '#F5F5F7',
  paper: '#FFFFFF',
  ink: '#17181A',
  muted: '#5D636C',
  line: '#D8DBDE',
  pine: '#007767',
  pale: '#E3F3EE',
  gold: '#F1D791',
  sand: '#F4F5F8',
  rust: '#A33F30',
};
export const row: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 10 };
export const wrap: ViewStyle = { ...row, flexWrap: 'wrap' };
const systemFont = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  ios: 'System',
  android: 'sans-serif',
});
const type = {
  body: { fontSize: 15, lineHeight: 22, fontFamily: systemFont },
  small: { fontSize: 13, lineHeight: 19, fontFamily: systemFont },
  label: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: systemFont,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  strong: { fontSize: 16, lineHeight: 22, fontFamily: systemFont, fontWeight: '600' },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: systemFont,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
} satisfies Record<string, TextStyle>;
export function Copy({
  children,
  kind = 'body',
  tint = color.ink,
  style,
  numberOfLines,
}: PropsWithChildren<{
  kind?: keyof typeof type;
  tint?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}>) {
  return <Text numberOfLines={numberOfLines} style={[type[kind], { color: tint }, style]}>{children}</Text>;
}
export function Page({
  children,
  title,
  right,
  mobileRight,
  titleAccessory,
  back,
  scrollRef,
}: PropsWithChildren<{
  title: string;
  right?: ReactNode;
  mobileRight?: ReactNode;
  titleAccessory?: ReactNode;
  back?: ReactNode;
  scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
}>) {
  const wide = useWindowDimensions().width >= 900;
  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: color.bg }}
      contentContainerStyle={{ alignItems: 'center' }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 1150,
          paddingHorizontal: wide ? 36 : 18,
          paddingTop: wide ? 36 : 14,
          gap: wide ? 20 : 16,
          paddingBottom: wide ? 48 : 24,
        }}
      >
        <View style={[wide ? wrap : row, { justifyContent: 'space-between', columnGap: 10 }]}>
          <View style={[row, { flexShrink: 1, minWidth: 0, gap: 4 }]}>
            {back}
            <View style={[wrap, { flexShrink: 1, minWidth: 0, rowGap: 4, columnGap: wide ? 16 : 10 }]}>
              <Text
                accessibilityRole="header"
                style={{
                  color: color.ink,
                  fontFamily: systemFont,
                  fontWeight: '700',
                  letterSpacing: -0.9,
                  fontSize: wide ? 42 : 28,
                  lineHeight: wide ? 52 : 36,
                  flexShrink: 1,
                }}
              >
                {title}
              </Text>
              {titleAccessory}
            </View>
          </View>
          {wide && right}
          {!wide && mobileRight && (
            <View style={[row, { gap: 2, flexShrink: 0 }]}>
              {mobileRight}
            </View>
          )}
        </View>
        {!wide && right}
        {children}
      </View>
    </ScrollView>
  );
}
export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <View
      style={[
        {
          backgroundColor: color.paper,
          borderColor: color.line,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 18,
          padding: 17,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Btn({
  label,
  onPress,
  icon: Icon,
  iconOnly = false,
  fillIcon = false,
  secondary = false,
  quiet = false,
  stretch = false,
  disabled = false,
  celebrate = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => unknown;
  icon?: LucideIcon;
  iconOnly?: boolean;
  fillIcon?: boolean;
  secondary?: boolean;
  quiet?: boolean;
  stretch?: boolean;
  disabled?: boolean;
  celebrate?: boolean;
  accessibilityHint?: string;
}) {
  const lock = useRef(false);
  const [scale] = useState(() => celebrate ? new Animated.Value(1) : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function press() {
    if (lock.current) return;
    lock.current = true;
    tapFeedback();
    setBusy(true);
    setError('');
    try {
      await onPress();
      if (celebrate) {
        confirmFeedback();
        if (scale) void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
          if (reduced) return;
          const useNativeDriver = Platform.OS !== 'web';
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.04, duration: 110, useNativeDriver }),
            Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver }),
          ]).start();
        }).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const fg = secondary || quiet ? color.pine : '#FFF';
  const Wrapper = scale ? Animated.View : View;
  return (
    <Wrapper style={[{ flexShrink: 1, maxWidth: '100%', gap: error ? 4 : 0 },
      scale && { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={iconOnly ? label : undefined}
        accessibilityHint={accessibilityHint}
        disabled={disabled || busy}
        accessibilityState={{ disabled: disabled || busy }}
        onPress={press}
        style={({ pressed }) => [
          row,
          {
            alignSelf: stretch ? 'stretch' : 'flex-start',
            maxWidth: '100%',
            justifyContent: 'center',
            minHeight: 44,
            width: iconOnly ? 44 : undefined,
            paddingHorizontal: iconOnly || quiet ? 0 : 16,
            paddingVertical: iconOnly ? 0 : 9,
            borderRadius: iconOnly ? 10 : 13,
            borderWidth: 0,
            borderColor: secondary ? color.line : color.pine,
            backgroundColor: quiet ? 'transparent' : secondary ? color.pale : color.pine,
            opacity: disabled || busy || pressed ? 0.65 : 1,
          },
        ]}
      >
        {Icon && <Icon color={fg} fill={fillIcon ? fg : 'none'} size={iconOnly ? 20 : 17} />}
        {!iconOnly && (
          <Copy kind="strong" tint={fg} style={{ fontSize: 14, flexShrink: 1 }}>
            {label}
          </Copy>
        )}
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: color.rust }}>
          {error}
        </Text>
      ) : null}
    </Wrapper>
  );
}
export function ProgressBar({ value, total }: { value: number; total: number }) {
  const fraction = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  return (
    <View style={{ height: 7, borderRadius: 5, backgroundColor: color.pale }}>
      <View
        style={{
          height: 7,
          borderRadius: 5,
          backgroundColor: color.pine,
          width: `${fraction * 100}%`,
        }}
      />
    </View>
  );
}
export function Field({
  label,
  hideLabel = false,
  value,
  change,
  multiline = false,
  placeholder,
  secure = false,
  keyboardType,
  autoCapitalize,
  editable = true,
}: {
  label: string;
  hideLabel?: boolean;
  value: string;
  change: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'decimal-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      {!hideLabel && <Copy kind="strong">{label}</Copy>}
      <TextInput
        editable={editable}
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={color.muted}
        value={value}
        onChangeText={change}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize={secure ? 'none' : autoCapitalize}
        autoCorrect={secure || autoCapitalize === 'none' ? false : undefined}
        multiline={multiline}
        style={{
          color: color.ink,
          backgroundColor: color.bg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: color.line,
          borderRadius: 8,
          padding: 12,
          minHeight: multiline ? 88 : 44,
          fontFamily: systemFont,
          fontSize: 16,
          textAlignVertical: 'top',
        }}
      />
    </View>
  );
}
export function Columns({ main, side }: { main: ReactNode; side: ReactNode }) {
  const wide = useWindowDimensions().width >= 1024;
  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'stretch', gap: 20 }}>
      <View style={{ flex: wide ? 1.8 : undefined, minWidth: 0, gap: 16 }}>{main}</View>
      <View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: 16 }}>{side}</View>
    </View>
  );
}
