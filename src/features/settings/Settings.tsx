import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useDemo } from '../../state/Demo';
import { Segments } from '../../ui/Segments';
import { Btn, Card, Copy, Page } from '../../ui/kit';
import { partnerName } from '../matching/directory';
import { SharedAccount } from './SharedAccount';

export function SettingsOptions({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { localProfile, shared, state, partnerId } = useDemo();
  const partner = partnerName(state.partners, partnerId);
  return (
    <>
      {localProfile ? (
        <Card>
          <Copy kind="title">Switch profile</Copy>
          <Segments
            accessibilityLabel="Account profile"
            options={['Resident', 'Partner'] as const}
            value={localProfile.role}
            onChange={localProfile.selectRole}
            label={(item) => item}
          />
          <Copy kind="strong">{shared.data?.account.name}</Copy>
          <Copy>{localProfile.role === 'Partner' ? partner : shared.data?.account.details.neighborhood}</Copy>
          {localProfile.role === 'Partner' && (
            <Btn label="Manage service availability" secondary onPress={() => {
              onNavigate?.();
              router.push({ pathname: '/partner/[id]', params: { id: partnerId } });
            }} />
          )}
        </Card>
      ) : <SharedAccount onNavigate={onNavigate} />}
      {localProfile && <Card>
        <Copy kind="strong">Partner directory</Copy>
        <Btn label="Browse partners" quiet onPress={() => {
          onNavigate?.();
          router.push('/directory');
        }} />
        <Btn label="Submit an organization" quiet onPress={() => {
          onNavigate?.();
          router.push('/partner/submit');
        }} />
      </Card>}
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
