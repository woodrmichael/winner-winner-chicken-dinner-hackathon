import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useDemo } from '../../state/Demo';
import { View } from 'react-native';
import { Btn, Card, Copy, Page, color } from '../../ui/kit';
import { BackButton } from '../../ui/BackButton';
import { BusinessSummary } from './BusinessSummary';
import { Coordinator } from './Coordinator';
import { projects, type ProjectId } from './ledger';
import { ProjectFunding } from './ProjectFunding';
import { ProjectSponsorship } from './ProjectSponsorship';
import { SupportForm } from './SupportForm';
import { useSupport } from './useSupport';

type Action = 'offer' | 'inquiry' | 'coordinator' | 'pledge' | 'summary';
const titles = { offer: 'Sponsor this project', inquiry: 'Ask about bringing a team', coordinator: 'Manage project support',
  pledge: 'Record an agreed pledge', summary: 'Business summary' };

export default function Partnerships() {
  const router = useRouter();
  const { project: id, action, tab } = useLocalSearchParams<{ project?: string; action?: Action; tab?: string }>();
  const { book, coordinator } = useSupport();
  const { shared } = useDemo();
  const deliveries = shared.data?.reporting.projectDeliveries ?? [];
  const service = deliveries.find((d) => d.project === id);
  const project = projects.find((p) => p.id === id);
  const restricted = action === 'coordinator' || action === 'pledge';
  const view = action && Object.hasOwn(titles, action) && (!restricted || coordinator) &&
    (project || action === 'summary') ? action : undefined;
  const pledges = book?.pledges.filter((p) => p.project === project?.id) ?? [];
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
      {projects.map((item) => <Card key={item.id}>
          <Copy kind="title">{item.name}</Copy>
          <Copy kind="small" tint={color.muted}>{item.organizer}</Copy>
          <Copy>{item.supplies}</Copy>
          <ProjectFunding goal={item.goal} pledges={book.pledges.filter(({ project }) => project === item.id)} />
          <Btn label={`View ${item.name.toLowerCase()}`} icon={ArrowRight} secondary onPress={() => open(undefined, item.id)} />
        </Card>)}
      <Btn label="View business summary" secondary onPress={() => open('summary')} />
    </> : <>
      {!view ? <ProjectSponsorship key={project.id} project={project} pledges={pledges} delivered={service?.count ?? 0}
        sponsor={() => open('offer')} volunteer={() => open('inquiry')} summary={() => open('summary')}
        manage={coordinator ? () => open('coordinator') : undefined}
        results={project.id === 'drive' ? () => router.push('/impact-program') : undefined} /> : <>
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
