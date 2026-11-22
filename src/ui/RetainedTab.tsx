import { createContext, Suspense, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

export const TabActive = createContext(true);

// The layout renders these routes as retained siblings of its routed detail pages.
export function TabRoute() {
  return null;
}

export function RetainedTab({ active, param, fallback, children }: {
  active: boolean;
  param?: string;
  fallback: ReactNode;
  children: (param?: string) => ReactNode;
}) {
  const [visited, setVisited] = useState(active);
  const [lastParam, setLastParam] = useState(param);
  if (active && !visited) setVisited(true);
  if (active && param !== lastParam) setLastParam(param);
  if (!visited) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, !active && styles.hidden]}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      aria-hidden={!active}
    >
      <TabActive.Provider value={active}>
        <Suspense fallback={fallback}>{children(active ? param : lastParam)}</Suspense>
      </TabActive.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: Platform.OS === 'web' ? { visibility: 'hidden' } as ViewStyle : { opacity: 0 },
});
