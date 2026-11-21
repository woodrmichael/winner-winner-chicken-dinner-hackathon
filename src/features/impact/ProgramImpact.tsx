import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';
import { program } from '../../domain/seed';
import { Btn, Card, Columns, Copy, Page, ProgressBar, color, row, wrap } from '../../ui/kit';
import { dollars } from './report';
import { useImpactReport } from './useImpactReport';

const pageSize = 8;

export default function ProgramImpact() {
  const router = useRouter();
  const { period } = useLocalSearchParams<{ period?: string }>();
  const [historyLimit, setHistoryLimit] = useState(0);
  const { report } = useImpactReport(period);
  const deliveries = report.programDeliveries;

  return (
    <Page
      title={program.name}
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
            <Copy kind="strong">Supported by {program.sponsor}</Copy>
            <Card>
              <View style={styles.funding}>
                <Copy kind="title">{dollars.format(program.received)} received</Copy>
                <Copy tint={color.muted}>of {dollars.format(program.goal)} goal</Copy>
              </View>
              <ProgressBar value={program.received} total={program.goal} />
              <Copy style={styles.pledge}>{dollars.format(program.pledged)} pledged</Copy>
            </Card>
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
  funding: { gap: 2 },
  pledge: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.line, paddingTop: 9 },
  progress: { gap: 12 },
  check: { backgroundColor: color.pine, width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  record: { gap: 2, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.line },
  between: { justifyContent: 'space-between' },
});
