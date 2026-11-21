import { useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  Platform,
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
}: PropsWithChildren<{ kind?: keyof typeof type; tint?: string; style?: StyleProp<TextStyle> }>) {
  return <Text style={[type[kind], { color: tint }, style]}>{children}</Text>;
}
export function Page({
  children,
  title,
  right,
}: PropsWithChildren<{ title: string; right?: ReactNode }>) {
  const wide = useWindowDimensions().width >= 900;
  return (
    <ScrollView
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
          padding: wide ? 36 : 18,
          gap: 20,
          paddingBottom: 48,
        }}
      >
        <View style={[wrap, { justifyContent: 'space-between', columnGap: 18 }]}>
          <Text
            accessibilityRole="header"
            style={{
              color: color.ink,
              fontFamily: systemFont,
              fontWeight: '700',
              letterSpacing: -0.9,
              fontSize: wide ? 42 : 34,
              lineHeight: wide ? 52 : 42,
              flexShrink: 1,
            }}
          >
            {title}
          </Text>
          {wide && right}
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
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => unknown;
  icon?: LucideIcon;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function press() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await onPress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const fg = secondary ? color.pine : '#FFF';
  return (
    <View style={{ flexShrink: 1, maxWidth: '100%', gap: error ? 4 : 0 }}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || busy}
        accessibilityState={{ disabled: disabled || busy }}
        onPress={press}
        style={({ pressed }) => [
          row,
          {
            alignSelf: 'flex-start',
            maxWidth: '100%',
            justifyContent: 'center',
            minHeight: 44,
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: 13,
            borderWidth: 0,
            borderColor: secondary ? color.line : color.pine,
            backgroundColor: secondary ? color.pale : color.pine,
            opacity: disabled || busy || pressed ? 0.65 : 1,
          },
        ]}
      >
        {Icon && <Icon color={fg} size={17} />}
        <Copy kind="strong" tint={fg} style={{ fontSize: 14, flexShrink: 1 }}>
          {label}
        </Copy>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: color.rust }}>
          {error}
        </Text>
      ) : null}
    </View>
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
  value,
  change,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Copy kind="strong">{label}</Copy>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={color.muted}
        value={value}
        onChangeText={change}
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
