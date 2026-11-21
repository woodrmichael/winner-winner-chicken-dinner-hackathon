import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';
import { ProjectFunding, section } from '../partnerships/ProjectFunding';
import { Btn, Card, Columns, Copy, Page, color, row, wrap } from '../../ui/kit';
import { funding, cash, projects } from '../partnerships/ledger';
import { useSupport } from '../partnerships/useSupport';
import { useImpactReport } from './useImpactReport';

const pageSize = 8;

export default function ProgramImpact() {
  const router = useRouter();
  const { period } = useLocalSearchParams<{ period?: string }>();
  const [historyLimit, setHistoryLimit] = useState(0);
  const { report } = useImpactReport(period);
  const deliveries = report.programDeliveries;
  const { book } = useSupport();
  const pledges = book?.pledges.filter((p) => p.project === 'drive') ?? [];
  const project = projects.find((p) => p.id === 'drive')!;

  return (
    <Page
      title={project.event}
      back={
        <Btn
          label="Back to impact"
          icon={ChevronLeft}
          quiet
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace({ pathname: '/impact', params: period ? { period } : {} });
          }}
        />
      }
    >
      <Columns
        main={
          <>
            <Image
              source={require('../../../assets/clothing-rack.jpg')}
              accessibilityLabel="Winter clothing ready for distribution"
              resizeMode="cover"
              style={styles.photo}
            />
            <Copy kind="strong">Organized by {project.organizer}</Copy>
            <Btn label="Sponsor this project" stretch onPress={() => router.push({ pathname: '/partnerships', params: { project: project.id, action: 'offer' } })} />
            <Btn label="Team inquiries and project details" quiet onPress={() => router.push({ pathname: '/partnerships', params: { project: project.id } })} />
            {book && <Card>
              <ProjectFunding pledges={pledges} goal={project.goal} details />
              <View style={section}>
                <Copy kind="strong">Contributing businesses</Copy>
                {Array.from(new Set(pledges.map((p) => p.business.toLowerCase()))).map((key) => {
                  const contributions = pledges.filter((p) => p.business.toLowerCase() === key);
                  const contribution = funding(contributions);
                  return <View key={key}>
                    <Copy>{contributions[0].business}</Copy>
                    <Copy kind="small" tint={color.muted}>{cash(contribution.paid)} received · {cash(contribution.outstanding)} outstanding</Copy>
                  </View>;
                })}
              </View>
            </Card>}
          </>
        }
        side={
          <View style={styles.progress}>
            <Copy kind="title">Program progress</Copy>
            <View style={row}>
              <View style={styles.check}><Check size={15} color={color.paper} /></View>
              <Copy style={styles.grow}>
                {deliveries.length} {deliveries.length === 1 ? 'service' : 'services'} delivered · {report.period}
              </Copy>
            </View>
            {deliveries.length > 0 && (
              <Btn
                label={historyLimit ? 'Hide delivery history' : 'View delivery history'}
                onPress={() => setHistoryLimit(historyLimit ? 0 : pageSize)}
                secondary={historyLimit > 0}
                stretch
              />
            )}
            {historyLimit > 0 && (
              <Card>
                {deliveries.slice(0, historyLimit).map(({ key, category, date, provider }) => (
                  <View key={key} style={styles.record}>
                    <View style={[wrap, styles.between]}>
                      <Copy kind="strong">{category}</Copy>
                      <Copy kind="small" tint={color.muted}>{date}</Copy>
                    </View>
                    <Copy kind="small">{provider}</Copy>
                  </View>
                ))}
                {historyLimit < deliveries.length && (
                  <Btn label="Show more deliveries" quiet onPress={() => setHistoryLimit(historyLimit + pageSize)} />
                )}
              </Card>
            )}
          </View>
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 168, borderRadius: 15 },
  progress: { gap: 12 },
  check: { backgroundColor: color.pine, width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  record: { gap: 2, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.line },
  between: { justifyContent: 'space-between' },
});
