import { Slot, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ChartNoAxesColumnIncreasing,
  Map,
  MapPin,
  UsersRound,
} from 'lucide-react-native';
import { Keyboard, Platform, Pressable, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityScreen, Community, Impact, MapScreen, warmNavigation } from '../src/features/navigation/tabScreens';
import { warmPostPhotos } from '../src/features/community/postPhotos';
import { warmVenueMaps } from '../src/features/map/VenueMap';
import { SettingsDrawer, SettingsEdge } from '../src/features/settings/SettingsDrawer';
import { DemoProvider, useDemo } from '../src/state/Demo';
import { AppMark } from '../src/ui/AppMark';
import { tapFeedback } from '../src/ui/feedback';
import { RetainedTab } from '../src/ui/RetainedTab';
import { Card, Copy, Page, color, row } from '../src/ui/kit';

const tabs = [
  { name: 'Community', path: '/', icon: UsersRound },
  { name: 'Map', path: '/map', icon: Map },
  { name: 'Activity', path: '/activity', icon: Activity },
  { name: 'Impact', path: '/impact', icon: ChartNoAxesColumnIncreasing },
] as const;

function Brand({ openSettings }: { openSettings: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="ComForce Connect, open settings" onPress={openSettings}
      style={[row, { gap: 7, flexShrink: 1 }]}>
      <AppMark />
      <Copy kind="strong" style={{ fontSize: 17, letterSpacing: -0.55, flexShrink: 1 }}>
        ComForce Connect
      </Copy>
    </Pressable>
  );
}
function Location() {
  return (
    <View style={[row, { gap: 4 }]}>
      <MapPin size={14} color={color.muted} />
      <Copy kind="small" tint={color.muted}>
        Milwaukee
      </Copy>
    </View>
  );
}
function Shell() {
  const { shared } = useDemo();
  const accountId = shared.data?.account.id;
  const pathname = usePathname();
  const { view, period, from } = useGlobalSearchParams<{ view?: string; period?: string; from?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tabParams = useRef<{ view?: string; period?: string }>({});
  useEffect(() => {
    if (pathname === '/') tabParams.current.view = view;
    if (pathname === '/impact') tabParams.current.period = period;
  }, [pathname, view, period]);
  useEffect(() => {
    warmPostPhotos();
    warmVenueMaps();
    warmNavigation();
  }, []);
  const openSettings = useCallback(() => {
    if (pathname === '/settings') return;
    Keyboard.dismiss();
    setSettingsOpen(true);
  }, [pathname]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onShortcut = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.code === 'KeyS') {
        event.preventDefault();
        openSettings();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [openSettings]);
  const navigation = (
    <View
      style={{
        flexDirection: wide ? 'column' : 'row',
        gap: wide ? 3 : 0,
        backgroundColor: wide ? 'transparent' : color.paper,
        borderTopWidth: wide ? 0 : StyleSheet.hairlineWidth,
        borderColor: color.line,
      }}
    >
      {tabs.map(({ name, path, icon: Icon }) => {
        const label = path === '/activity' && shared.data?.account.kind === 'worker' ? 'Inbox' : name;
        const settingsShortcut = !wide && path === '/';
        const postPage = pathname.startsWith('/community-post/');
        const selected =
          pathname === path ||
          (path === '/activity' && (pathname.startsWith('/activity/referral/') || (postPage && from === 'activity'))) ||
          (path === '/map' && postPage && from === 'map') ||
          (path === '/impact' && pathname === '/impact-program') ||
          (path === '/' &&
            (['/ask', '/offer'].includes(pathname) || (postPage && from !== 'activity' && from !== 'map')));
        return (
          <Pressable
            key={path}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            aria-selected={selected}
            accessibilityLabel={label}
            accessibilityHint={settingsShortcut ? 'Press and hold to open settings' : undefined}
            accessibilityActions={settingsShortcut ? [{ name: 'openSettings', label: 'Open settings' }] : undefined}
            onAccessibilityAction={settingsShortcut ? (event) => {
              if (event.nativeEvent.actionName === 'openSettings') openSettings();
            } : undefined}
            onLongPress={settingsShortcut ? openSettings : undefined}
            onPress={() => {
              if (pathname === path) return;
              tapFeedback();
              Keyboard.dismiss();
              const params = path === '/' ? { view: tabParams.current.view }
                : path === '/impact' ? { period: tabParams.current.period } : {};
              router.navigate({ pathname: path, params });
            }}
            style={({ pressed }) => ({
              flex: wide ? undefined : 1,
              minWidth: 0,
              minHeight: wide ? 46 : 56,
              paddingHorizontal: wide ? 12 : 2,
              paddingVertical: 6,
              borderRadius: wide ? 11 : 0,
              flexDirection: wide ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: wide ? 'flex-start' : 'center',
              gap: wide ? 11 : 2,
              backgroundColor: selected && wide ? color.pale : 'transparent',
              opacity: pressed ? 0.65 : 1,
            })}
          >
            {settingsShortcut ? <AppMark size={22} /> : <Icon
              size={wide ? 20 : 22}
              strokeWidth={selected ? 2.5 : 1.65}
              color={selected ? color.pine : color.muted}
            />}
            <Copy
              kind={wide ? 'strong' : 'small'}
              tint={selected ? color.pine : color.muted}
              style={{
                fontWeight: selected ? '700' : '500',
                fontSize: wide ? 15 : 11,
                lineHeight: wide ? 22 : 15,
                textAlign: 'center',
                maxWidth: '100%',
              }}
            >
              {label}
            </Copy>
          </Pressable>
        );
      })}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: color.bg }}>
        {wide && (
          <View
            style={{
              width: 228,
              padding: 18,
              paddingTop: 28,
              gap: 28,
              borderRightWidth: StyleSheet.hairlineWidth,
              borderColor: color.line,
              backgroundColor: color.paper,
            }}
          >
            <Brand openSettings={openSettings} />
            {navigation}
            <View
              style={[row, { marginTop: 'auto', paddingLeft: 10, justifyContent: 'space-between' }]}
            >
              <Location />
            </View>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flex: 1 }}>
            <Slot />
            <RetainedTab active={pathname === '/'} param={view} fallback={<Page title="Community" />}>
              {(tabView) => <Community view={tabView} />}
            </RetainedTab>
            <RetainedTab active={pathname === '/map'} fallback={
              <Page title="Map"><Card style={{ minHeight: 290, backgroundColor: '#e8eee5' }} /></Page>
            }>
              {() => <MapScreen />}
            </RetainedTab>
            <RetainedTab key={`activity:${accountId}`} active={pathname === '/activity'} fallback={<Page title="Activity" />}>
              {() => <ActivityScreen />}
            </RetainedTab>
            <RetainedTab active={pathname === '/impact'} param={period} fallback={<Page title="Impact" />}>
              {(tabPeriod) => <Impact period={tabPeriod} />}
            </RetainedTab>
          </View>
          {!wide && navigation}
        </View>
        {!wide && !settingsOpen && pathname !== '/settings' && <SettingsEdge open={openSettings} />}
      </View>
      {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}
    </SafeAreaView>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <DemoProvider>
        <Shell />
      </DemoProvider>
    </SafeAreaProvider>
  );
}
