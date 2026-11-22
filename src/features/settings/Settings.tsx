import { useRouter } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { useDemo } from '../../state/Demo';
import { SelectionRow } from '../../ui/SelectionRows';
import { Segments } from '../../ui/Segments';
import { Btn, Card, Copy, Page } from '../../ui/kit';
import { PendingListings } from '../directory/PendingListings';
import { approvedPartners } from '../matching/directory';
import { SharedAccount } from './SharedAccount';

export function SettingsOptions() {
  const router = useRouter();
  const { state, shared, role, setRole, partnerId, setPartnerId, offerReplyFrom, setOfferReplyFrom } =
    useDemo();
  const partners = approvedPartners(state.partners);
  const pending = state.partners
    .filter((partner) => partner.listingStatus === 'pending')
    .map(({ id, name, area, categories }) => ({ id, name, area, categories }));

  return (
    <>
      {shared.enabled ? (
        <SharedAccount />
      ) : (
        <Card>
          <Copy kind="strong">Referral view</Copy>
          <Segments
            accessibilityLabel="Referral view"
            options={['Resident', 'Partner', 'Moderator'] as const}
            value={role}
            onChange={setRole}
            label={(item) => item}
          />
          {role === 'Partner' && (
            <View style={{ gap: 6 }}>
              <Copy kind="strong">Partner inbox</Copy>
              <View accessibilityRole="radiogroup" accessibilityLabel="Partner inbox">
                {partners.map(({ id, name }) => (
                  <SelectionRow
                    key={id}
                    label={name}
                    selected={partnerId === id}
                    onPress={() => setPartnerId(id)}
                  />
                ))}
              </View>
              {partnerId ? (
                <Btn
                  label="Manage service availability"
                  quiet
                  onPress={() =>
                    router.push({ pathname: '/partner/[id]', params: { id: partnerId } })
                  }
                />
              ) : null}
            </View>
          )}
          {role === 'Moderator' && <PendingListings listings={pending} />}
        </Card>
      )}
      <Card>
        <Copy kind="strong">Partner directory</Copy>
        <Btn label="Browse partners" quiet onPress={() => router.push('/directory')} />
        <Btn label="Submit an organization" quiet onPress={() => router.push('/partner/submit')} />
      </Card>
      <Card>
        <Copy kind="strong">Reply to offers as</Copy>
        <Segments
          accessibilityLabel="Reply to offers as"
          options={['resident', 'author'] as const}
          value={offerReplyFrom}
          onChange={setOfferReplyFrom}
          label={(item) => (item === 'author' ? 'Offer author' : 'Resident')}
        />
      </Card>
    </>
  );
}

export default function Settings() {
  const router = useRouter();
  const wide = useWindowDimensions().width >= 900;
  const done = <Btn label="Done" quiet onPress={() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }} />;
  return (
    <Page title="Settings" mobileRight={done} right={wide ? done : undefined}>
      <SettingsOptions />
    </Page>
  );
}
