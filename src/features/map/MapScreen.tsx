import { useRouter } from 'expo-router';
import { useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { MapPin, RotateCw } from 'lucide-react-native';

import { communityEventPins } from '../../domain/demoCommunity';
import { historicalIncidents } from '../../domain/seed';
import { categories, type Category } from '../../domain/types';
import { useDemo } from '../../state/Demo';
import { Disclosure } from '../../ui/Disclosure';
import { TabActive } from '../../ui/RetainedTab';
import { SelectMenu } from '../../ui/SelectMenu';
import { SelectionRow, ToggleRow } from '../../ui/SelectionRows';
import { Btn, Card, Columns, Copy, Page, color, wrap } from '../../ui/kit';
import { approvedPartners, partnerDetail } from '../matching/directory';
import MilwaukeeMap from './MilwaukeeMap';
import { MapLegend } from './MapLegend';
import { incidentBand, incidentLayers, incidentPeriod, noIncidentData, needColor } from './incidentScale';
import { usePublicLibraries } from './usePublicLibraries';

const metrics = [
  { key: 'open', label: 'Needs still open', ink: '#87411F' },
  { key: 'delivered', label: 'Services delivered', ink: '#17634B' },
] as const;
const serviceOptions = (['All', ...categories] as const).map((value) => ({
  value,
  label: value === 'All' ? 'All services' : value,
}));
type Overlay = 'needs' | 'libraries' | 'events' | 'fatal' | 'nonfatal';
const noRows: NonNullable<ReturnType<typeof useDemo>['shared']['data']>['reporting']['map'] = [];

export default function MapScreen() {
  const router = useRouter();
  const active = useContext(TabActive);
  const { width, height, fontScale } = useWindowDimensions();
  const { state, shared } = useDemo();
  const [visible, setVisible] = useState<Record<Overlay, boolean>>({
    needs: true, libraries: false, events: true, fatal: false, nonfatal: false,
  });
  const [overlaysExpanded, setOverlaysExpanded] = useState(false);
  const [areasExpanded, setAreasExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const mapHeight = Math.max(290, Math.min(500, Math.round(height * (width < 900 ? 0.46 : 0.60))));
  const publicLibraries = usePublicLibraries(active && visible.libraries);
  const posts = shared.data?.posts;
  const events = useMemo(() => visible.events && posts ? communityEventPins(posts) : null, [posts, visible.events]);

  const reporting = shared.data?.reporting;
  const allRows = reporting?.map ?? noRows;
  const sharedRows = category === 'All'
    ? reporting?.map
    : reporting?.mapByCategory?.find((entry) => entry.category === category)?.rows;
  const rows = sharedRows ?? noRows;
  const coveredAreas = useMemo(() => new Set(allRows.filter(({ open, delivered }) =>
    open > 0 || delivered > 0).map(({ area }) => area)), [allRows]);
  const reportedRows = useMemo(() => rows.filter(({ area }) => coveredAreas.has(area))
    .sort((a, b) => a.area.localeCompare(b.area)), [rows, coveredAreas]);
  const showServiceStats = !!sharedRows;
  const shownIncidents = incidentLayers.filter(({ key }) => visible[key]);
  const needsShading = useMemo(() => visible.needs
    ? Object.fromEntries(reportedRows.map(({ area, open }) => [area, needColor(open)]))
    : null, [reportedRows, visible.needs]);
  const incidentShading = useMemo(() => {
    function colors(key: 'fatal' | 'nonfatal') {
      return Object.fromEntries(Object.entries(historicalIncidents).map(([area, counts]) =>
        [area, incidentBand(counts[key])[key]]));
    }
    return { fatal: visible.fatal ? colors('fatal') : null, nonfatal: visible.nonfatal ? colors('nonfatal') : null };
  }, [visible.fatal, visible.nonfatal]);
  const selectedCounts = reportedRows.find(({ area }) => area === selected);
  const counts = selected
    ? selectedCounts
    : {
        open: rows.reduce((total, item) => total + item.open, 0),
        delivered: rows.reduce((total, item) => total + item.delivered, 0),
      };
  const incidentCounts = Object.entries(historicalIncidents).find(([area]) => area === selected)?.[1];
  const providers = useMemo(
    () => selected ? approvedPartners(state.partners).filter((partner) => partner.area === selected) : [],
    [selected, state.partners],
  );

  const toggleNeighborhood = useCallback(async (area: string | null) => {
    setSelected((current) => current === area ? null : area);
  }, []);
  const openEvent = useCallback(async (id: string) => {
    router.push({ pathname: '/community-post/[id]', params: { id, from: 'map' } });
  }, [router]);

  function overlaySwitch(key: Overlay, label: string) {
    return <ToggleRow
      key={key}
      label={label}
      value={visible[key]}
      onChange={(enabled) => setVisible((current) => ({ ...current, [key]: enabled }))}
    />;
  }

  return (
    <Page title="Map">
      <Columns
        main={
          <Card style={styles.mapPanel}>
            <MapLegend
              needs={visible.needs && reportedRows.length > 0 ? category : null}
              incidents={shownIncidents}
              events={!!events?.length}
              libraries={visible.libraries && publicLibraries.length > 0}
            />
            <View style={{ height: mapHeight }}>
              {mapUnavailable ? <View style={styles.mapFallback}>
                <MapPin color={color.pine} size={26} />
                <Copy kind="strong">The street map couldn’t load</Copy>
                <Copy kind="small" tint={color.muted}>You can still browse neighborhood service activity below.</Copy>
                <Btn label="Reload map" icon={RotateCw} secondary onPress={() => setMapUnavailable(false)} />
              </View> : <MilwaukeeMap
                selected={selected}
                needs={needsShading}
                shading={incidentShading}
                libraries={visible.libraries ? publicLibraries : null}
                events={events}
                onSelect={toggleNeighborhood}
                onOpenEvent={openEvent}
                dom={{
                  useExpoDOMWebView: false,
                  scrollEnabled: false,
                  style: styles.mapFrame,
                  onError: () => setMapUnavailable(true),
                  onHttpError: ({ nativeEvent }) => {
                    if (nativeEvent.url.includes('/_expo/@dom') || nativeEvent.url.endsWith('.html')) setMapUnavailable(true);
                  },
                }}
              />}
            </View>
            <View style={styles.overlayControls}>
              <Disclosure label="Map overlays" expanded={overlaysExpanded} onToggle={() => setOverlaysExpanded((current) => !current)}>
                {overlaySwitch('needs', 'Open needs')}
                {overlaySwitch('events', 'Community events')}
                {overlaySwitch('libraries', 'Public libraries')}
                {incidentLayers.map(({ key, label }) => overlaySwitch(key, label))}
              </Disclosure>
            </View>
          </Card>
        }
        side={
          <Card>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewTitle}>
                <Copy kind="title">Service activity</Copy>
                <Copy kind="small" tint={color.muted}>
                  {selected ?? (coveredAreas.size ? `${coveredAreas.size} neighborhoods` : 'All neighborhoods')} · All time
                </Copy>
              </View>
              {showServiceStats && (
                <SelectMenu label="Service category" value={category} options={serviceOptions} onChange={setCategory} />
              )}
            </View>
            {showServiceStats && counts && (
              <View style={styles.metrics}>
                {metrics.map(({ key, label, ink }) => (
                  <View key={key} style={[styles.metric, { flexBasis: 75 * fontScale }]}>
                    <Copy kind="title" tint={ink} style={styles.metricValue}>{counts[key]}</Copy>
                    <Copy kind="small" tint={color.muted}>{label}</Copy>
                  </View>
                ))}
              </View>
            )}
            {showServiceStats && !counts && <Copy kind="small" tint={color.muted}>No service activity recorded here.</Copy>}
            {!selected && reportedRows.length > 0 && (
              <Copy kind="small" tint={color.muted}>Tap a neighborhood to see its totals.</Copy>
            )}
            {!shared.data && (
              <Btn label="Sign in to view service stats" secondary onPress={() => router.push('/settings')} />
            )}
            {shared.data && !sharedRows && (
              <Copy kind="small" tint={color.muted}>Service stats are unavailable for this category.</Copy>
            )}
            {selected && shownIncidents.length > 0 && <View style={styles.provider}>
              <Copy kind="strong">Incidents · {incidentPeriod}</Copy>
              {shownIncidents.map(({ key, label, ink }) => (
                <Copy key={key} kind="small" tint={ink}>{label} · {incidentCounts?.[key] ?? noIncidentData.label}</Copy>
              ))}
            </View>}
            {selected && showServiceStats && providers.map((partner) => (
              <View key={partner.id} style={styles.provider}>
                <Copy kind="strong">{partner.name}</Copy>
                <Copy kind="small" tint={color.muted}>{partner.categories.join(' · ')}</Copy>
                <Copy kind="small" tint={color.muted}>{partnerDetail(partner)}</Copy>
                <Btn label="View profile" quiet onPress={() =>
                  router.push({ pathname: '/partner/[id]', params: { id: partner.id } })}
                />
                {shared.data?.account.kind !== 'worker' && <Btn label={'Request help from ' + partner.name} secondary onPress={() =>
                  router.push({ pathname: '/ask', params: { partner: partner.id } })}
                />}
              </View>
            ))}
            {shownIncidents.length > 0 && (
              <Copy kind="small" tint={color.muted}>Milwaukee Homicide Review Commission</Copy>
            )}
            {reportedRows.length > 0 && (
              <View style={styles.sectionDivider}>
                <Disclosure label="Browse neighborhoods" expanded={areasExpanded} onToggle={() => setAreasExpanded((current) => !current)}>
                  <SelectionRow label="All neighborhoods" selected={selected === null} onPress={() => setSelected(null)} />
                  {reportedRows.map(({ area, open, delivered }) => (
                    <SelectionRow
                      key={area}
                      label={area}
                      detail={open + ' open · ' + delivered + ' delivered'}
                      selected={area === selected}
                      onPress={() => toggleNeighborhood(area)}
                    />
                  ))}
                </Disclosure>
              </View>
            )}
          </Card>
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  mapPanel: { overflow: 'hidden', padding: 0, gap: 0 },
  mapFrame: { flex: 1, backgroundColor: '#e8eee5' },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.pale, padding: 18, gap: 10 },
  overlayControls: { paddingHorizontal: 14 },
  overviewHeader: { ...wrap, justifyContent: 'space-between', gap: 4 },
  overviewTitle: { flexShrink: 1, gap: 2 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { flexGrow: 1, flexShrink: 1, minWidth: 0, padding: 9, backgroundColor: color.sand, borderRadius: 8 },
  metricValue: { fontVariant: ['tabular-nums'] },
  provider: { gap: 4, alignItems: 'flex-start' },
  sectionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.line },
});
