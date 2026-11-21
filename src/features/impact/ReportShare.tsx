import { useState } from 'react';
import { Copy as CopyIcon, Share as ShareIcon, X } from 'lucide-react-native';
import { Modal, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Btn, Card, Copy, color, row } from '../../ui/kit';
import { reportSummary, type ImpactReport } from './report';

export function ReportShare({
  report,
  programDeliveries,
  onClose,
}: {
  report: ImpactReport;
  programDeliveries: number;
  onClose: () => void;
}) {
  const [status, setStatus] = useState('');
  const summary = reportSummary(report, programDeliveries);
  const web = Platform.OS === 'web';

  async function shareReport() {
    if (!web) {
      await Share.share({ message: summary });
      return;
    }
    try {
      await globalThis.navigator.clipboard.writeText(summary);
      setStatus('Report copied.');
    } catch {
      setStatus('Select the summary to copy it manually.');
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.dialog}>
          <View style={styles.header}>
            <Copy kind="title">Share report</Copy>
            <Btn label="Close share report" icon={X} iconOnly quiet onPress={onClose} />
          </View>
          <ScrollView style={styles.scroller}>
            <Text selectable style={styles.preview}>{summary}</Text>
          </ScrollView>
          <Btn label={web ? 'Copy summary' : 'Share summary'} icon={web ? CopyIcon : ShareIcon} onPress={shareReport} />
          {status ? <Text accessibilityRole="alert" style={styles.status}>{status}</Text> : null}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#17181A80' },
  dialog: { width: '100%', maxWidth: 540, maxHeight: '92%' },
  header: { ...row, justifyContent: 'space-between' },
  scroller: { flexGrow: 0, flexShrink: 1 },
  preview: { color: color.ink, backgroundColor: color.sand, padding: 14, borderRadius: 12, fontSize: 14, lineHeight: 21 },
  status: { color: color.muted, fontSize: 14 },
});
