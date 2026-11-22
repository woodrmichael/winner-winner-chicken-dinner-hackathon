import { View } from 'react-native';
import { shareFields } from '../../domain/referrals';
import { useDemo } from '../../state/Demo';
import type { SharedDetails } from '../../domain/types';
import { ToggleRow } from '../../ui/SelectionRows';
import { Copy } from '../../ui/kit';
import { listWords } from './directory';

export type ShareKey = keyof SharedDetails;

const labels = { firstName: 'First name', callback: 'Callback', neighborhood: 'Neighborhood' };

export function shareSummary(keys: ShareKey[]) {
  return (
    listWords(
      shareFields.filter((key) => keys.includes(key)).map((key) => labels[key]),
    ) || 'Only your message'
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
  const details: SharedDetails = shared.data?.account.details ?? {};
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
