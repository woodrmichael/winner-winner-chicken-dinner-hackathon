import { useDemo } from '../../state/Demo';
import { SelectMenu } from '../../ui/SelectMenu';
import { Btn, Copy } from '../../ui/kit';
import type { ReferralAssignment } from '../../domain/types';
import { useState } from 'react';

export function WorkerAssignment({ assignment }: { assignment: ReferralAssignment }) {
  const { shared, run } = useDemo();
  const [selected, setSelected] = useState<string | null>(assignment.assignedWorker?.id ?? null);
  const [saved, setSaved] = useState('');
  if (!shared.enabled || !shared.data) return null;
  const workers = shared.data.workers;
  const options = [{ value: null, label: 'Unassigned' }, ...workers.map(({ id, name }) => ({ value: id, label: name }))];
  return <>
    <Copy kind="strong">Responsible worker</Copy>
    <Copy>{assignment.assignedWorker?.name ?? 'Unassigned'}</Copy>
    <SelectMenu label="Assign to worker" value={selected} options={options} onChange={(value) => { setSelected(value); setSaved(''); }} />
    <Btn label="Save worker assignment" secondary disabled={selected === (assignment.assignedWorker?.id ?? null)}
      onPress={async () => {
        await run({ type: 'assign-worker', assignmentId: assignment.id, workerId: selected });
        setSaved('Worker assignment saved.');
      }} />
    {!!saved && <Copy>{saved}</Copy>}
  </>;
}
