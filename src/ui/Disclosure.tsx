import type { PropsWithChildren } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Copy, color, row } from './kit';

export function Disclosure({
  label,
  detail,
  expanded,
  onToggle,
  children,
}: PropsWithChildren<{
  label: string;
  detail?: string;
  expanded: boolean;
  onToggle: () => void;
}>) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={detail ? label + '. ' + detail : label}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [
          row,
          { minHeight: 44, paddingVertical: 4, opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Copy kind="strong">{label}</Copy>
          {detail && (
            <Copy kind="small" tint={color.muted} numberOfLines={2}>
              {detail}
            </Copy>
          )}
        </View>
        <Chevron size={19} color={color.pine} />
      </Pressable>
      {expanded && children}
    </View>
  );
}
