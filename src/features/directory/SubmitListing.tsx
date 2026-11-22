import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { categories, neighborhoods, type Category, type Neighborhood } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { SelectionRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Field, Page, color, wrap } from '../../ui/kit';

export default function SubmitListing() {
  const router = useRouter();
  const { run } = useDemo();
  const [name, setName] = useState('');
  const [area, setArea] = useState<Neighborhood>('Harambee');
  const [offered, setOffered] = useState<Category[]>(['Transportation']);
  const [pickup, setPickup] = useState('');
  const [coverage, setCoverage] = useState<Neighborhood[]>(['Harambee']);

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

  return (
    <Page title="Add organization">
      <Card>
        <Copy kind="strong">Directory listing</Copy>
        <Copy kind="small" tint={color.muted}>
          ComForce reviews new listings before residents can find them or receive matching
          suggestions.
        </Copy>
        <Field label="Organization name" value={name} change={setName} placeholder="Riverwest Mutual Aid" />
        <Field
          label="Pickup arrangements"
          multiline
          value={pickup}
          change={setPickup}
          placeholder="Where and how residents should meet you"
        />
      </Card>
      <Card>
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
      </Card>
      <Card>
        <Copy kind="strong">Coverage areas</Copy>
        {neighborhoods.map((neighborhood) => (
          <SelectionRow
            key={neighborhood}
            label={neighborhood}
            selected={coverage.includes(neighborhood)}
            onPress={() => toggleCoverage(neighborhood)}
          />
        ))}
      </Card>
      <Card>
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
      </Card>
      <View style={wrap}>
        <Btn
          label="Submit for review"
          stretch
          disabled={!name.trim() || !offered.length}
          onPress={async () => {
            const id = newId();
            await run({
              type: 'submit-partner-listing',
              id,
              name: name.trim(),
              area,
              categories: offered,
              coverageAreas: coverage.length ? coverage : [area],
              pickup: pickup.trim() || undefined,
              at: now(),
            });
            router.replace('/settings');
          }}
        />
        <Btn label="Cancel" secondary onPress={() => router.back()} />
      </View>
    </Page>
  );
}
