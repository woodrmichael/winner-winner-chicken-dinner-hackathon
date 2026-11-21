
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as MapText,
} from 'react-native-svg';

import { SelectionRow, ToggleRow } from '../../ui/SelectionRows';
import { mapRows } from '../../domain/model';
import { categories, type Category, type Neighborhood } from '../../domain/types';
import { Disclosure } from '../../ui/Disclosure';
import { useDemo } from '../../state/Demo';
import { Btn, Card, Columns, Copy, Page, color, wrap } from '../../ui/kit';
import boundaries from './boundaries.json';
import { directory } from '../matching/directory';
import { incidentBand, incidentBands, incidentLayers, incidentPeriod, noIncidentData } from './incidentScale';

const layers = [
  { key: 'open', label: 'Open needs', symbol: '○', ink: '#844923' },
  { key: 'delivered', label: 'Assistance delivered', symbol: '✓', ink: '#17634B' },
  { key: 'resources', label: 'Resources', symbol: '+', ink: '#385E91' },
  ...incidentLayers,
] as const;

type Layer = (typeof layers)[number]['key'];

// Label anchors are offset from neighborhood interiors for legibility.
const pins: Record<
  Neighborhood,
  { x: number; y: number; left: number; top: number }
> = {
  Harambee: { x: 145, y: 87, left: 10, top: 42 },
  Riverwest: { x: 218, y: 98, left: 235, top: 85 },
  'Brewers Hill': { x: 178, y: 204, left: 45, top: 178 },
};

