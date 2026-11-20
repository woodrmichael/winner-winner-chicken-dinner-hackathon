import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LockKeyhole, Search } from 'lucide-react-native';
import { View } from 'react-native';
import { profile } from '../../domain/seed';
import type { SharedDetails } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, Page, color, row, wrap } from '../../ui/kit';
import { SelectionRow, ToggleRow } from '../../ui/SelectionRows';
import { directory } from './directory';
import { example, matchResources } from './match';

export default function Ask() {
  const { run, setRole, setPartnerId } = useDemo();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [review, setReview] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [shared, setShared] = useState<SharedDetails>({});
  const { matches, needs } = matchResources(review ? message : description);
  const ordered = [
    ...matches.map((m) => m.partner),
    ...directory.filter((p) => !matches.some((m) => m.partner.id === p.id)),
  ];
  return (
    <Page title={review ? 'Review your referral' : 'Ask for help'}>
      <Card>
        <View style={row}>
          <LockKeyhole size={17} color={color.pine} />
          <Copy kind="strong">Private request</Copy>
        </View>
        {!review ? (
          <>
            <Copy>Choose who receives your message and which details to share.</Copy>
            <Field
              label="What do you need?"
              multiline
              value={description}
              change={setDescription}
              placeholder="Clothing, groceries, a ride…"
            />
            <View style={wrap}>
              <Btn
                label="Find resources"
                icon={Search}
                disabled={!description.trim()}
                onPress={() => {
                  setMessage(description.trim());
                  setRecipient(matches[0]?.partner.id ?? '');
                  setReview(true);
                }}
              />
              <Btn label="Clothing and a ride" secondary onPress={() => setDescription(example)} />
            </View>
          </>
        ) : (
          <>
            <Field label="Message to share" multiline value={message} change={setMessage} />
            <Copy kind="strong">Choose a partner</Copy>
            <Copy kind="small" tint={color.muted}>
              {needs.length
                ? 'Needs identified: ' + needs.join(' and ') + '.'
                : 'No directory match found. You can select a partner manually.'}
            </Copy>
            <View accessibilityRole="radiogroup" accessibilityLabel="Choose a partner">
              {ordered.map((partner) => {
                const match = matches.find((entry) => entry.partner.id === partner.id);
                return (
                  <SelectionRow
                    key={partner.id}
                    label={partner.name}
                    detail={
                      match
                        ? 'Matches ' + match.covers.join(' and ').toLowerCase()
                        : 'Offers ' + partner.categories.join(' and ').toLowerCase()
                    }
                    selected={recipient === partner.id}
                    onPress={() => setRecipient(partner.id)}
                  />
                );
              })}
            </View>
            <Copy kind="strong">Optional details to share</Copy>
            <Copy kind="small">
              Sharing your neighborhood includes this referral in area totals.
            </Copy>
            <View>
              {(['firstName', 'callback', 'neighborhood'] as const).map((key) => (
                <ToggleRow
                  key={key}
                  label={
                    { firstName: 'First name', callback: 'Callback', neighborhood: 'Neighborhood' }[
                      key
                    ] +
                    ' · ' +
                    profile[key]
                  }
                  value={!!shared[key]}
                  onChange={(enabled) =>
                    setShared((previous) => {
                      const next = { ...previous };
                      if (enabled) Object.assign(next, { [key]: profile[key] });
                      else delete next[key];
                      return next;
                    })
                  }
                />
              ))}
            </View>
            <View style={wrap}>
              <Btn
                label="Send referral"
                disabled={!recipient || !message.trim()}
                onPress={async () => {
                  await run({
                    type: 'send',
                    id: newId(),
                    partnerId: recipient,
                    message,
                    needs,
                    shared,
                    at: now(),
                  });
                  setPartnerId(recipient);
                  setRole('Resident');
                  router.replace('/activity');
                }}
              />
              <Btn
                label="Edit request"
                secondary
                onPress={() => {
                  setDescription(message);
                  setReview(false);
                }}
              />
            </View>
          </>
        )}
      </Card>
    </Page>
  );
}
