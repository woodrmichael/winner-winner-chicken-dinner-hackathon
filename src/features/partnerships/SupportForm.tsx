import { useState } from 'react';
import { newId, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field } from '../../ui/kit';
import { parseDollars, type ProjectId, type SupportEntry } from './ledger';

export function SupportForm({ project, kind, onDone }: { project: ProjectId; kind: 'offer' | 'pledge' | 'inquiry'; onDone: () => void }) {
  const { run } = useDemo();
  const [id, setId] = useState(newId);
  const [business, setBusiness] = useState('');
  const [supplies, setSupplies] = useState('');
  const [operations, setOperations] = useState('');
  const [volunteers, setVolunteers] = useState('');
  const [proposal, setProposal] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState('');
  const inquiry = kind === 'inquiry';
  async function submit() {
    const entry: SupportEntry = inquiry
      ? { kind, id, business, project, proposal, contact }
      : { kind, id, project, business, supplies: parseDollars(supplies), operations: parseDollars(operations),
          volunteers: volunteers.trim() ? Number(volunteers) : 0 };
    await run({ type: 'partnership', entry });
    setStatus(kind === 'offer' ? 'Offer sent to the coordinator for review.' :
      inquiry ? 'Inquiry sent to the coordinator.' : 'Pledge recorded.');
    setId(newId()); setBusiness(''); setSupplies(''); setOperations(''); setVolunteers(''); setProposal(''); setContact('');
  }
  if (status) return <Card><Copy kind="strong">{status}</Copy><Btn label="Done" onPress={onDone} /></Card>;
  return <Card>
    {kind === 'offer' && <Copy>Choose how much to pledge or how many volunteers to bring. The coordinator reviews your offer before listing your supporter name on the project.</Copy>}
    <Field label={inquiry ? 'Business or team name' : 'Public supporter name'} value={business} change={setBusiness} />
    {inquiry ? <>
      <Field label="Proposed support or question" value={proposal} change={setProposal} multiline />
      <Field label="Preferred contact method and details" value={contact} change={setContact} />
    </> : <>
      <Copy>{kind === 'offer' ? 'Fill in only the ways you want to help. Payment is arranged separately.' : 'Enter the amount promised for each purpose. Payments are recorded separately.'}</Copy>
      <Field label="Supplies and services ($)" keyboardType="decimal-pad" value={supplies} change={setSupplies} placeholder="0.00" />
      <Field label="Coordination and operations ($)" keyboardType="decimal-pad" value={operations} change={setOperations} placeholder="0.00" />
      <Field label="Volunteer places offered" keyboardType="number-pad" value={volunteers} change={setVolunteers} placeholder="0" />
    </>}
    <Btn label={inquiry ? 'Send inquiry' : kind === 'offer' ? 'Submit offer for review' : 'Record pledge'}
      disabled={!business.trim() || (inquiry ? !contact.trim() || !proposal.trim() : !supplies && !operations && !volunteers)}
      onPress={submit} />
  </Card>;
}
