import { Linking, StyleSheet, View } from 'react-native';
import { Bus } from 'lucide-react-native';
import { useState } from 'react';
import { Btn, Copy, color } from '../../ui/kit';
import { Disclosure } from '../../ui/Disclosure';
import { alertFeedAge, transitAlertsUrl, type TransitSnapshot } from '../../shared/publicTransit';
import { transitColor } from './pointColors';

const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago',
});

export function TransitDetails({ data, now, vehicleCount, validThrough, tripUpdateAt }: {
  data: TransitSnapshot | undefined;
  now: number;
  vehicleCount: number;
  validThrough: number | null;
  tripUpdateAt: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [creditsExpanded, setCreditsExpanded] = useState(false);
  const alerts = data?.alerts && now < data.alerts.updatedAt + alertFeedAge ? data.alerts : null;
  const activeAlerts = alerts?.items.filter(({ endsAt }) => !endsAt || now < endsAt);

  return (
    <View style={styles.details}>
      <View style={styles.heading}>
        <Bus size={18} color={transitColor} />
        <Copy kind="strong">Milwaukee County buses</Copy>
      </View>
      <Copy kind="small" tint={color.muted}>{!data ? 'Loading transit updates…'
        : !validThrough ? 'Current bus positions are unavailable.'
        : vehicleCount ? `${vehicleCount} buses reporting · Tap a dot for route details`
        : 'No buses are reporting a current position.'}</Copy>
      {data && <Disclosure label={activeAlerts ? `Service alerts (${activeAlerts.length})` : 'Service alerts'}
        expanded={expanded} onToggle={() => setExpanded((current) => !current)}>
        {!activeAlerts?.length && <Copy kind="small" tint={color.muted}>
          {alerts ? 'No active alerts.' : 'Service alerts are unavailable here.'}
        </Copy>}
        {activeAlerts?.map(({ id, title, detail, routes, endsAt }) => (
          <View key={id} style={styles.alert}>
            <Copy kind="strong">{title}</Copy>
            {routes.length > 0 && <Copy kind="small" tint={color.muted}>Routes {routes.join(', ')}</Copy>}
            {!!detail && <Copy kind="small">{detail}</Copy>}
            {!!endsAt && <Copy kind="small" tint={color.muted}>Through {dateTime.format(endsAt)} CT</Copy>}
          </View>
        ))}
        <Btn label="Open official service alerts" quiet onPress={() => Linking.openURL(transitAlertsUrl)} />
      </Disclosure>}
      <Disclosure label="Transit data credits" expanded={creditsExpanded} onToggle={() => setCreditsExpanded((current) => !current)}>
        <Copy kind="small" tint={color.muted}>
          Transit data from MCTS. ComForce Connect is neither sponsored nor operated by MTS or MCTS.
        </Copy>
        {!!validThrough && data?.vehicles && <Copy kind="small" tint={color.muted}>
          Positions updated {dateTime.format(data.vehicles.updatedAt)} · Valid through {dateTime.format(validThrough)} CT
        </Copy>}
        {!!tripUpdateAt && vehicleCount > 0 && <Copy kind="small" tint={color.muted}>
          Stop estimates updated {dateTime.format(tripUpdateAt)} · Valid through {dateTime.format(tripUpdateAt + alertFeedAge)} CT
        </Copy>}
        {alerts && <Copy kind="small" tint={color.muted}>
          Alerts updated {dateTime.format(alerts.updatedAt)} · Valid through {dateTime.format(alerts.updatedAt + alertFeedAge)} CT
        </Copy>}
      </Disclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  details: { gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.line },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alert: { gap: 4, marginVertical: 5 },
});
