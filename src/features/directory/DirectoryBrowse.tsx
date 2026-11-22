import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useDemo } from '../../state/Demo';
import { SelectionRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Page, color } from '../../ui/kit';
import { approvedPartners, listWords, pausedServiceLine, partnerDetail } from '../matching/directory';

export default function DirectoryBrowse() {
  const router = useRouter();
  const { state, role } = useDemo();
  const partners =
    role === 'Moderator'
      ? state.partners.filter((partner) => partner.listingStatus !== 'removed')
      : approvedPartners(state.partners);
  const transportation = partners.filter((partner) =>
    partner.categories.includes('Transportation'),
  );

  return (
    <Page title="Partner directory">
      <Card>
        <Copy kind="strong">Compare providers</Copy>
        <Copy kind="small" tint={color.muted}>
          Open two profiles to compare services, coverage areas, and pickup arrangements before sending
          a request.
        </Copy>
        {transportation.length ? (
          <Copy kind="small" tint={color.muted}>
            Transportation providers: {transportation.map((p) => p.name).join(' · ')}
          </Copy>
        ) : null}
        <View accessibilityRole="radiogroup" accessibilityLabel="Partner directory">
          {partners.map((partner) => {
            const paused = pausedServiceLine(partner);
            return (
              <SelectionRow
                key={partner.id}
                label={
                  partner.listingStatus === 'pending'
                    ? `${partner.name} (pending)`
                    : partner.listingStatus === 'declined'
                      ? `${partner.name} (declined)`
                      : partner.listingStatus === 'removed'
                        ? `${partner.name} (removed)`
                        : partner.name
                }
                detail={
                  partner.listingStatus === 'declined' && partner.declineReason
                    ? `Declined · ${partner.declineReason}`
                    : paused
                      ? `${listWords(partner.categories)} · ${listWords(partner.coverageAreas)} · ${paused}`
                      : partnerDetail(partner)
                }
                selected={false}
                onPress={() =>
                  router.push({ pathname: '/partner/[id]', params: { id: partner.id } })
                }
              />
            );
          })}
        </View>
      </Card>
      <Btn label="Submit an organization" secondary onPress={() => router.push('/partner/submit')} />
    </Page>
  );
}
