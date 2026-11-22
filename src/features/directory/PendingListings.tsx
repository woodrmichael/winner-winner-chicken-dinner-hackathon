import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { now, useDemo } from '../../state/Demo';
import { Disclosure } from '../../ui/Disclosure';
import { Btn, Copy, Field, color } from '../../ui/kit';
import { listWords, partnerDetail } from '../matching/directory';

type Listing = { id: string; name: string; area: string; categories: string[] };

export function PendingListings({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const { run, state } = useDemo();
  const [partnersOpen, setPartnersOpen] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const existing = state.partners.filter(
    (partner) => partner.listingStatus === 'approved' || partner.listingStatus === 'pending',
  );
  const declined = state.partners.filter((partner) => partner.listingStatus === 'declined');
  const [declinedOpen, setDeclinedOpen] = useState(false);

  function openPartner(id: string, edit = false) {
    router.push({
      pathname: '/partner/[id]',
      params: edit ? { id, edit: '1' } : { id },
    });
  }

  function feedbackFor(id: string) {
    return feedback[id] ?? '';
  }

  return (
    <View style={{ gap: 10 }}>
      <Copy kind="strong">Directory listings</Copy>
      <Copy kind="small" tint={color.muted}>
        Moderators can approve new organizations and edit or remove any listing.
      </Copy>
      <Copy kind="strong">Pending review</Copy>
      {!listings.length ? <Copy>No pending listings.</Copy> : null}
      {listings.map((listing) => (
        <View key={listing.id} style={{ gap: 6 }}>
          <Copy>
            {listing.name} · {listing.area} · {listWords(listing.categories)}
          </Copy>
          <Btn
            label={`Approve ${listing.name}`}
            onPress={() =>
              run({
                type: 'approve-partner-listing',
                partnerId: listing.id,
                at: now(),
              })
            }
          />
          <Field
            label="Decline feedback (optional)"
            multiline
            value={feedbackFor(listing.id)}
            change={(value) => setFeedback((current) => ({ ...current, [listing.id]: value }))}
            placeholder="Why this listing is being declined"
          />
          <Btn
            label={`Decline ${listing.name}`}
            secondary
            onPress={async () => {
              const reason = feedbackFor(listing.id).trim();
              await run({
                type: 'decline-partner-listing',
                partnerId: listing.id,
                at: now(),
                ...(reason ? { reason } : {}),
              });
              setFeedback((current) => {
                const next = { ...current };
                delete next[listing.id];
                return next;
              });
            }}
          />
          <Btn label="Edit listing" quiet onPress={() => openPartner(listing.id, true)} />
        </View>
      ))}
      <Disclosure
        label="Existing partners"
        detail={
          existing.length
            ? `${existing.length} listing${existing.length === 1 ? '' : 's'} · edit any partner below`
            : 'No partners in the directory yet'
        }
        expanded={partnersOpen}
        onToggle={() => setPartnersOpen(!partnersOpen)}
      >
        <View style={{ gap: 10 }} accessibilityLabel="Existing partners">
          {!existing.length ? (
            <Copy kind="small" tint={color.muted}>
              Approved and pending partners will appear here.
            </Copy>
          ) : (
            existing.map((partner) => (
              <View key={partner.id} style={{ gap: 4 }}>
                <Copy kind="strong">
                  {partner.listingStatus === 'pending'
                    ? `${partner.name} (pending)`
                    : partner.name}
                </Copy>
                <Copy kind="small" tint={color.muted}>
                  {partnerDetail(partner)}
                </Copy>
                <Btn label="Edit listing" quiet onPress={() => openPartner(partner.id, true)} />
              </View>
            ))
          )}
        </View>
      </Disclosure>
      <Disclosure
        label="Declined listings"
        detail={
          declined.length
            ? `${declined.length} declined · optional feedback kept for moderators`
            : 'No declined listings'
        }
        expanded={declinedOpen}
        onToggle={() => setDeclinedOpen(!declinedOpen)}
      >
        <View style={{ gap: 10 }} accessibilityLabel="Declined listings">
          {!declined.length ? (
            <Copy kind="small" tint={color.muted}>
              Declined organizations and any feedback will appear here.
            </Copy>
          ) : (
            declined.map((partner) => (
              <View key={partner.id} style={{ gap: 4 }}>
                <Copy kind="strong">{partner.name}</Copy>
                <Copy kind="small" tint={color.muted}>
                  {partner.declineReason?.trim()
                    ? partner.declineReason
                    : 'Declined without feedback.'}
                </Copy>
                <Btn label="Open listing" quiet onPress={() => openPartner(partner.id)} />
              </View>
            ))
          )}
        </View>
      </Disclosure>
    </View>
  );
}
