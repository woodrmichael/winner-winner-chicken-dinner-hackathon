import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Copy, color, row } from './kit';

const styles = StyleSheet.create({
  row: {
    ...row,
    minHeight: 48,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  label: { flex: 1, minWidth: 0 },
});

export function ToggleRow({
  label,
  value,
  onChange,
  leading,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  leading?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      {leading}
      <Copy style={styles.label}>{label}</Copy>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.pine, false: color.line }}
      />
    </View>
  );
}

export function SelectionRow({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.bg }]}
    >
      <View style={styles.label}>
        <Copy kind={selected ? 'strong' : 'body'}>{label}</Copy>
        {detail && (
          <Copy kind="small" tint={color.muted}>
            {detail}
          </Copy>
        )}
      </View>
      {selected && <Check size={19} color={color.pine} />}
    </Pressable>
  );
}
