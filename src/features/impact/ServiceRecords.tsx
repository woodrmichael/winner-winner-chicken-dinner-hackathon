import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Download } from 'lucide-react-native';
import { categories, type Category, type Service } from '../../domain/types';
import { useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, color, wrap } from '../../ui/kit';
import { SelectMenu } from '../../ui/SelectMenu';
import { Segments } from '../../ui/Segments';
import { partnerName } from '../matching/directory';
import { periodName, reportingMonth, reportMonths, serviceRecordsCsv } from './report';

type RecordRow = Service & { referralId: string };

export function ServiceRecords() {
  const { state, role, partnerId, shared, run } = useDemo();
  const [period, setPeriod] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [category, setCategory] = useState<Category>('Clothing');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const account = shared.data?.account;
  const membershipPartner = account?.membership?.partnerId;
  const providerId = shared.enabled
    ? account?.membership?.status === 'approved' ? membershipPartner : undefined
    : role === 'Partner' ? partnerId : undefined;

  const records = useMemo<RecordRow[]>(() => {
    if (shared.enabled) return shared.data?.reporting.serviceRecords ?? [];
    if (!providerId) return [];
    return state.referrals.flatMap((referral) =>
      referral.services
        .filter((service) => service.providerId === providerId)
        .map((service) => ({ ...service, referralId: referral.id })),
    );
  }, [providerId, shared.enabled, shared.data, state.referrals]);

  const months = useMemo(() => {
    if (shared.enabled) return shared.data?.reporting.impactReports.months ?? reportMonths(state);
    return reportMonths(state);
  }, [shared.enabled, shared.data, state]);
  const options = useMemo(
    () => [{ value: null, label: 'All time' }, ...months.map((value) => ({ value, label: periodName(value) }))],
    [months],
  );
  const filtered = records.filter((record) =>
    period === null || reportingMonth(record.deliveredAt) === period,
  );
  const active = filtered.filter((record) => !record.voidedAt);
  const selected = records.find((record) => record.id === selectedId);

  function exportCsv() {
    const csv = serviceRecordsCsv(active);
    if (typeof document !== 'undefined') {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `service-records-${period === null ? 'all-time' : periodName(period).replaceAll(' ', '-').toLowerCase()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setFeedback(`${active.length} service records exported.`);
    }
  }

  async function correct(voidRecord: boolean) {
    if (!selected || !providerId) return;
    await run({
      type: 'correct-service',
      id: selected.referralId,
      partnerId: providerId,
      serviceId: selected.id,
      category: voidRecord ? undefined : category,
      void: voidRecord,
      reason,
      workerId: account?.id ?? 'demo-worker',
      workerName: account?.name ?? partnerName(providerId),
      at: new Date().toISOString(),
    });
    setReason('');
    setFeedback(voidRecord ? 'Delivery voided.' : 'Delivery category corrected.');
  }

  if (!providerId) return null;
  return (
    <Card>
      <Copy kind="title">Service records</Copy>
      <Copy kind="small" tint={color.muted}>
        Only {partnerName(providerId)} records are shown.
      </Copy>
      <View style={wrap}>
        <SelectMenu label="Reporting period" value={period} options={options} onChange={setPeriod} />
        <Btn
          label={`Export ${active.length} records`}
          icon={Download}
          secondary
          disabled={active.length === 0}
          onPress={exportCsv}
        />
      </View>
      {filtered.length === 0 && <Copy tint={color.muted}>No service records in this period.</Copy>}
      {filtered.map((record) => (
        <View key={record.id} style={{ gap: 5, borderTopWidth: 1, borderColor: color.line, paddingTop: 10 }}>
          <Btn
            label={`${new Date(record.deliveredAt).toLocaleDateString()} · ${record.category}${record.voidedAt ? ' · Voided' : ''}`}
            secondary={selectedId !== record.id}
            onPress={() => {
              setSelectedId(record.id);
              setCategory(record.category);
            }}
          />
          {record.voidedAt && (
            <Copy kind="small" tint={color.rust}>
              Void reason: {record.corrections.find((item) => item.kind === 'void')?.reason ?? 'Recorded correction'}
            </Copy>
          )}
        </View>
      ))}
      {selected && !selected.voidedAt && (
        <View style={{ gap: 8 }}>
          <Copy kind="strong">Correct selected record</Copy>
          <Segments
            accessibilityLabel="Corrected category"
            options={categories}
            value={category}
            onChange={setCategory}
            label={(item) => item}
          />
          <Field label="Correction reason" value={reason} change={setReason} multiline />
          <View style={wrap}>
            <Btn
              label="Correct category"
              disabled={!reason.trim()}
              onPress={() => correct(false)}
            />
            <Btn
              label="Void delivery"
              secondary
              disabled={!reason.trim()}
              onPress={() => correct(true)}
            />
          </View>
        </View>
      )}
      {feedback ? <Copy kind="small" tint={color.pine}>{feedback}</Copy> : null}
    </Card>
  );
}
