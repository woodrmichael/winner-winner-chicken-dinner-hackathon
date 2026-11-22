import { View } from 'react-native';
import { shareFields } from '../../domain/referrals';
import { profile } from '../../domain/seed';
import { useDemo } from '../../state/Demo';
import type { SharedDetails } from '../../domain/types';
import { ToggleRow } from '../../ui/SelectionRows';
import { Copy } from '../../ui/kit';

export type ShareKey = keyof SharedDetails;

const labels = { firstName: 'First name', callback: 'Callback', neighborhood: 'Neighborhood' };

export function shareSummary(keys: ShareKey[]) {
  return (
    shareFields
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
  const { shared } = useDemo();
  const details: SharedDetails = shared.enabled ? shared.data?.account.details ?? {} : profile;
  return (
    <View style={{ gap: 6 }}>
      {showHeading && <Copy kind="strong">Optional details to share</Copy>}
      <Copy kind="small">Sharing your neighborhood includes this referral in area totals.</Copy>
      <View>
        {shareFields.filter((key) => details[key]).map((key) => (
          <ToggleRow
            key={key}
            label={labels[key] + ' · ' + details[key]}
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
