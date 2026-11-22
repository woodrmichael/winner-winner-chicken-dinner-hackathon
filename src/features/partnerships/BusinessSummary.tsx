import { useState } from 'react';
import { View } from 'react-native';
import { useDemo } from '../../state/Demo';
import { Card, Copy, color } from '../../ui/kit';
import { SelectMenu } from '../../ui/SelectMenu';
import { communityEvents } from '../community/model';
import { partnerName } from '../matching/directory';
import { cash, funding, projects, type Pledge } from './ledger';
import { AmountRow, section } from './ProjectFunding';

export function BusinessSummary({ pledges }: { pledges: Pledge[] }) {
  const { shared, state } = useDemo();
  const deliveries = shared.data?.reporting.projectDeliveries ?? [];
  const options = [...new Map(pledges.map((p) => [p.business.toLowerCase(), p.business])).entries()]
    .map(([value, label]) => ({ value, label }));
  const [selection, setSelection] = useState(options[0]?.value);
  const business = options.find((o) => o.value === selection) ?? options[0];
  if (!business) return <Copy>No confirmed business commitments yet.</Copy>;
  const mine = pledges.filter((p) => p.business.toLowerCase() === business.value);
  const total = funding(mine);
  return <>
    <Card>
      {options.length > 1 ? <>
        <Copy kind="small" tint={color.muted}>Business</Copy>
        <SelectMenu label="Business" value={business.value} options={options} onChange={setSelection} />
      </> : <Copy kind="title">{business.label}</Copy>}
      <AmountRow label="Total committed" value={cash(total.paid + total.outstanding)} />
      <AmountRow label="Payments received" value={cash(total.paid)} />
      <AmountRow label="Outstanding" value={cash(total.outstanding)} />
    </Card>
    {projects.filter((project) => mine.some((p) => p.project === project.id)).map((project) => {
      const contributions = mine.filter((p) => p.project === project.id);
      const totals = funding(contributions);
      const payments = contributions.flatMap((p) => p.payments);
      const upcoming = project.activities.filter((a) => Date.parse(a.at) >= Date.now());
      const update = state.posts.find((p) => p.id === project.updateId && p.status !== 'hidden' && !p.group);
      const service = deliveries.find((d) => d.project === project.id);
      return <Card key={project.id}>
        <Copy kind="title">{project.event}</Copy>
        <AmountRow label="Committed" value={cash(totals.paid + totals.outstanding)} />
        <AmountRow label="Paid" value={cash(totals.paid)} />
        <AmountRow label="Outstanding" value={cash(totals.outstanding)} />
        <Copy kind="small">Payments received · {payments.map(cash).join(', ') || 'None yet'}</Copy>
        <Copy>{totals.volunteers} volunteer places committed</Copy>
        <View style={section}><Copy kind="strong">Upcoming activities</Copy>
          {!upcoming.length && <Copy tint={color.muted}>No upcoming activities scheduled.</Copy>}
          {upcoming.map((a) => { const event = communityEvents.get(a.id);
            return event && <View key={a.id}><Copy>{a.name}</Copy><Copy kind="small">{event.when} · {event.venue.name}</Copy></View>;
          })}
        </View>
        <View style={section}><Copy kind="strong">Services delivered</Copy>
          <Copy>{service?.count ? `${service.count} delivered by ${partnerName(service.providerId)}` : 'No deliveries recorded yet.'}</Copy>
          {update && <><Copy kind="strong">Project update</Copy><Copy>{update.body}</Copy></>}
        </View>
      </Card>;
    })}
  </>;
}
