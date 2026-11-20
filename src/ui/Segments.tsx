import { Pressable, StyleSheet, View } from 'react-native';
import { Copy, color } from './kit';

export function Segments<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: (option: T) => string;
}) {
  return (
    <View
      style={{ flexDirection: 'row', backgroundColor: '#E9EAED', padding: 3, borderRadius: 13 }}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 3,
              borderRadius: 10,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: selected ? color.line : 'transparent',
              backgroundColor: selected ? color.paper : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Copy
              kind="small"
              style={{ fontWeight: selected ? '700' : '500', textAlign: 'center' }}
            >
              {label(option)}
            </Copy>
          </Pressable>
        );
      })}
    </View>
  );
}
