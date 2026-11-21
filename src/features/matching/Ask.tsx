import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { detailsToShare } from '../../domain/referrals';
import { newId, now, useDemo } from '../../state/Demo';
import { Disclosure } from '../../ui/Disclosure';
import { SelectionRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Field, Page, color, wrap } from '../../ui/kit';
import { ShareDetails, shareSummary, type ShareKey } from './ShareDetails';
import { directory } from './directory';
import { matchResources } from './match';

export default function Ask() {
  const { run, setRole, setPartnerId } = useDemo();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [review, setReview] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [shared, setShared] = useState<ShareKey[]>([]);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const { matches, needs } = matchResources(message);
  const ordered = [
    ...matches.map((match) => match.partner),
    ...directory.filter((partner) => !matches.some((match) => match.partner.id === partner.id)),
  ];
  const selected = directory.find((partner) => partner.id === recipient);

  function partnerDetail(partner: (typeof directory)[number]) {
    const match = matches.find((item) => item.partner.id === partner.id);
    return match
      ? 'Matches ' + match.covers.join(' and ').toLowerCase()
      : 'Offers ' + partner.categories.join(' and ').toLowerCase();
  }

  if (!review) {
    return (
      <Page title="Ask for help">
        <Card>
          <Field
            label="What do you need?"
            multiline
            value={message}
            change={setMessage}
            placeholder="Clothing, groceries, a ride…"
          />
          <Btn
            label="Find resources"
            stretch
            disabled={!message.trim()}
            onPress={() => {
              const partner = matches[0]?.partner.id ?? '';
              setMessage(message.trim());
              setRecipient(partner);
              setPartnerOpen(!partner);
              setSharingOpen(false);
              setReview(true);
            }}
          />
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Review referral">
      <Card style={{ gap: 4 }}>
        <Copy kind="small" tint={color.muted}>
          Send to
        </Copy>
        <Disclosure
          label={selected?.name ?? 'Choose a partner'}
          detail={selected ? partnerDetail(selected) : 'No match found. Select a partner below.'}
          expanded={partnerOpen}
          onToggle={() => setPartnerOpen(!partnerOpen)}
        >
          <View accessibilityRole="radiogroup" accessibilityLabel="Available partners">
            {ordered.map((partner) => (
              <SelectionRow
                key={partner.id}
                label={partner.name}
                detail={partnerDetail(partner)}
                selected={recipient === partner.id}
                onPress={() => {
                  setRecipient(partner.id);
                  setPartnerOpen(false);
                }}
              />
            ))}
          </View>
        </Disclosure>
      </Card>
      <Card style={{ gap: 2 }}>
        <View style={[wrap, { justifyContent: 'space-between' }]}>
          <Copy kind="strong">Your message</Copy>
          <Btn label="Edit message" quiet onPress={() => setReview(false)} />
        </View>
        <Copy>{message}</Copy>
      </Card>
      <Card style={{ paddingVertical: 10 }}>
        <Disclosure
          label="Sharing options"
          detail={shareSummary(shared)}
          expanded={sharingOpen}
          onToggle={() => setSharingOpen(!sharingOpen)}
        >
          <ShareDetails selected={shared} onChange={setShared} showHeading={false} />
        </Disclosure>
      </Card>
      <Btn
        label="Send referral"
        stretch
        disabled={!recipient || !message.trim()}
        onPress={async () => {
          await run({
            type: 'send',
            id: newId(),
            partnerId: recipient,
            message,
            needs,
            shared: detailsToShare(shared),
            at: now(),
          });
          setPartnerId(recipient);
          setRole('Resident');
          router.replace('/activity');
        }}
      />
    </Page>
  );
}
