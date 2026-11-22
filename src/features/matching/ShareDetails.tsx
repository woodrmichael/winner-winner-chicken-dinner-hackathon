import { View } from 'react-native';
import { shareFields } from '../../domain/referrals';
import { useDemo } from '../../state/Demo';
import type { SharedDetails } from '../../domain/types';
import { CheckboxRow } from '../../ui/SelectionRows';
import { Copy } from '../../ui/kit';

export type ShareKey = keyof SharedDetails;

const labels = { firstName: 'First name', callback: 'Contact number', neighborhood: 'Neighborhood' };

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
      <View>
        {shareFields.filter((key) => details[key]).map((key) => (
          <CheckboxRow
            key={key}
            label={labels[key]}
            detail={details[key] ?? ''}
            checked={selected.includes(key)}
            onChange={(enabled) =>
              onChange(enabled ? [...selected, key] : selected.filter((item) => item !== key))
            }
          />
        ))}
      </View>
    </View>
  );
}