export default function MapScreen() {
  const router = useRouter();
  const { state, shared } = useDemo();

  // Map layer visibility.
  const [visible, setVisible] = useState<Layer[]>([
    'open',
    'delivered',
  ]);

  // Currently selected neighborhood.
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<Neighborhood | null>(null);

  // Calculate neighborhood counts from shared application state.
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const reporting = shared.data?.reporting;
  const sharedRows = category === 'All'
    ? reporting?.map
    : reporting?.mapByCategory?.find((entry) => entry.category === category)?.rows;
  const rows = sharedRows ?? mapRows(state, category === 'All' ? undefined : category);

  const active = layers.filter((layer) =>
    visible.includes(layer.key)
  );
  // Switches are independent. The last enabled incident layer supplies the fill.
  const shadeKey = visible.slice().reverse().find((key) => key === 'fatal' || key === 'nonfatal');
  const shadeLayer = incidentLayers.find((layer) => layer.key === shadeKey);

  // Filter totals when a neighborhood is selected.
  const displayedRows = selectedNeighborhood
    ? rows.filter((row) => row.area === selectedNeighborhood)
    : rows;

  function toggle(key: Layer) {
    setVisible((old) =>
      old.includes(key)
        ? old.filter((layer) => layer !== key)
        : [...old, key]
    );
  }

  // Selecting the same neighborhood again clears selection.
  function selectNeighborhood(area: Neighborhood) {
    setSelectedNeighborhood((current) =>
      current === area ? null : area
    );
  }

  function clearSelection() {
    setSelectedNeighborhood(null);
  }

  return (
    <Page title="Community map">
      <Columns
        main={
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Copy kind="label" tint={color.pine}>
                MILWAUKEE · NORTH SIDE
              </Copy>
            </View>

            {/* Map and interactive neighborhood overlays */}
            <View
              style={{
                width: '100%',
                aspectRatio: 1.5,
                backgroundColor: '#DAE8E4',
                position: 'relative',
              }}
            >
              {/* SVG map */}
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 360 240"
              >
                {/* Neighborhood boundaries */}
                {boundaries.map((b) => {
                  const counts = rows.find((row) => row.area === b.name);
                  const fill = shadeLayer
                    ? incidentBand(counts?.[shadeLayer.key])[shadeLayer.key]
                    : counts ? '#CEE4DB' : '#E5EAE7';
                  return (
                    <Path
                      key={b.name}
                      d={b.path}
                      fill={fill}
                      stroke={shadeLayer ? '#788484' : '#FCFBF3'}
                      strokeWidth={1.4}
                    />
                  );
                })}

                {/* Neighborhood markers and labels */}
                {rows.map(({ area, ...counts }) => {
                  const p = pins[area];
                  const selected = selectedNeighborhood === area;

                  return (
                    <G key={area}>
                      {/* Connector line */}
                      <Line
                        x1={p.x}
                        y1={p.y}
                        x2={p.left + 45}
                        y2={p.top + 14}
                        stroke={selected ? '#17634B' : color.pine}
                        strokeWidth={selected ? 2.5 : 1.4}
                      />

                      {/* Neighborhood marker */}
                      <Circle
                        cx={p.x}
                        cy={p.y}
                        r={selected ? 7 : 4}
                        fill={selected ? '#17634B' : color.pine}
                        stroke="white"
                        strokeWidth={2}
                      />

                      {/* Neighborhood label */}
                      <Rect
                        x={p.left}
                        y={p.top}
                        width={109}
                        height={
                          24 + 17 * Math.ceil(active.length / 3)
                        }
                        rx={5}
                        fill={selected ? '#E0F0E7' : '#FFFFFF'}
                        stroke={selected ? '#17634B' : '#B3C6B6'}
                        strokeWidth={selected ? 2.5 : 1}
                      />

                      {/* Neighborhood name */}
                      <MapText
                        x={p.left + 6}
                        y={p.top + 15}
                        fontFamily="sans-serif"
                        fontSize={12}
                        fontWeight="bold"
                        fill={color.ink}
                      >
                        {area}
                        {selected ? ' ✓' : ''}
                      </MapText>

                      {/* Visible layer counts */}
                      {active.map((layer, i) => (
                        <MapText
                          key={layer.key}
                          x={p.left + 6 + (i % 3) * 34}
                          y={
                            p.top +
                            32 +
                            Math.floor(i / 3) * 17
                          }
                          fontFamily="sans-serif"
                          fontSize={11}
                          fontWeight="bold"
                          fill={layer.ink}
                        >
                          {layer.symbol}
                          {counts[layer.key] ?? '—'}
                        </MapText>
                      ))}
                    </G>
                  );
                })}
              </Svg>

              {/* Interactive neighborhood touch targets */}
              {rows.map(({ area, ...counts }) => {
                const p = pins[area];
                const selected = selectedNeighborhood === area;

                const labelHeight =
                  24 + 17 * Math.ceil(active.length / 3);

                return (
                  <Pressable
                    key={area}
                    onPress={() => selectNeighborhood(area)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${area}` + (shadeLayer
                      ? `, ${shadeLayer.label}, ${incidentPeriod}, ${counts[shadeLayer.key] ?? noIncidentData.label}`
                      : '')}
                    accessibilityState={{ selected }}
                    style={{
                      position: 'absolute',
                      left: `${((p.left - 5) / 360) * 100}%`,
                      top: `${((p.top - 5) / 240) * 100}%`,
                      width: `${(119 / 360) * 100}%`,
                      height: `${((labelHeight + 10) / 240) * 100}%`,
                      backgroundColor: 'transparent',
                      zIndex: 2,
                    }}
                  />
                );
              })}
            </View>

            {/* Map attribution */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingBottom: 14,
                gap: 8,
              }}
            >
              {shadeLayer && (
                <View style={{ gap: 6 }}>
                  <Copy kind="strong">Shading · {shadeLayer.label} · {incidentPeriod}</Copy>
                  <View style={wrap}>
                    {[...incidentBands, noIncidentData].map((band) => (
                      <View key={band.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={{
                          width: 16, height: 16, borderRadius: 3, borderWidth: 1,
                          borderColor: '#687474', backgroundColor: band[shadeLayer.key],
                        }} />
                        <Copy kind="small">{band.label}</Copy>
                      </View>
                    ))}
                  </View>
                  {incidentLayers.every((layer) => visible.includes(layer.key)) && (
                    <Copy kind="small">Both counts are shown. Shading follows the last incident layer turned on.</Copy>
                  )}
                </View>
              )}
              <Copy kind="small" tint={color.muted}>
                City of Milwaukee DCD and ITMD-GIS
                {shadeLayer
                  ? ' · Incident totals from the Milwaukee Homicide Review Commission'
                  : ''}
              </Copy>
            </View>
          </Card>
        }
        side={
          <Card>
            <Copy kind="strong">Map layers</Copy>

            <Disclosure label={`Service category · ${category}`}
              detail="Filters open needs and assistance delivered."
              expanded={filterOpen} onToggle={() => setFilterOpen(!filterOpen)}>
              <View accessibilityRole="radiogroup" accessibilityLabel="Service category">
                {(['All', ...categories] as const).map((option) => (
                  <SelectionRow key={option} label={option} selected={option === category}
                    onPress={() => { setCategory(option); setFilterOpen(false); }} />
                ))}
              </View>
            </Disclosure>

            <View>
              {layers.map((layer) => (
                <ToggleRow
                  key={layer.key}
                  label={layer.label}
                  value={visible.includes(layer.key)}
                  onChange={() => toggle(layer.key)}
                  leading={
                    <Copy
                      kind="strong"
                      tint={layer.ink}
                      style={{
                        width: 18,
                        textAlign: 'center',
                      }}
                    >
                      {layer.symbol}
                    </Copy>
                  }
                />
              ))}
            </View>
          </Card>
        }
      />

      {/* Neighborhood totals */}
      {selectedNeighborhood && (
        <Card>
          <Copy kind="title">Providers in {selectedNeighborhood}</Copy>
          {directory.filter((partner) => partner.area === selectedNeighborhood).map((partner) => (
            <View key={partner.id} style={{ gap: 6 }}>
              <Copy kind="strong">{partner.name}</Copy>
              <Copy>{partner.categories.join(' · ')}</Copy>
              <Btn label={`Request help from ${partner.name}`} secondary onPress={() =>
                router.push({ pathname: '/ask', params: { partner: partner.id } })
              } />
            </View>
          ))}
        </Card>
      )}
      <Card>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Copy kind="title">Neighborhood totals</Copy>

          {selectedNeighborhood && (
            <Copy kind="small" tint={color.pine}>
              Selected
            </Copy>
          )}
        </View>

        {/* Current selection information */}
        {selectedNeighborhood && (
          <View style={{ marginTop: 8 }}>
            <Copy kind="small" tint={color.muted}>
              Showing {selectedNeighborhood}
            </Copy>
          </View>
        )}

        {!active.length && (
          <Copy>Select a layer to see counts.</Copy>
        )}

        {/* Neighborhood rows */}
        {active.length > 0 &&
          displayedRows.map((r) => {
            const selected = selectedNeighborhood === r.area;

            return (
              <Pressable
                key={r.area}
                onPress={() => selectNeighborhood(r.area)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${r.area} neighborhood totals. ` +
                  active.map((layer) => `${layer.label} ${r[layer.key] ?? noIncidentData.label}`).join(', ') +
                  (shadeLayer ? `. Incident totals for ${incidentPeriod}.` : '')}
                accessibilityState={{ selected }}
                style={{
                  borderTopWidth: 1,
                  borderColor: selected ? color.pine : color.line,
                  borderWidth: selected ? 1 : 0,
                  padding: 10,
                  gap: 4,
                  marginTop: 10,
                  backgroundColor: selected ? '#E0F0E7' : 'transparent',
                  borderRadius: 6,
                }}
              >
                <Copy kind="strong">{r.area}</Copy>

                <View style={wrap}>
                  {active.map((layer) => (
                    <Copy
                      key={layer.key}
                      kind="small"
                      tint={layer.ink}
                    >
                      {layer.symbol} {layer.label} · {r[layer.key] ?? noIncidentData.label}
                      {(layer.key === 'fatal' || layer.key === 'nonfatal') && ` (${incidentPeriod})`}
                    </Copy>
                  ))}
                </View>
              </Pressable>
            );
          })}

        {/* Clear neighborhood selection */}
        {selectedNeighborhood && (
          <View style={{ marginTop: 12 }}>
            <Pressable
              onPress={clearSelection}
              accessibilityRole="button"
              accessibilityLabel="Show all neighborhoods"
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: color.pine,
                borderRadius: 6,
                alignItems: 'center',
              }}
            >
              <Copy kind="strong" tint={color.pine}>
                Show all neighborhoods
              </Copy>
            </Pressable>
          </View>
        )}
      </Card>
    </Page>
  );
}
