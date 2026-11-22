import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDemo } from '../../state/Demo';
import { partnerName } from '../matching/directory';
import { View } from 'react-native';
import { Btn, Card, Copy, Page, color } from '../../ui/kit';
import { BackButton } from '../../ui/BackButton';
import { communityEvents } from '../community/model';
import { BusinessSummary } from './BusinessSummary';
import { Coordinator } from './Coordinator';
import { funding, projects, type ProjectId } from './ledger';
import { ProjectFunding, section } from './ProjectFunding';
import { SupportForm } from './SupportForm';
import { useSupport } from './useSupport';

type Action = 'offer' | 'inquiry' | 'coordinator' | 'pledge' | 'summary';
const titles = { offer: 'Offer support', inquiry: 'Ask about bringing a team', coordinator: 'Manage project support',
  pledge: 'Record an agreed pledge', summary: 'Business summary' };

export default function Partnerships() {
  const router = useRouter();
  const { project: id, action, tab } = useLocalSearchParams<{ project?: string; action?: Action; tab?: string }>();
  const { book, coordinator } = useSupport();
  const { shared } = useDemo();
  const deliveries = shared.data?.reporting.projectDeliveries ?? [];
  const service = deliveries.find((d) => d.project === id);
  const project = projects.find((p) => p.id === id);
  const event = project && communityEvents.get(project.id);
  const restricted = action === 'coordinator' || action === 'pledge';
  const view = action && Object.hasOwn(titles, action) && (!restricted || coordinator) &&
    (project || action === 'summary') ? action : undefined;
  const pledges = book?.pledges.filter((p) => p.project === project?.id) ?? [];
  const totals = funding(pledges);
  const supporters = [...new Map(pledges.map((p) => [p.business.toLowerCase(), p.business])).values()];
  function open(action?: Action, projectId: ProjectId | undefined = project?.id) {
    router.push({ pathname: '/partnerships', params: { ...(projectId && { project: projectId }), ...(action && { action }) } });
  }
  function back() {
    if (router.canGoBack()) router.back();
    else if (view && project) router.replace({ pathname: '/partnerships', params: { project: project.id } });
    else router.replace('/impact');
  }
  return <Page key={`${id}-${view}`} title={view ? titles[view] : project?.event ?? 'Support a local project'}
    back={<BackButton onPress={back} />}>
    {!book ? <Card>
      <Copy>Sign in to open the shared partnerships workspace.</Copy>
      <Btn label="Open settings" onPress={() => router.push('/settings')} />
    </Card> : view === 'summary' ? <BusinessSummary pledges={book.pledges} /> : !project ? <>
      <Card><Copy kind="title">Choose a project</Copy>
        {projects.map((item) => <View key={item.id} style={section}>
          <Copy kind="small" tint={color.muted}>{item.organizer}</Copy>
          <Copy>{item.supplies}</Copy>
          <Btn label={item.event} stretch onPress={() => open(undefined, item.id)} />
        </View>)}
      </Card>
      <Btn label="View business summary" secondary onPress={() => open('summary')} />
    </> : <>
      {!view ? <>
        <View style={{ gap: 4 }}>
          <Copy kind="strong">Organized by {project.organizer}</Copy>
          {event && <><Copy>{event.when}</Copy><Copy tint={color.muted}>{event.venue.name}</Copy></>}
        </View>
        <View style={{ gap: 8 }}>
          <Btn label="Offer support" stretch onPress={() => open('offer')} />
          <Btn label="Ask about bringing a team" secondary stretch onPress={() => open('inquiry')} />
        </View>
        {coordinator && <Btn label="Manage project support" secondary onPress={() => open('coordinator')} />}
        <Card>
          <ProjectFunding goal={project.goal} pledges={pledges} details />
          <View style={section}>
            <Copy kind="title">What this project has delivered</Copy>
            <Copy>{service?.count ? `${service.count} services delivered by ${partnerName(service.providerId)}` : 'No deliveries recorded yet.'}</Copy>
            <Copy kind="small" tint={color.muted}>All-time project results.</Copy>
            {project.id === 'drive' && <Btn label="View results and delivery history" secondary onPress={() => router.push('/impact-program')} />}
          </View>
          <View style={section}>
            <Copy kind="strong">Project needs</Copy><Copy>{project.supplies}</Copy>
            <Copy>{totals.volunteers} volunteer places confirmed through businesses</Copy>
          </View>
          <View style={section}>
            <Copy kind="strong">Contributing businesses</Copy>
            {supporters.length ? supporters.map((name) => <Copy key={name}>{name}</Copy>) : <Copy>No confirmed supporters yet.</Copy>}
            <Btn label="View business summary" secondary onPress={() => open('summary')} />
          </View>
        </Card>
      </> : <>
        <View><Copy kind="strong" tint={color.pine}>{project.event}</Copy><Copy kind="small">{project.organizer}</Copy></View>
        {view === 'coordinator' && coordinator && <Coordinator project={project.id} book={book}
          tab={tab === 'Payments' ? 'Payments' : 'Review'} setTab={(tab) => router.setParams({ tab })}
          recordPledge={() => open('pledge')} />}
        {(view === 'offer' || view === 'inquiry' || view === 'pledge') &&
          <SupportForm project={project.id} kind={view} onDone={back} />}
      </>}
    </>}
  </Page>;
}
