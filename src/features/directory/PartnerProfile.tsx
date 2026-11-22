import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { now, useDemo } from '../../state/Demo';
import { ToggleRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Page, color, wrap } from '../../ui/kit';
import {
  approvedPartners,
  listWords,
  partnerDetail,
  serviceAvailability,
} from '../matching/directory';
import type { Category } from '../../domain/types';
import { EditPartner } from './EditPartner';

export default function PartnerProfile() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const router = useRouter();
  const { state, run, role, partnerId, shared } = useDemo();
  const partner = state.partners.find((entry) => entry.id === id);
  const isModerator = shared.enabled
    ? shared.data?.account.moderator === true
    : role === 'Moderator';
  const isOrgAdmin =
    !!partner &&
    partner.listingStatus === 'approved' &&
    (shared.enabled
      ? shared.data?.account.membership?.admin === true &&
        shared.data.account.membership.partnerId === partner.id &&
        shared.data.account.membership.status === 'approved'
      : role === 'Partner' && partnerId === partner.id);
  const canManageAvailability =
    !!partner &&
    partner.listingStatus === 'approved' &&
    (isOrgAdmin || isModerator);
  const canEdit =
    !!partner &&
    (partner.listingStatus === 'approved' || partner.listingStatus === 'pending') &&
    (isOrgAdmin || isModerator);
  const [editing, setEditing] = useState(() => canEdit && edit === '1');
  const canDelete =
    !!partner &&
    (partner.listingStatus === 'approved' || partner.listingStatus === 'pending') &&
    isModerator;
  const residentVisible =
    partner &&
    partner.listingStatus !== 'removed' &&
    (partner.listingStatus === 'approved' || isModerator);

  if (!partner || !residentVisible) {
    return (
      <Page title="Partner">
        <Card>
          <Copy>That organization is not in the directory yet.</Copy>
          <Btn label="Browse directory" secondary onPress={() => router.push('/directory')} />
        </Card>
      </Page>
    );
  }

  const others = approvedPartners(state.partners).filter((entry) => entry.id !== partner.id);

  return (
    <Page title={partner.name}>
      {partner.listingStatus === 'pending' ? (
        <Card>
          <Copy kind="strong">Pending ComForce review</Copy>
          <Copy kind="small" tint={color.muted}>
            Residents cannot find this listing until a coordinator approves it.
          </Copy>
        </Card>
      ) : null}
      {partner.listingStatus === 'declined' ? (
        <Card>
          <Copy kind="strong">Declined listing</Copy>
          <Copy kind="small" tint={color.muted}>
            {partner.declineReason?.trim()
              ? partner.declineReason
              : 'This organization was declined and stays out of the resident directory and matching.'}
          </Copy>
        </Card>
      ) : null}
      <Card>
        <Copy kind="strong">Services</Copy>
        {partner.categories.map((category) => {
          const status = serviceAvailability(partner, category);
          return (
            <Copy
              key={category}
              kind="small"
              tint={status === 'accepting' ? color.ink : color.rust}
            >
              {category} ·{' '}
              {status === 'accepting' ? 'Accepting referrals' : 'Temporarily paused'}
            </Copy>
          );
        })}
      </Card>
      <Card>
        <Copy kind="strong">Coverage</Copy>
        <Copy>
          {partner.coverageAreas.length
            ? listWords(partner.coverageAreas)
            : partner.area}
        </Copy>
        <Copy kind="small" tint={color.muted}>
          Primary neighborhood for the map: {partner.area}
        </Copy>
      </Card>
      <Card>
        <Copy kind="strong">Pickup arrangements</Copy>
        <Copy>{partner.pickup}</Copy>
        <Copy kind="small" tint={color.muted}>
          {partnerDetail(partner)}
        </Copy>
      </Card>
      {canManageAvailability ? (
        <Card>
          <Copy kind="strong">Referral availability</Copy>
          <Copy kind="small" tint={color.muted}>
            Pause a service temporarily, or tap Edit listing to permanently change what you offer.
          </Copy>
          {partner.categories.map((category: Category) => (
            <ToggleRow
              key={category}
              label={`Accept new ${category.toLowerCase()} referrals`}
              value={serviceAvailability(partner, category) === 'accepting'}
              onChange={(accepting) =>
                run({
                  type: 'set-service-availability',
                  partnerId: partner.id,
                  category,
                  accepting,
                  at: now(),
                })
              }
            />
          ))}
        </Card>
      ) : null}
      {canEdit ? (
        editing ? (
          <EditPartner
            key={`${partner.id}-${partner.name}-${partner.pickup}-${partner.categories.join(',')}`}
            partner={partner}
            asModerator={isModerator && !isOrgAdmin}
            onSaved={() => setEditing(false)}
          />
        ) : (
          <Btn label="Edit listing" secondary onPress={() => setEditing(true)} />
        )
      ) : null}
      {canDelete ? (
        <Btn
          label="Remove from directory"
          secondary
          onPress={async () => {
            await run({
              type: 'delete-partner-listing',
              partnerId: partner.id,
              at: now(),
            });
            router.replace('/directory');
          }}
        />
      ) : null}
      <View style={wrap}>
        {partner.listingStatus === 'approved' ? (
          <Btn
            label={`Request help from ${partner.name}`}
            stretch
            onPress={() => router.push({ pathname: '/ask', params: { partner: partner.id } })}
          />
        ) : null}
        <Btn label="Back to directory" secondary onPress={() => router.push('/directory')} />
      </View>
      {others.length ? (
        <Card>
          <Copy kind="strong">Compare another partner</Copy>
          {others.map((entry) => (
            <Btn
              key={entry.id}
              label={entry.name}
              quiet
              onPress={() => router.push({ pathname: '/partner/[id]', params: { id: entry.id } })}
            />
          ))}
        </Card>
      ) : null}
    </Page>
  );
}
