import { useContext, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, HandHeart, Share } from 'lucide-react-native';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { TabActive } from '../../ui/RetainedTab';
import { SelectMenu } from '../../ui/SelectMenu';
import { Btn, Card, Columns, Copy, Page, ProgressBar, color, row, wrap } from '../../ui/kit';
import { creditedPartners } from '../matching/directory';
import { ReportShare } from './ReportShare';
import { periodName, responseTime, type ImpactReport } from './report';
import { useImpactReport } from './useImpactReport';
import { ServiceRecords } from './ServiceRecords';
import { useDemo } from '../../state/Demo';
import { deliveredServices } from '../../domain/model';
import { useSupport } from '../partnerships/useSupport';

export default function Impact({ period }: { period?: string }) {
  const router = useRouter();
  const active = useContext(TabActive);
  const { state, shared } = useDemo();
  const { coordinator } = useSupport();
  const [provider, setProvider] = useState<string | null>(null);
  const providers = useMemo(
    () =>
      creditedPartners(
        state.partners,
        deliveredServices(state).map((service) => service.providerId),
      ),
    [state],
  );
  const providerOptions = useMemo(
    () => [
      { value: null, label: 'All providers' },
      ...providers.map(({ id, name }) => ({ value: id, label: name })),
    ],
    [providers],
  );
  const [showShare, setShowShare] = useState(false);
  if (!active && showShare) setShowShare(false);
  const { month, months, completeReport, report, requiresSignIn } = useImpactReport(period, provider);
  const periods = useMemo(
    () => [...months, null].map((value) => ({ value, label: periodName(value) })),
    [months],
  );
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 1024;
  const programCount = completeReport.programDeliveries.length;

  if (requiresSignIn) {
    return <Page title="Impact"><Card>
      <Copy>Sign in to see your workspace reports.</Copy>
      <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />
    </Card></Page>;
  }

  return (
    <Page
      title="Impact"
      mobileRight={<Btn label="Share report" icon={Share} iconOnly quiet onPress={() => setShowShare(true)} />}
      right={width >= 900 ? (
        <Btn label="Share report" icon={Share} secondary onPress={() => setShowShare(true)} />
      ) : undefined}
      titleAccessory={
        <SelectMenu
          label="Reporting period"
          value={month}
          options={periods}
          appearance="pill"
          align="start"
          onChange={(value) => router.setParams({ period: value === null ? 'all' : String(value) })}
        />
      }
    >
      <Columns
        main={
          <>
            <Overview report={report} wide={wide && fontScale < 1.3} />
            <Card style={styles.sponsorInvite}>
              <View style={row}>
                <HandHeart color={color.pine} size={24} />
                <Copy kind="title" style={styles.fill}>{coordinator ? 'Winter essentials drive' : 'Sponsor a local project'}</Copy>
              </View>
              {!coordinator && <Copy>Help fund a winter coat, stock a pantry, or bring a volunteer team.</Copy>}
              <View style={styles.recent}>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`View Winter essentials drive, ${programCount} ${programCount === 1 ? 'delivery' : 'deliveries'}`}
                  onPress={() => router.push({
                    pathname: '/impact-program',
                    params: { period: month === null ? 'all' : String(month) },
                  })}
                  style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
                >
                  <Card style={styles.workCard}>
                    <View style={styles.workIcon}><Check color={color.pine} size={22} /></View>
                    <View style={styles.fill}>
                      <Copy kind="strong">
                        {programCount} winter program {programCount === 1 ? 'delivery' : 'deliveries'}
                      </Copy>
                      <Copy kind="small" tint={color.muted}>Winter essentials drive</Copy>
                    </View>
                    <ChevronRight size={20} color={color.pine} />
                  </Card>
                </Pressable>
              </View>
              {coordinator ? (
                <Btn label="Manage project support" stretch onPress={() => router.push({
                  pathname: '/partnerships', params: { project: 'drive', action: 'coordinator' },
                })} />
              ) : (
                <Btn label="Choose a project to support" stretch onPress={() => router.push('/partnerships')} />
              )}
            </Card>
            <Card style={styles.assistance}>
              <View style={[wrap, styles.between]}>
                <Copy kind="title" style={styles.sectionTitle}>Assistance by type</Copy>
                <SelectMenu
                  label="Delivery provider"
                  value={provider}
                  options={providerOptions}
                  onChange={setProvider}
                />
              </View>
              {report.byCategory.length ? report.byCategory.map(({ name, count }) => (
                <View key={name} style={row}>
                  <Copy style={styles.category}>{name === 'Transportation' ? 'Transport' : name}</Copy>
                  <View style={styles.fill}><ProgressBar value={count} total={report.delivered} /></View>
                  <Copy kind="strong" style={styles.chartCount}>{count}</Copy>
                </View>
              )) : <Copy tint={color.muted}>No deliveries in this selection.</Copy>}
            </Card>
            <ServiceRecords key={shared.data?.account.id} />
            {wide && <ResponseMetrics report={completeReport} />}
          </>
        }
        side={
          <>
            <CommunityPartners report={completeReport} />
            {!wide && <ResponseMetrics report={completeReport} />}
          </>
        }
      />
      {active && showShare && (
        <ReportShare report={report} programDeliveries={programCount} onClose={() => setShowShare(false)} />
      )}
    </Page>
  );
}

