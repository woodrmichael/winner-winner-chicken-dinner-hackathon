import { View } from 'react-native';
import { profile } from '../../domain/seed';
import type { SharedDetails } from '../../domain/types';
import { ToggleRow } from '../../ui/SelectionRows';
import { Copy } from '../../ui/kit';

export type ShareKey = keyof SharedDetails;

const labels = { firstName: 'First name', callback: 'Callback', neighborhood: 'Neighborhood' };
const fields = ['firstName', 'callback', 'neighborhood'] as const;

export function shareSummary(keys: ShareKey[]) {
  return (
    fields
      .filter((key) => keys.includes(key))
      .map((key) => labels[key])
      .join(', ') || 'Only your message'
  );
}

export function ShareDetails({
  selected,
  onChange,
  showHeading = true,
}: {
  selected: ShareKey[];
  onChange: (keys: ShareKey[]) => void;
  showHeading?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      {showHeading && <Copy kind="strong">Optional details to share</Copy>}
      <Copy kind="small">Sharing your neighborhood includes this referral in area totals.</Copy>
      <View>
        {fields.map((key) => (
          <ToggleRow
            key={key}
            label={labels[key] + ' · ' + profile[key]}
            value={selected.includes(key)}
            onChange={(enabled) =>
              onChange(enabled ? [...selected, key] : selected.filter((item) => item !== key))
            }
          />
        ))}
      </View>
    </View>
  );
}
