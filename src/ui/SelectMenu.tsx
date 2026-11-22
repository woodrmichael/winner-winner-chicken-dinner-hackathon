import { useContext, useRef, useState, type ComponentRef } from 'react';
import { ChevronDown } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectionRow } from './SelectionRows';
import { TabActive } from './RetainedTab';
import { Copy, color, row } from './kit';

type Anchor = { x: number; y: number; width: number; height: number };
type Option<T> = { value: T; label: string };

const margin = 10;
const gap = 4;
const heightLimit = 300;
const optionHeight = 44;
const menuPadding = 6;

export function SelectMenu<T extends string | number | null>({
  label,
  value,
  options,
  onChange,
  align = 'end',
  appearance = 'plain',
}: {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  align?: 'start' | 'end';
  appearance?: 'plain' | 'pill';
}) {
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const active = useContext(TabActive);
  if (!active && anchor) setAnchor(null);
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const close = () => setAnchor(null);
  const selected = options.find((option) => option.value === value);

  function open() {
    trigger.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) setAnchor({ x, y, width, height });
    });
  }

  const placement = anchor && (() => {
    const leftBound = insets.left + margin;
    const rightBound = width - insets.right - margin;
    const menuWidth = Math.min(rightBound - leftBound, Math.max(210, anchor.width));
    const preferredLeft = align === 'start' ? anchor.x : anchor.x + anchor.width - menuWidth;
    const left = Math.max(leftBound, Math.min(preferredLeft, rightBound - menuWidth));
    const top = anchor.y + anchor.height + gap;
    const below = height - insets.bottom - margin - top;
    const above = anchor.y - gap - insets.top - margin;
    const desiredHeight = Math.min(
      heightLimit,
      options.length * Math.max(optionHeight, 22 * fontScale + 12) + menuPadding * 2,
    );
    const down = below >= desiredHeight || below >= above;
    return {
      left,
      width: menuWidth,
      ...(down ? { top } : { bottom: height - anchor.y + gap }),
      maxHeight: Math.max(0, Math.min(heightLimit, down ? below : above)),
    };
  })();

  return (
    <View ref={trigger} collapsable={false} style={styles.anchor}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected ? `${label}, ${selected.label}` : label}
        aria-expanded={Boolean(anchor)}
        onPress={open}
        style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.65 }]}
      >
        <View style={[styles.triggerContent, appearance === 'pill' && styles.pill]}>
          <Copy
            kind="strong"
            style={[styles.triggerLabel, appearance === 'pill' && styles.pillLabel]}
            tint={color.pine}
          >
            {selected?.label ?? label}
          </Copy>
          <ChevronDown color={color.pine} size={15} />
        </View>
      </Pressable>
      {active && placement && (
        <Modal transparent visible animationType="none" onRequestClose={close}>
          <View style={styles.layer} accessibilityViewIsModal>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Close ${label.toLowerCase()}`}
              style={StyleSheet.absoluteFill}
              onPress={close}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              accessibilityRole="radiogroup"
              accessibilityLabel={label}
              style={[styles.menu, placement]}
              contentContainerStyle={styles.options}
            >
              {options.map((option) => (
                <SelectionRow
                  key={option.value ?? 'all'}
                  label={option.label}
                  selected={value === option.value}
                  style={[styles.option, value === option.value && styles.selectedOption]}
                  onPress={() => {
                    close();
                    onChange(option.value);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: 'flex-start', flexShrink: 1, maxWidth: '100%' },
  trigger: { minHeight: 44, justifyContent: 'center' },
  triggerContent: { ...row, gap: 5 },
  triggerLabel: { flexShrink: 1, fontSize: 14 },
  pill: { backgroundColor: color.pale, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  pillLabel: { fontSize: 16 },
  layer: { flex: 1 },
  menu: {
    position: 'absolute',
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    borderRadius: 13,
    boxShadow: '0 6px 22px #17181A24',
  },
  options: { padding: menuPadding },
  option: {
    minHeight: optionHeight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 0,
    borderRadius: 8,
  },
  selectedOption: { backgroundColor: color.pale },
});