function Overview({ report, wide }: { report: ImpactReport; wide: boolean }) {
  const stats = [
    ['Requests received', report.received],
    ['Services delivered', report.delivered],
    ['Residents assisted', report.assisted],
    ['Open referrals', report.open],
  ] as const;
  const pairs = [stats.slice(0, 2), stats.slice(2)];

  return (
    <View style={styles.statGrid}>
      {(wide ? [stats] : pairs).map((items) => (
        <View key={items[0][0]} style={styles.statRow}>
          {items.map(([label, value]) => (
            <Card key={label} style={styles.stat}>
              <Copy kind="title" style={styles.total}>{value}</Copy>
              <Copy kind="small" tint={color.muted}>{label}</Copy>
            </Card>
          ))}
        </View>
      ))}
    </View>
  );
}

function CommunityPartners({ report }: { report: ImpactReport }) {
  const { state } = useDemo();
  const partners = creditedPartners(
    state.partners,
    deliveredServices(state).map((service) => service.providerId),
  );
  return (
    <Card>
      <Copy kind="title" style={styles.sectionTitle}>Community partners</Copy>
      {partners.map(({ id, name }) => {
        const count = report.byProvider.find((provider) => provider.name === name)?.count ?? 0;
        return (
          <View key={id} style={row}>
            <View style={styles.initialsBox}>
              <Copy kind="label" tint={color.pine}>{name.split(' ').map((word) => word[0]).join('')}</Copy>
            </View>
            <Copy style={styles.fill}>{name}</Copy>
            <Copy kind="small" tint={color.muted}>{count} {count === 1 ? 'delivery' : 'deliveries'}</Copy>
          </View>
        );
      })}
    </Card>
  );
}

function ResponseMetrics({ report }: { report: ImpactReport }) {
  return (
    <Card>
      <Copy kind="title" style={styles.sectionTitle}>Referral response</Copy>
      <View style={styles.statRow}>
        <View style={styles.response}>
          <Copy kind="title">{responseTime(report.medianResponse)}</Copy>
          <Copy kind="small" tint={color.muted}>Median to first acceptance</Copy>
          {report.answered > 0 && <Copy kind="small" tint={color.muted}>{report.answered} answered</Copy>}
        </View>
        <View style={styles.response}>
          <Copy kind="title">{report.awaiting}</Copy>
          <Copy kind="small" tint={color.muted}>Awaiting acceptance</Copy>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 21, lineHeight: 27, letterSpacing: -0.5 },
  between: { justifyContent: 'space-between' },
  statGrid: { gap: 9 },
  statRow: { flexDirection: 'row', gap: 9, alignItems: 'stretch' },
  stat: { flex: 1, minWidth: 0, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  total: { fontSize: 32, lineHeight: 36, fontVariant: ['tabular-nums'] },
  sponsorInvite: { backgroundColor: color.pale, borderColor: color.pale },
  assistance: { gap: 8 },
  category: { flexBasis: 85, flexShrink: 1 },
  chartCount: { minWidth: 30, textAlign: 'right', fontVariant: ['tabular-nums'] },
  fill: { flex: 1, minWidth: 0 },
  recent: { gap: 7 },
  workCard: { ...row, paddingVertical: 12 },
  workIcon: { width: 39, height: 39, borderRadius: 20, backgroundColor: color.pale, alignItems: 'center', justifyContent: 'center' },
  initialsBox: { minWidth: 39, paddingVertical: 5, borderRadius: 8, backgroundColor: color.pale, alignItems: 'center' },
  response: { flex: 1, gap: 3, minWidth: 0, backgroundColor: color.sand, borderRadius: 12, padding: 10 },
});
