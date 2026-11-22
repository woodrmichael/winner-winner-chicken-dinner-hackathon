import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Copy, color } from './kit';
import { tapFeedback } from './feedback';

export function Segments<T extends string>({
  options,
  value,
  onChange,
  label,
  accessibilityLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: (option: T) => string;
  accessibilityLabel?: string;
}) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale >= 1.3;
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#E9EAED',
        padding: 3,
        borderRadius: 13,
      }}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => {
              if (!selected) tapFeedback();
              onChange(option);
            }}
            style={({ pressed }) => ({
              flex: 1,
              flexBasis: stacked ? '40%' : 0,
              minHeight: 44,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 3,
              paddingVertical: 6,
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
