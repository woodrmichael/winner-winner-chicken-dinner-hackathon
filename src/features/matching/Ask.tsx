import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Building2, CarFront, HandHeart, LockKeyhole, Plus, Shirt, ShoppingBasket } from 'lucide-react-native';
import { View } from 'react-native';
import { detailsToShare } from '../../domain/referrals';
import type { Category, Partner } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { BackButton } from '../../ui/BackButton';
import { Btn, Card, Copy, Field, Page, color, row, wrap } from '../../ui/kit';
import { SelectionRow } from '../../ui/SelectionRows';
import { ShareDetails, type ShareKey } from './ShareDetails';
import { approvedPartners, eligibleForNewReferral, listWords, offerCoversLine } from './directory';
import { RequestVoice } from './RequestVoice';
import {
  draftReferral, findResources, interpretNeeds, isVagueRequest, preferredAreaFrom,
  shouldOfferDraft, withNeeds, type MatchResult,
} from './modelMatch';

type Step = 'describe' | 'clarify' | 'review';

const quickRequests = [
  { label: 'Clothing', text: 'I need help finding clothing.' },
  { label: 'Food', text: 'I need help getting groceries.' },
  { label: 'A ride', text: 'I need a ride.' },
];

const needIcons = { Clothing: Shirt, Transportation: CarFront, Food: ShoppingBasket, Other: HandHeart };

export default function Ask() {
  const { partner } = useLocalSearchParams<{ partner?: string }>();
  const { state, shared } = useDemo();
  const router = useRouter();
  if (shared.data?.account.kind !== 'resident') {
    return (
      <Page title="Ask for help" back={<BackButton onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />}>
        <Card>
          <Copy>Open a resident profile to send a private referral.</Copy>
          <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />
        </Card>
      </Page>
    );
  }
  const partners = approvedPartners(state.partners);
  const initialPartner = partners.find((entry) => entry.id === partner)?.id;
  return <RequestForm key={initialPartner ?? 'community'} initialPartner={initialPartner} partners={partners} />;
}

