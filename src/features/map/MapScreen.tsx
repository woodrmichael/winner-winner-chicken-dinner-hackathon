import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as MapText } from 'react-native-svg';
import { ToggleRow } from '../../ui/SelectionRows';
import { mapRows } from '../../domain/model';
import type { Neighborhood } from '../../domain/types';
import { useDemo } from '../../state/Demo';
import { Card, Columns, Copy, Page, color, wrap } from '../../ui/kit';
import boundaries from './boundaries.json';

const layers = [
  { key: 'open', label: 'Open needs', symbol: '○', ink: '#844923' },
  { key: 'delivered', label: 'Assistance delivered', symbol: '✓', ink: '#17634B' },
  { key: 'resources', label: 'Resources', symbol: '+', ink: '#385E91' },
  { key: 'fatal', label: 'Homicides', symbol: '◆', ink: '#914855' },
  { key: 'nonfatal', label: 'Nonfatal shootings', symbol: '△', ink: '#825E0F' },
] as const;
type Layer = (typeof layers)[number]['key'];
// Label anchors are offset from neighborhood interiors for legibility.
const pins: Record<Neighborhood, { x: number; y: number; left: number; top: number }> = {
  Harambee: { x: 145, y: 87, left: 10, top: 42 },
  Riverwest: { x: 218, y: 98, left: 235, top: 85 },
  'Brewers Hill': { x: 178, y: 204, left: 45, top: 178 },
};
export default function MapScreen() {
  const { state } = useDemo();
  const [visible, setVisible] = useState<Layer[]>(['open', 'delivered']);
  const rows = mapRows(state);
  const active = layers.filter((layer) => visible.includes(layer.key));
  function toggle(key: Layer) {
    setVisible((old) => (old.includes(key) ? old.filter((layer) => layer !== key) : [...old, key]));
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
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel="Milwaukee neighborhood map. Selected layer counts also appear in the neighborhood totals below."
              style={{ width: '100%', aspectRatio: 1.5, backgroundColor: '#DAE8E4' }}
            >
              <Svg width="100%" height="100%" viewBox="0 0 360 240">
                {boundaries.map((b) => (
                  <Path
                    key={b.name}
                    d={b.path}
                    fill={b.name in pins ? '#CEE4DB' : '#E5EAE7'}
                    stroke="#FCFBF3"
                    strokeWidth={1.4}
                  />
                ))}
                {rows.map(({ area, ...counts }) => {
                  const p = pins[area];
                  return (
                    <G key={area}>
                      <Line
                        x1={p.x}
                        y1={p.y}
                        x2={p.left + 45}
                        y2={p.top + 14}
                        stroke={color.pine}
                        strokeWidth={1.4}
                      />
                      <Circle cx={p.x} cy={p.y} r={4} fill={color.pine} stroke="white" />
                      <Rect
                        x={p.left}
                        y={p.top}
                        width={109}
                        height={24 + 17 * Math.ceil(active.length / 3)}
                        rx={5}
                        fill="#FFFFFF"
                        stroke="#B3C6B6"
                      />
                      <MapText
                        x={p.left + 6}
                        y={p.top + 15}
                        fontFamily="sans-serif"
                        fontSize={12}
                        fontWeight="bold"
                        fill={color.ink}
                      >
                        {area}
                      </MapText>
                      {active.map((l, i) => (
                        <MapText
                          key={l.key}
                          x={p.left + 6 + (i % 3) * 34}
                          y={p.top + 32 + Math.floor(i / 3) * 17}
                          fontFamily="sans-serif"
                          fontSize={11}
                          fontWeight="bold"
                          fill={l.ink}
                        >
                          {l.symbol}
                          {counts[l.key]}
                        </MapText>
                      ))}
                    </G>
                  );
                })}
              </Svg>
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
              <Copy kind="small" tint={color.muted}>
                City of Milwaukee DCD and ITMD-GIS
                {visible.includes('fatal') || visible.includes('nonfatal')
                  ? ' · Incidents: Milwaukee Homicide Review Commission, 2014–2016'
                  : ''}
              </Copy>
            </View>
          </Card>
        }
        side={
          <Card>
            <Copy kind="strong">Map layers</Copy>
            <View>
              {layers.map((layer) => (
                <ToggleRow
                  key={layer.key}
                  label={layer.label}
                  value={visible.includes(layer.key)}
                  onChange={() => toggle(layer.key)}
                  leading={
                    <Copy kind="strong" tint={layer.ink} style={{ width: 18, textAlign: 'center' }}>
                      {layer.symbol}
                    </Copy>
                  }
                />
              ))}
            </View>
          </Card>
        }
      />
      <Card>
        <Copy kind="title">Neighborhood totals</Copy>
        {!active.length && <Copy>Select a layer to see counts.</Copy>}
        {active.length > 0 &&
          rows.map((r) => (
            <View
              key={r.area}
              style={{ borderTopWidth: 1, borderColor: color.line, paddingTop: 10, gap: 4 }}
            >
              <Copy kind="strong">{r.area}</Copy>
              <View style={wrap}>
                {active.map((l) => (
                  <Copy key={l.key} kind="small" tint={l.ink}>
                    {l.symbol} {l.label} · {r[l.key]}
                  </Copy>
                ))}
              </View>
            </View>
          ))}
      </Card>
    </Page>
  );
}
