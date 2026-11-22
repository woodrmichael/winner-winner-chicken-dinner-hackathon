import { BookOpen, CalendarDays } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import type { Category } from '../../domain/types';
import { Copy, color, wrap } from '../../ui/kit';
import { incidentBands, incidentLayers, incidentPeriod, needBands } from './incidentScale';
import { eventColor, libraryColor } from './pointColors';

type IncidentLayer = (typeof incidentLayers)[number];

function Scale({ title, bands, shape }: {
  title: string;
  bands: readonly { label: string; ink: string }[];
  shape: 'fill' | 'outline' | 'dot';
}) {
  return (
    <View style={styles.scale}>
      <Copy kind="small" style={styles.label}>{title}</Copy>
      <View style={styles.swatches}>
        {bands.map(({ label, ink }) => (
          <View key={label} style={styles.item}>
            <View style={[
              styles.swatch,
              { backgroundColor: ink },
              shape === 'outline' && { backgroundColor: color.paper, borderWidth: 3, borderColor: ink },
              shape === 'dot' && styles.dot,
            ]} />
            <Copy kind="small">{label}</Copy>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MapLegend({ needs, incidents, events, libraries }: {
  needs: Category | 'All' | null;
  incidents: IncidentLayer[];
  events: boolean;
  libraries: boolean;
}) {
  if (!needs && !incidents.length && !events && !libraries) return null;

  return (
    <View style={styles.legend}>
      <View style={[wrap, { justifyContent: 'space-between', gap: 4 }]}>
        <Copy kind="small" tint={color.muted} style={styles.label}>Map legend</Copy>
        {incidents.length > 0 && <Copy kind="small" tint={color.muted}>{incidentPeriod}</Copy>}
      </View>
      {needs && <Scale title={needs === 'All' ? 'Open needs' : `Open needs · ${needs}`} bands={needBands} shape="fill" />}
      {incidents.map(({ key, label }) => (
        <Scale key={key} title={label}
          bands={incidentBands.map((band) => ({ label: band.label, ink: band[key] }))}
          shape={key === 'fatal' ? 'outline' : 'dot'}
        />
      ))}
      {(events || libraries) && (
        <View style={styles.pins}>
          {events && <View style={styles.item}>
            <View style={[styles.pin, { backgroundColor: eventColor }]}><CalendarDays size={12} color="#FFF" /></View>
            <Copy kind="small">Community events</Copy>
          </View>}
          {libraries && <View style={styles.item}>
            <View style={[styles.pin, { backgroundColor: libraryColor }]}><BookOpen size={12} color="#FFF" /></View>
            <Copy kind="small">Public libraries</Copy>
          </View>}
        </View>
      )}
      {incidents.length > 0 && (
        <Copy kind="small" tint={color.muted}>Unmarked neighborhoods have no incident data.</Copy>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { paddingHorizontal: 14, paddingVertical: 9, gap: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.line },
  label: { fontWeight: '700' },
  scale: { ...wrap, columnGap: 12, rowGap: 2 },
  swatches: { ...wrap, columnGap: 8, rowGap: 2, flexShrink: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 15, height: 15, borderRadius: 3, borderWidth: 1, borderColor: '#687474' },
  dot: { borderRadius: 8 },
  pins: { ...wrap, columnGap: 14, rowGap: 4 },
  pin: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
