import { useRouter } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { directory } from '../matching/directory';
import { useDemo } from '../../state/Demo';
import { SelectionRow } from '../../ui/SelectionRows';
import { Segments } from '../../ui/Segments';
import { Btn, Card, Copy, Page } from '../../ui/kit';
import { SharedAccount } from './SharedAccount';

export function SettingsOptions() {
  const { shared, role, setRole, partnerId, setPartnerId, offerReplyFrom, setOfferReplyFrom } = useDemo();

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
                {directory.map(({ id, name }) => (
                  <SelectionRow
                    key={id}
                    label={name}
                    selected={partnerId === id}
                    onPress={() => setPartnerId(id)}
                  />
                ))}
              </View>
            </View>
          )}
        </Card>
      )}
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
