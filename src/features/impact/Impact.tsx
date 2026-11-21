import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronDown, ChevronRight, Share } from 'lucide-react-native';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { program } from '../../domain/seed';
import { useDemo } from '../../state/Demo';
import { useMobileHeaderAction } from '../../ui/MobileHeaderAction';
import { SelectionRow } from '../../ui/SelectionRows';
import { Btn, Card, Columns, Copy, Page, ProgressBar, color, row, wrap } from '../../ui/kit';
import { directory } from '../matching/directory';
import { ReportShare } from './ReportShare';
import { impactReport, periodName, reportMonths, responseTime, selectedReportMonth, type ImpactReport } from './report';

export default function Impact() {
  const { state } = useDemo();
  const router = useRouter();
  const { period } = useLocalSearchParams<{ period?: string }>();
  const [picker, setPicker] = useState<'period' | 'provider' | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const month = useMemo(() => selectedReportMonth(period, state), [period, state]);
  const completeReport = useMemo(() => impactReport(state, month, null), [state, month]);
  const report = useMemo(
    () => provider ? impactReport(state, month, provider) : completeReport,
    [state, month, provider, completeReport],
  );
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 1024;
  const programCount = completeReport.programDeliveries.length;
  const shareAction = useMemo(() => (
    <Btn label="Share report" icon={Share} iconOnly quiet onPress={() => setShowShare(true)} />
  ), []);
  useMobileHeaderAction(shareAction);

  return (
    <Page
      title="Our impact"
      right={width >= 900 ? (
        <Btn label="Share report" icon={Share} secondary onPress={() => setShowShare(true)} />
      ) : undefined}
      subtitle={
        <Btn
          label={report.period}
          icon={ChevronDown}
          quiet
          expanded={picker === 'period'}
          onPress={() => setPicker(picker === 'period' ? null : 'period')}
        />
      }
    >
      {picker === 'period' && (
        <Card>
          <Copy kind="strong">Reporting period</Copy>
          <View accessibilityRole="radiogroup" accessibilityLabel="Reporting period">
            {[...reportMonths(state), null].map((choice) => (
              <SelectionRow
                key={choice ?? 'all'}
                label={periodName(choice)}
                selected={month === choice}
                onPress={() => {
                  router.setParams({ period: choice === null ? 'all' : String(choice) });
                  setPicker(null);
                }}
              />
            ))}
          </View>
        </Card>
      )}

      <Columns
        main={
          <>
            <Overview report={report} wide={wide && fontScale < 1.3} />
            <Card style={styles.assistance}>
              <View style={[wrap, styles.between]}>
                <Copy kind="title" style={styles.sectionTitle}>Assistance by type</Copy>
                <Btn
                  label={report.provider}
                  icon={ChevronDown}
                  quiet
                  expanded={picker === 'provider'}
                  onPress={() => setPicker(picker === 'provider' ? null : 'provider')}
                />
              </View>
              {picker === 'provider' && (
                <View accessibilityRole="radiogroup" accessibilityLabel="Delivery provider">
                  {[{ id: null, name: 'All providers' }, ...directory].map(({ id, name }) => (
                    <SelectionRow
                      key={id ?? 'all'}
                      label={name}
                      selected={provider === id}
                      onPress={() => {
                        setProvider(id);
                        setPicker(null);
                      }}
                    />
                  ))}
                </View>
              )}
              {report.byCategory.length ? report.byCategory.map(({ name, count }) => (
                <View key={name} style={row}>
                  <Copy style={styles.category}>{name === 'Transportation' ? 'Transport' : name}</Copy>
                  <View style={styles.fill}><ProgressBar value={count} total={report.delivered} /></View>
                  <Copy kind="strong" style={styles.chartCount}>{count}</Copy>
                </View>
              )) : <Copy tint={color.muted}>No deliveries in this selection.</Copy>}
            </Card>
            {wide && <ResponseMetrics report={completeReport} />}
          </>
        }
        side={
          <>
            <View style={styles.recent}>
              <Copy kind="title" style={styles.sectionTitle}>Recent work</Copy>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`View ${program.name}, ${programCount} ${programCount === 1 ? 'delivery' : 'deliveries'}`}
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
                    <Copy kind="small" tint={color.muted}>{program.name}</Copy>
                  </View>
                  <ChevronRight size={20} color={color.pine} />
                </Card>
              </Pressable>
            </View>
            <CommunityPartners report={completeReport} />
            {!wide && <ResponseMetrics report={completeReport} />}
          </>
        }
      />
      {showShare && (
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
  return (
    <Card>
      <Copy kind="title" style={styles.sectionTitle}>Community partners</Copy>
      {directory.map(({ id, name }) => {
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
