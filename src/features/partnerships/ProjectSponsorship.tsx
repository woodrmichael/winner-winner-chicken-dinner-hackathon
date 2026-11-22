import { useState } from 'react';
import { Image } from 'expo-image';
import { ArrowRight, CalendarDays, ClipboardList, MapPin, Package, UsersRound } from 'lucide-react-native';
import { View } from 'react-native';
import { Btn, Card, Copy, color, row, wrap } from '../../ui/kit';
import { Disclosure } from '../../ui/Disclosure';
import { communityEvents } from '../community/model';
import { postPhoto } from '../community/postPhotos';
import { cash, funding, type Pledge, type projects } from './ledger';
import { AmountRow, ProjectFunding, section } from './ProjectFunding';

export function ProjectSponsorship({ project, pledges, delivered, sponsor, volunteer, manage, results, summary }: {
  project: typeof projects[number];
  pledges: Pledge[];
  delivered: number;
  sponsor: () => void;
  volunteer: () => void;
  manage?: () => void;
  results?: () => void;
  summary: () => void;
}) {
  const [showFunding, setShowFunding] = useState(false);
  const event = communityEvents.get(project.id);
  const photo = postPhoto(project.id, true);
  const totals = funding(pledges);
  const businesses = [...new Map(pledges.map(({ business }) => [business.toLowerCase(), business])).values()];
  const ways = [
    { icon: Package, title: 'Fund supplies', detail: project.supplies },
    { icon: ClipboardList, title: 'Cover coordination', detail: 'Help schedule pickups, organize volunteers and prepare the site.' },
    { icon: UsersRound, title: 'Bring a team', detail: 'Commit volunteer places or ask the organizer about a team shift.' },
  ];

  return <>
    <View style={{ gap: 9 }}>
      {photo && <Image source={photo.source} accessibilityLabel={photo.description} contentFit="cover" cachePolicy="memory-disk"
        transition={0} style={{ width: '100%', height: 148, borderRadius: 15 }} />}
      <View style={{ gap: 3 }}>
        {businesses[0] && <Copy kind="strong">Supported by {businesses[0]}</Copy>}
        <Copy kind="small" tint={color.muted}>Led by {project.organizer}</Copy>
        {event && <View style={[wrap, { columnGap: 12, rowGap: 4 }]}>
          <View style={[row, { gap: 5 }]}><CalendarDays size={14} color={color.muted} /><Copy kind="small" tint={color.muted}>{event.when}</Copy></View>
          <View style={[row, { gap: 5 }]}><MapPin size={14} color={color.muted} /><Copy kind="small" tint={color.muted}>{event.venue.name}</Copy></View>
        </View>}
      </View>
    </View>

    <Card>
      <ProjectFunding goal={project.goal} pledges={pledges} />
      <View style={[section, wrap, { justifyContent: 'space-between' }]}>
        <View><Copy kind="title">{delivered}</Copy><Copy kind="small" tint={color.muted}>Services delivered</Copy></View>
        <View><Copy kind="title">{totals.volunteers}</Copy><Copy kind="small" tint={color.muted}>Sponsor volunteer places</Copy></View>
      </View>
    </Card>

    <View style={{ gap: 8 }}>
      <Btn label="Sponsor this project" icon={ArrowRight} stretch onPress={sponsor} />
      <Btn label="Ask about bringing a team" stretch secondary onPress={volunteer} />
    </View>

    <Card>
      <Copy kind="title">Ways to support</Copy>
      <Copy>{project.id === 'drive'
        ? 'Help Milwaukee neighbors get warm coats and winter essentials before colder weather.'
        : 'Help Neighborhood Table pack groceries and get pantry boxes ready for local households.'}</Copy>
      {ways.map(({ icon: Icon, title, detail }) => <View key={title} style={[row, { alignItems: 'flex-start' }]}>
        <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: color.pale }}>
          <Icon size={19} color={color.pine} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Copy kind="strong">{title}</Copy>
          <Copy kind="small" tint={color.muted}>{detail}</Copy>
        </View>
      </View>)}
      <Copy kind="small" tint={color.muted}>Send a pledge for review. The coordinator will confirm the details and arrange payment.</Copy>
      <Disclosure label="Funding details" expanded={showFunding} onToggle={() => setShowFunding(!showFunding)}>
        <AmountRow label="Supplies and services" value={cash(totals.suppliesPaid)} />
        <AmountRow label="Coordination and operations" value={cash(totals.operationsPaid)} />
        {!!totals.unallocatedPaid && <AmountRow label="Opening balance" value={cash(totals.unallocatedPaid)} />}
      </Disclosure>
      {results && <Btn label="View delivery history" quiet onPress={results} />}
    </Card>

    {businesses.length ? <Card>
      <Copy kind="title">Project supporters</Copy>
      <View style={wrap}>
        {businesses.map((business) => <View key={business} style={{ borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: color.pale }}>
          <Copy kind="small" tint={color.pine}>{business}</Copy>
        </View>)}
      </View>
      <Btn label="View business summary" quiet onPress={summary} />
    </Card> : <Btn label="View business summary" quiet onPress={summary} />}
    {manage && <Btn label="Manage project support" secondary onPress={manage} />}
  </>;
}
