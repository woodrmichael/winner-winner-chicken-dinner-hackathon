import { useState } from 'react';
import { View } from 'react-native';
import { newId, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, color } from '../../ui/kit';
import { Disclosure } from '../../ui/Disclosure';
import { Segments } from '../../ui/Segments';
import { cash, parseDollars, type Pledge, type SupportBook, type ProjectId } from './ledger';
import { section } from './ProjectFunding';

function Payment({ pledge }: { pledge: Pledge }) {
  const { run } = useDemo();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [id, setId] = useState(newId);
  const [notice, setNotice] = useState('');
  const due = pledge.supplies + pledge.operations - pledge.paid;
  return <View style={section}>
    <Disclosure label={pledge.business} detail={`${cash(due)} outstanding · ${cash(pledge.paid)} paid`}
      expanded={open} onToggle={() => setOpen(!open)}>
      <Copy kind="small">{cash(pledge.supplies + pledge.operations)} committed · {pledge.volunteers} volunteer places</Copy>
      {due > 0 && <>
        <Field label="Payment received ($)" keyboardType="decimal-pad" value={amount} change={setAmount} placeholder="0.00" />
        <Btn label="Apply payment" disabled={!amount.trim()} onPress={async () => {
          const cents = parseDollars(amount);
          if (cents <= 0) throw new Error('Enter a payment greater than zero.');
          await run({ type: 'partnership', entry: { kind: 'payment', id, cents, pledgeId: pledge.id } });
          setId(newId()); setAmount(''); setNotice(`${cash(cents)} payment recorded.`);
        }} />
      </>}
      {!!notice && <View accessibilityLiveRegion="polite"><Copy tint={color.pine}>{notice}</Copy></View>}
    </Disclosure>
  </View>;
}

export function Coordinator({ project, book, tab, setTab, recordPledge }: {
  project: ProjectId; book: SupportBook; recordPledge: () => void;
  tab: 'Review' | 'Payments'; setTab: (tab: 'Review' | 'Payments') => void;
}) {
  const { run } = useDemo();
  const [notice, setNotice] = useState('');
  const offers = book.offers.filter((e) => e.project === project);
  const inquiries = book.inquiries.filter((e) => e.project === project);
  const pledges = book.pledges.filter((e) => e.project === project);
  return <>
    <Segments options={['Review', 'Payments'] as const} value={tab} onChange={setTab} label={(v) => v} accessibilityLabel="Coordinator actions" />
    {tab === 'Review' ? <Card>
      <Copy kind="title">Pending offers ({offers.length})</Copy>
      {!offers.length && <Copy tint={color.muted}>No offers awaiting review.</Copy>}
      {offers.map((e) => <View key={e.id} style={section}>
        <Copy kind="strong">{e.business}</Copy>
        <Copy>{cash(e.supplies)} for supplies · {cash(e.operations)} for operations</Copy>
        <Copy>{e.volunteers} volunteer places offered</Copy>
        <Btn label="Confirm support" onPress={async () => {
          await run({ type: 'partnership', entry: { kind: 'confirm', id: newId(), offerId: e.id } });
          setNotice(`Support confirmed for ${e.business}.`);
        }} />
      </View>)}
      {!!notice && <View accessibilityLiveRegion="polite"><Copy tint={color.pine}>{notice}</Copy></View>}
      <View style={section}><Copy kind="title">Inquiries ({inquiries.length})</Copy>
        {!inquiries.length && <Copy tint={color.muted}>No inquiries for this project.</Copy>}
        {inquiries.map((e) => <View key={e.id} style={{ gap: 4 }}>
          <Copy kind="strong">{e.business}</Copy><Copy>{e.proposal}</Copy><Copy kind="small">Preferred contact · {e.contact}</Copy>
        </View>)}
      </View>
    </Card> : <Card>
      <Copy kind="title">Pledges and payments</Copy>
      <Btn label="Record an agreed pledge" secondary onPress={recordPledge} />
      {!pledges.length && <Copy tint={color.muted}>No confirmed pledges for this project.</Copy>}
      {pledges.map((pledge) => <Payment key={pledge.id} pledge={pledge} />)}
    </Card>}
  </>;
}
