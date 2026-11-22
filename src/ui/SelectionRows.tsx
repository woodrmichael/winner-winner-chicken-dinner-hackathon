import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { Copy, color, row } from './kit';
import { tapFeedback } from './feedback';

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
        onValueChange={(checked) => { tapFeedback(); onChange(checked); }}
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
  style,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => { if (!selected) tapFeedback(); onPress(); }}
      style={({ pressed }) => [styles.row, style, pressed && { backgroundColor: color.bg }]}
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

export function CheckboxRow({ label, detail, checked, onChange }: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} aria-checked={checked}
      accessibilityLabel={`${label}, ${detail}`} onPress={() => { tapFeedback(); onChange(!checked); }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.bg }]}>
      <View style={{ width: 22, height: 22, borderRadius: 5, borderWidth: 1,
        borderColor: checked ? color.pine : color.muted, backgroundColor: checked ? color.pine : color.paper,
        alignItems: 'center', justifyContent: 'center' }}>
        {checked && <Check size={15} color={color.paper} />}
      </View>
      <Copy style={styles.label}>{label}</Copy>
      <Copy kind="small" tint={color.muted}>{detail}</Copy>
    </Pressable>
  );
}
