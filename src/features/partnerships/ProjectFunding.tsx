import { StyleSheet, View } from 'react-native';
import { Copy, ProgressBar, color, wrap } from '../../ui/kit';
import { cash, funding, type Pledge } from './ledger';

export const section = { borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.line, paddingTop: 14, gap: 8 };

export function ProjectFunding({ pledges, goal, details = false }: {
  pledges: Pledge[]; goal: number; details?: boolean;
}) {
  const totals = funding(pledges);
  return <View style={{ gap: 8 }}>
    <View style={[wrap, { alignItems: 'baseline', gap: 5 }]}>
      <Copy kind="title">{cash(totals.paid)} received</Copy>
      <Copy tint={color.muted}>of {cash(goal * 100)} goal</Copy>
    </View>
    <ProgressBar value={totals.paid / 100} total={goal} height={10} />
    <Copy kind="small">{cash(totals.outstanding)} in outstanding pledges</Copy>
    {details && <View style={section}>
      <Copy kind="strong">Received by purpose</Copy>
      <AmountRow label="Supplies and services" value={cash(totals.suppliesPaid)} />
      <AmountRow label="Coordination and operations" value={cash(totals.operationsPaid)} />
      {!!totals.unallocatedPaid && <AmountRow label="Earlier receipts without a recorded purpose" value={cash(totals.unallocatedPaid)} />}
    </View>}
  </View>;
}

export function AmountRow({ label, value }: { label: string; value: string }) {
  return <View style={[wrap, { justifyContent: 'space-between', alignItems: 'baseline' }]}>
    <Copy tint={color.muted} style={{ flexShrink: 1 }}>{label}</Copy>
    <Copy kind="strong" style={{ fontVariant: ['tabular-nums'] }}>{value}</Copy>
  </View>;
}