function RequestForm({ initialPartner, partners }: { initialPartner?: string; partners: Partner[] }) {
  const { run, shared: workspace } = useDemo();
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialPartner ? 'review' : 'describe');
  const [description, setDescription] = useState('');
  const [listening, setListening] = useState(false);
  const [clarification, setClarification] = useState('');
  const [originalWording, setOriginalWording] = useState('');
  const [suggestedDraft, setSuggestedDraft] = useState('');
  const [message, setMessage] = useState('');
  const [manualPartner, setManualPartner] = useState(initialPartner);
  const [shared, setShared] = useState<ShareKey[]>([]);
  const [showMatch, setShowMatch] = useState(false);
  const [editingMessage, setEditingMessage] = useState(!!initialPartner);
  const [source, setSource] = useState<MatchResult['source']>('model');
  const [needs, setNeeds] = useState<Category[]>([]);

  const neighborhood = workspace.data?.account.details.neighborhood;
  const preferred = preferredAreaFrom(message, shared.includes('neighborhood'), neighborhood);
  const matches = withNeeds(needs, source, preferred, partners).matches;
  const available = partners.filter((partner) => (needs.length ? needs : partner.categories)
    .some((need) => eligibleForNewReferral(partner, need)));
  const automatic = matches[0]?.partner;
  const selected = available.find(({ id }) => id === manualPartner) ?? automatic;

  function appendDescription(text: string) {
    setDescription((current) => current.includes(text) ? current : [current.trim(), text].filter(Boolean).join(' '));
  }

  function leaveRequest() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function editRequest() {
    setDescription(message);
    setStep('describe');
  }

  function updateMessage(text: string) {
    setMessage(text);
    setNeeds(interpretNeeds(text));
  }

  async function openReview(text: string, next: MatchResult) {
    const draft = next.source === 'model' && shouldOfferDraft(text, next.needs)
      ? await draftReferral(text, next.needs, 0) : '';
    setOriginalWording(text);
    setSuggestedDraft(draft === text ? '' : draft);
    setMessage(text);
    setNeeds(next.needs);
    setSource(next.source);
    setManualPartner(initialPartner);
    setShowMatch(false);
    setEditingMessage(false);
    setShared([]);
    setStep('review');
  }


  if (step === 'describe') {
    return (
      <Page title="Ask for help" back={<BackButton onPress={leaveRequest} />}>
        <Card>
          <Field
            label="What do you need?"
            multiline
            value={description}
            change={setDescription}
            placeholder="Clothing, groceries, or a ride…"
            editable={!listening}
          />
          <RequestVoice value={description} update={setDescription} listening={listening}
            setListening={setListening}>
            <Btn
              label="Find resources"
              stretch
              disabled={listening || !description.trim()}
              onPress={async () => {
                const text = description.trim();
                if (isVagueRequest(text)) {
                  setClarification('');
                  setStep('clarify');
                  return;
                }
                const next = await findResources(text, partners);
                await openReview(text, next);
              }}
            />
          </RequestVoice>
        </Card>
        <View style={{ gap: 6 }}>
          <Copy kind="small" tint={color.muted}>Quick actions</Copy>
          <View style={wrap}>
            {quickRequests.map(({ label, text }) => (
              <Btn key={label} label={label} icon={Plus} secondary disabled={listening} onPress={() => appendDescription(text)} />
            ))}
          </View>
        </View>
      </Page>
    );
  }

  if (step === 'clarify') {
    return (
      <Page title="A little more detail" back={<BackButton label="Back to your request" onPress={() => setStep('describe')} />}>
        <Card>
          <Copy>What kind of help do you need?</Copy>
          <Copy kind="small" tint={color.muted}>
            Your earlier note: “{description.trim()}”
          </Copy>
          <Field
            label="Add a detail"
            multiline
            value={clarification}
            change={setClarification}
            placeholder="Food for tonight, a ride, or clothes…"
          />
          <View style={wrap}>
            <Btn
              label="Continue"
              stretch
              disabled={!clarification.trim()}
              onPress={async () => {
                const detail = clarification.trim();
                const combined = description.trim() + ' ' + detail;
                const next = await findResources(combined, partners);
                await openReview(combined, next);
              }}
            />
            <Btn
              label="Skip and choose a partner"
              secondary
              onPress={async () => {
                const wording = description.trim();
                await openReview(wording, { needs: [], matches: [], source: 'model' });
              }}
            />
          </View>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Review request" back={<BackButton onPress={initialPartner && !description ? leaveRequest : editRequest} />}>
      <View style={{ gap: 6 }}>
        <View style={[wrap, { justifyContent: 'space-between' }]}>
          <Copy kind="title">Your message</Copy>
          <Btn label={editingMessage ? 'Done' : 'Edit message'} quiet onPress={() => setEditingMessage(!editingMessage)} />
        </View>
        <Card style={{ padding: 13 }}>
          {editingMessage ? <Field label="Your message" hideLabel multiline value={message}
            placeholder="What do you need?" change={(text) => { setSuggestedDraft(''); updateMessage(text); }} />
            : <Copy>{message}</Copy>}
        </Card>
        {!!needs.length && <View style={[wrap, { gap: 6, marginTop: 2 }]}>
          {needs.map((need) => {
            const Icon = needIcons[need];
            return <View key={need} style={[row, { gap: 6, backgroundColor: color.pale, borderRadius: 8,
              paddingHorizontal: 9, paddingVertical: 6 }]}>
              <Icon size={15} color={color.pine} />
              <Copy kind="small" tint={color.pine}>{need === 'Other' ? 'Other help' : need}</Copy>
            </View>;
          })}
        </View>}
      </View>
      {!!suggestedDraft && message !== suggestedDraft && <View style={{ gap: 8 }}>
        <Copy kind="strong">Suggested draft</Copy>
        <Card style={{ padding: 13, gap: 8 }}>
          <Copy>{suggestedDraft}</Copy>
          <Btn label="Use suggested draft" quiet onPress={() => updateMessage(suggestedDraft)} />
        </Card>
      </View>}
      {!!suggestedDraft && message === suggestedDraft && <Btn label="Use my wording" quiet
        onPress={() => updateMessage(originalWording)} />}
      <View style={{ gap: 8 }}>
        <Copy kind="title">{selected && selected.id !== initialPartner ? 'Suggested organization' : 'Organization'}</Copy>
        <Card style={{ gap: 8 }}>
          {selected ? <>
            <View style={[row, { alignItems: 'flex-start' }]}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: color.pale,
                alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={22} color={color.pine} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Copy kind="strong">{selected.name}</Copy>
                <Copy kind="small" tint={color.muted}>{listWords(selected.categories)}</Copy>
                <Btn label={showMatch ? 'Hide match details' : 'Why this match?'} quiet onPress={() => setShowMatch(!showMatch)} />
              </View>
            </View>
            {showMatch && <Copy kind="small" tint={color.muted}>
              {offerCoversLine((matches.find(({ partner }) => partner.id === selected.id)?.covers ?? selected.categories)
                .map((category) => category.toLowerCase()))}. {selected.pickup}
            </Copy>}
          </> : available.length ? <View accessibilityRole="radiogroup" accessibilityLabel="Available organizations">
            {available.map(({ id, name }) => <SelectionRow key={id} label={name} selected={manualPartner === id} onPress={() => setManualPartner(id)} />)}
          </View> : <Copy tint={color.muted}>No organization matches these needs. Edit your message to search again.</Copy>}
        </Card>
      </View>
      <View style={{ gap: 8 }}>
        <Copy kind="title">Information to share</Copy>
        <Card><ShareDetails selected={shared} onChange={setShared} showHeading={false} /></Card>
        <View style={[row, { gap: 6 }]}>
          <LockKeyhole size={14} color={color.muted} />
          <Copy kind="small" tint={color.muted} style={{ flex: 1 }}>Shared privately with the selected organization.</Copy>
        </View>
      </View>
      <Btn label="Send request" stretch celebrate disabled={!selected || !message.trim()}
        onPress={async () => {
          if (!selected) return;
          await run({
            type: 'send', id: newId(), partnerId: selected.id, message: message.trim(), needs,
            shared: detailsToShare(shared, workspace.data?.account.details), at: now(),
          });
          router.replace('/activity');
        }} />
    </Page>
  );
}
