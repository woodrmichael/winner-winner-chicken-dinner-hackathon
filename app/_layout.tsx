import { Slot, usePathname, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Activity,
  ChartNoAxesColumnIncreasing,
  HeartHandshake,
  Map,
  MapPin,
  Settings,
  UsersRound,
} from 'lucide-react-native';
import { Pressable, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DemoProvider } from '../src/state/Demo';
import { MobileHeaderActionContext } from '../src/ui/MobileHeaderAction';
import { Btn, Copy, color, row } from '../src/ui/kit';

const tabs = [
  { name: 'Community', path: '/', icon: UsersRound },
  { name: 'Map', path: '/map', icon: Map },
  { name: 'Activity', path: '/activity', icon: Activity },
  { name: 'Impact', path: '/impact', icon: ChartNoAxesColumnIncreasing },
] as const;

function Brand() {
  return (
    <View style={[row, { gap: 7, flexShrink: 1 }]}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: color.pine,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HeartHandshake size={21} color="#FFF" strokeWidth={1.8} />
      </View>
      <Copy kind="strong" style={{ fontSize: 17, letterSpacing: -0.55, flexShrink: 1 }}>
        ComForce Connect
      </Copy>
    </View>
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
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [mobileHeaderAction, setMobileHeaderAction] = useState<ReactNode>(null);
  const wide = width >= 900;
  const settingsAction = pathname === '/settings' ? (
    <Btn
      label="Done"
      quiet
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
      }}
    />
  ) : (
    <Btn
      label="Settings"
      icon={Settings}
      iconOnly
      quiet
      onPress={() => router.push('/settings')}
    />
  );
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
        const selected =
          pathname === path ||
          (path === '/activity' && pathname.startsWith('/activity/referral/')) ||
          (path === '/impact' && pathname === '/impact-program') ||
          (path === '/' &&
            (['/ask', '/offer'].includes(pathname) || pathname.startsWith('/community-post/')));
        return (
          <Pressable
            key={path}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={name}
            onPress={() => router.navigate(path)}
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
            <Icon
              size={wide ? 20 : 22}
              strokeWidth={selected ? 2.5 : 1.65}
              color={selected ? color.pine : color.muted}
            />
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
              {name}
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
            <Brand />
            {navigation}
            <View
              style={[row, { marginTop: 'auto', paddingLeft: 10, justifyContent: 'space-between' }]}
            >
              <Location />
              {settingsAction}
            </View>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          {!wide && (
            <View
              style={[
                row,
                {
                  justifyContent: 'space-between',
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  minHeight: 54,
                },
              ]}
            >
              <Brand />
              <View style={row}>
                {width >= 400 && !mobileHeaderAction && <Location />}
                {settingsAction}
                {mobileHeaderAction}
              </View>
            </View>
          )}
          <MobileHeaderActionContext.Provider value={setMobileHeaderAction}>
            <Slot />
          </MobileHeaderActionContext.Provider>
          {!wide && navigation}
        </View>
      </View>
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
