import { useState } from 'react';
import { View } from 'react-native';
import {
  categories,
  neighborhoods,
  type Category,
  type Neighborhood,
  type Partner,
} from '../../domain/types';
import { now, useDemo } from '../../state/Demo';
import { SelectionRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Field, color, wrap } from '../../ui/kit';

export function EditPartner({
  partner,
  asModerator = false,
  onSaved,
}: {
  partner: Partner;
  asModerator?: boolean;
  onSaved?: () => void;
}) {
  const { run } = useDemo();
  const [name, setName] = useState(partner.name);
  const [area, setArea] = useState<Neighborhood>(partner.area);
  const [offered, setOffered] = useState<Category[]>([...partner.categories]);
  const [pickup, setPickup] = useState(partner.pickup);
  const [coverage, setCoverage] = useState<Neighborhood[]>([...partner.coverageAreas]);

  function toggleCategory(category: Category) {
    setOffered((current) =>
      current.includes(category)
        ? current.filter((entry) => entry !== category)
        : [...current, category],
    );
  }

  function toggleCoverage(neighborhood: Neighborhood) {
    setCoverage((current) =>
      current.includes(neighborhood)
        ? current.filter((entry) => entry !== neighborhood)
        : [...current, neighborhood],
    );
  }

  const coverageReady = coverage.includes(area) && coverage.length > 0;

  return (
    <Card>
      <Copy kind="strong">{asModerator ? 'Edit listing' : 'Edit your listing'}</Copy>
      <Copy kind="small" tint={color.muted}>
        {asModerator
          ? 'Update this organization’s name, services, coverage, or pickup details. Removing a service drops it permanently from matching. Accepted referrals stay in Activity.'
          : 'Update your name, services, coverage, or pickup details. Removing a service here drops it permanently from matching. Use availability toggles only to pause referrals temporarily. Accepted referrals stay in Activity.'}
      </Copy>
      <Field label="Organization name" value={name} change={setName} />
      <Field label="Pickup arrangements" multiline value={pickup} change={setPickup} />
      <Copy kind="strong">Primary service area</Copy>
      <View accessibilityRole="radiogroup" accessibilityLabel="Primary service area">
        {neighborhoods.map((neighborhood) => (
          <SelectionRow
            key={neighborhood}
            label={neighborhood}
            selected={area === neighborhood}
            onPress={() => {
              setArea(neighborhood);
              if (!coverage.includes(neighborhood)) setCoverage([...coverage, neighborhood]);
            }}
          />
        ))}
      </View>
      <Copy kind="strong">Coverage areas</Copy>
      {neighborhoods.map((neighborhood) => (
        <SelectionRow
          key={neighborhood}
          label={neighborhood}
          selected={coverage.includes(neighborhood)}
          onPress={() => toggleCoverage(neighborhood)}
        />
      ))}
      <Copy kind="strong">Help offered</Copy>
      {categories
        .filter((category) => category !== 'Other')
        .map((category) => (
          <SelectionRow
            key={category}
            label={category}
            selected={offered.includes(category)}
            onPress={() => toggleCategory(category)}
          />
        ))}
      <View style={wrap}>
        <Btn
          label="Save changes"
          stretch
          disabled={!name.trim() || !offered.length || !coverageReady || !pickup.trim()}
          onPress={async () => {
            await run({
              type: 'update-partner-listing',
              partnerId: partner.id,
              name: name.trim(),
              area,
              categories: offered,
              coverageAreas: coverage.includes(area) ? coverage : [...coverage, area],
              pickup: pickup.trim(),
              at: now(),
            });
            onSaved?.();
          }}
        />
      </View>
    </Card>
  );
}
