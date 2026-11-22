import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { detailsToShare } from '../../domain/referrals';
import { profile } from '../../domain/seed';
import type { Category, Partner } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Disclosure } from '../../ui/Disclosure';
import { BackButton } from '../../ui/BackButton';
import { Btn, Card, Copy, Field, Page, color, row, wrap } from '../../ui/kit';
import { ShareDetails, shareSummary, type ShareKey } from './ShareDetails';
import {
  approvedPartners,
  eligibleForNewReferral,
  listWords,
  offerCoversLine,
  offersCategory,
  pausedServiceLine,
  serviceAvailability,
} from './directory';
import { RequestVoice } from './RequestVoice';
import {
  draftReferral,
  findResources,
  interpretNeeds,
  isVagueRequest,
  missingAddableNeeds,
  needsFullyCovered,
  preferredAreaFrom,
  shouldOfferDraft,
  withNeeds,
  type MatchResult,
} from './modelMatch';

type Step = 'describe' | 'clarify' | 'review';

const emptyMatch: MatchResult = { needs: [], matches: [], source: 'model' };
const quickRequests = [
  { label: 'Clothing', text: 'I need help finding clothing.' },
  { label: 'Food', text: 'I need groceries or a meal.' },
  { label: 'A ride', text: 'I need a ride.' },
];

export default function Ask() {
  const { partner } = useLocalSearchParams<{ partner?: string }>();
  const { state, shared } = useDemo();
  const router = useRouter();
  const account = shared.data?.account;
  if (account?.kind !== 'resident') {
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
  return (
    <RequestForm
      key={initialPartner ?? 'community'}
      initialPartner={initialPartner}
      partners={partners}
    />
  );
}

function RequestForm({
  initialPartner,
  partners,
}: {
  initialPartner?: string;
  partners: Partner[];
}) {
  const { run, shared: workspace } = useDemo();
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialPartner ? 'review' : 'describe');
  const [description, setDescription] = useState('');
  const [listening, setListening] = useState(false);
  const [clarification, setClarification] = useState('');
  const [originalWording, setOriginalWording] = useState('');
  const [suggestedDraft, setSuggestedDraft] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState(initialPartner ?? '');
  const [shared, setShared] = useState<ShareKey[]>([]);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [draftPreviewOpen, setDraftPreviewOpen] = useState(true);
  const [addNeedOpen, setAddNeedOpen] = useState(false);
  const [result, setResult] = useState<MatchResult>(emptyMatch);
  const matchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function appendDescription(text: string) {
    setDescription((current) => current.includes(text) ? current : [current.trim(), text].filter(Boolean).join(' '));
  }

  function leaveRequest() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function editRequest() {
    setDescription(originalWording || message);
    setStep('describe');
  }

  useEffect(
    () => () => {
      if (matchTimer.current) clearTimeout(matchTimer.current);
    },
    [],
  );

  function acceptingForNeeds(partner: Partner, needs: Category[]) {
    if (!needs.length) return partner.categories.filter(
      (category) => serviceAvailability(partner, category) === 'accepting',
    );
    return needs.filter((need) => eligibleForNewReferral(partner, need));
  }

  const directoryKey = partners
    .map(
      (partner) =>
        `${partner.id}:${partner.categories.join(',')}:${JSON.stringify(partner.availability)}`,
    )
    .join('|');

  // Re-rank when a partner pauses, reopens, or permanently drops a service while review is open.
  useEffect(() => {
    if (step !== 'review' || !result.needs.length) return;
    applyMatchResult(
      withNeeds(
        result.needs,
        result.source === 'keywords' ? 'keywords' : 'model',
        areaPreference(),
        partners,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when directory listings change
  }, [directoryKey]);

  const liveMatches = result.matches
    .map((match) => {
      const partner = partners.find((entry) => entry.id === match.partner.id) ?? match.partner;
      const covers = match.covers.filter((need) => eligibleForNewReferral(partner, need));
      return { ...match, partner, covers };
    })
    .filter((match) => match.covers.length > 0);

  const available = !result.needs.length
    ? partners
    : partners.filter((partner) => acceptingForNeeds(partner, result.needs).length > 0);
  const ordered = [
    ...liveMatches.map((match) => match.partner),
    ...available.filter(
      (partner) => !liveMatches.some((match) => match.partner.id === partner.id),
    ),
  ];
  const unavailable = result.needs.length
    ? partners.filter(
        (partner) =>
          !available.some((entry) => entry.id === partner.id) &&
          result.needs.some(
            (need) =>
              offersCategory(partner, need) && serviceAvailability(partner, need) === 'paused',
          ),
      )
    : [];
  const recipientValid =
    !result.needs.length || !recipient || available.some((partner) => partner.id === recipient);
  const activeRecipient = recipientValid
    ? recipient
    : liveMatches[0]?.partner.id ?? available[0]?.id ?? '';
  const selected = available.find((partner) => partner.id === activeRecipient);
  const listExpanded = partnerOpen || Boolean(recipient && !recipientValid);
  const noAutomaticMatches = liveMatches.length === 0;
  const splitNeeds = result.needs.length > 1 && !needsFullyCovered(result.needs, partners);
  const addable = missingAddableNeeds(result.needs);
  const draftReady = !!suggestedDraft && suggestedDraft !== message;

  function matchExplanation(partner: Partner) {
    const match = liveMatches.find((item) => item.partner.id === partner.id);
    if (match?.explanation && match.covers.length) {
      return offerCoversLine(match.covers.map((category) => category.toLowerCase()));
    }
    const accepting = acceptingForNeeds(partner, result.needs);
    if (accepting.length) {
      return 'Accepting ' + listWords(accepting.map((category) => category.toLowerCase()));
    }
    return offerCoversLine(partner.categories.map((category) => category.toLowerCase()));
  }

  function coverageLine(partner: Partner) {
    return (
      'Serves ' +
      (partner.coverageAreas.length > 1 ? listWords(partner.coverageAreas) : partner.area)
    );
  }

  function availabilityLine(partner: Partner) {
    const among = result.needs.length ? result.needs : undefined;
    const paused = pausedServiceLine(partner, among);
    if (paused) return paused;
    if (pausedServiceLine(partner)) return pausedServiceLine(partner);
    return 'Accepting new referrals';
  }

  function selectedSummary(partner: Partner) {
    return [
      matchExplanation(partner),
      coverageLine(partner),
      partner.pickup,
      availabilityLine(partner),
    ]
      .filter(Boolean)
      .join(' · ');
  }

  function areaPreference(text = message, keys: ShareKey[] = shared) {
    return preferredAreaFrom(
      text || originalWording || description,
      keys.includes('neighborhood'),
      profile.neighborhood,
    );
  }

  function applyMatchResult(next: MatchResult, preferTop = false) {
    setResult(next);
    if (initialPartner) return;
    const stillValid = recipient && next.matches.some((match) => match.partner.id === recipient);
    if (preferTop || !stillValid || next.matches.length === 0) {
      const partner = next.matches[0]?.partner.id ?? '';
      setRecipient(partner);
      // Avoid opening the partner list while typing — it steals focus from the message field.
      if (preferTop || next.matches.length === 0) setPartnerOpen(true);
    }
  }

  function syncMatchingFromMessage(text: string, keys: ShareKey[] = shared) {
    const needs = interpretNeeds(text);
    applyMatchResult(
      withNeeds(
        needs,
        result.source === 'keywords' ? 'keywords' : 'model',
        areaPreference(text, keys),
        partners,
      ),
    );
  }

  function syncFromMessage(text: string, keys: ShareKey[] = shared) {
    setMessage(text);
    if (matchTimer.current) clearTimeout(matchTimer.current);
    matchTimer.current = setTimeout(() => syncMatchingFromMessage(text, keys), 350);
  }

  function applyMessageNow(text: string, keys: ShareKey[] = shared) {
    if (matchTimer.current) clearTimeout(matchTimer.current);
    setMessage(text);
    syncMatchingFromMessage(text, keys);
  }

  async function refreshDraft(needs: Category[]) {
    const basis = message || originalWording || description;
    if (result.source === 'model' && needs.length && shouldOfferDraft(basis, needs)) {
      const draft = await draftReferral(basis, needs, 0);
      setSuggestedDraft(draft && draft !== message ? draft : '');
      setDraftPreviewOpen(true);
    } else {
      setSuggestedDraft('');
    }
  }

  async function openReview(text: string, next: MatchResult, wording: string) {
    const offerDraft =
      next.source === 'model' && next.needs.length && shouldOfferDraft(wording, next.needs);
    const draft = offerDraft ? await draftReferral(text, next.needs) : '';
    setOriginalWording(wording);
    setSuggestedDraft(draft && draft !== wording ? draft : '');
    setDraftPreviewOpen(!!draft);
    setMessage(wording);
    setResult(next);
    const partner = initialPartner ? recipient : next.matches[0]?.partner.id ?? '';
    setRecipient(partner);
    setPartnerOpen(!partner || next.matches.length === 0);
    setSharingOpen(false);
    setEditingMessage(false);
    setShared([]);
    setStep('review');
  }

  async function removeNeed(need: Category) {
    const needs = result.needs.filter((entry) => entry !== need);
    const next = withNeeds(needs, result.source, areaPreference(), partners);
    applyMatchResult(next, true);
    await refreshDraft(needs);
  }

  async function addNeed(need: Category) {
    if (result.needs.includes(need)) return;
    const needs = [...result.needs, need];
    const next = withNeeds(needs, result.source, areaPreference(), partners);
    applyMatchResult(next, true);
    await refreshDraft(needs);
  }

  function changeShared(keys: ShareKey[]) {
    const neighborhoodChanged =
      keys.includes('neighborhood') !== shared.includes('neighborhood');
    setShared(keys);
    if (!result.needs.length) return;
    applyMatchResult(
      withNeeds(result.needs, result.source, areaPreference(message, keys), partners),
      neighborhoodChanged,
    );
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
                await openReview(text, next, text);
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
                await openReview(combined, next, description.trim());
              }}
            />
            <Btn
              label="Skip and choose a partner"
              secondary
              onPress={async () => {
                const wording = description.trim();
                await openReview(wording, { needs: [], matches: [], source: 'model' }, wording);
              }}
            />
          </View>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Review referral" back={<BackButton onPress={initialPartner && !description ? leaveRequest : editRequest} />}>
      {noAutomaticMatches ? (
        <Card>
          <Copy kind="strong">No automatic matches found</Copy>
          <Copy kind="small" tint={color.muted}>
            Rephrase your request, or select a partner manually from the list below.
          </Copy>
        </Card>
      ) : null}
      {splitNeeds ? (
        <Card>
          <Copy kind="small" tint={color.muted}>
            No organization covers every need here. Pick who to contact first—you can only send to
            one partner.
          </Copy>
        </Card>
      ) : null}
      <Card style={{ gap: 4 }}>
        <Copy kind="small" tint={color.muted}>
          Send to
        </Copy>
        <Copy kind="small" tint={color.muted}>
          Compare services, coverage areas, and pickup arrangements, then pick one recipient.
        </Copy>
        <Disclosure
          label={selected?.name ?? 'Choose a partner'}
          detail={
            selected
              ? selectedSummary(selected)
              : noAutomaticMatches
                ? 'No automatic matches found. Select a partner manually.'
                : result.source === 'keywords'
                  ? 'Model unavailable. Select a partner below.'
                  : 'Select a partner below.'
          }
          expanded={listExpanded}
          onToggle={() => setPartnerOpen(!partnerOpen)}
        >
          <View accessibilityRole="radiogroup" accessibilityLabel="Available partners">
            {!ordered.length ? (
              <Copy kind="small" tint={color.muted}>
                No partners are accepting these needs right now. Rephrase your request or ask a
                provider to reopen those services.
              </Copy>
            ) : null}
            {ordered.map((partner) => {
              const selectedPartner = activeRecipient === partner.id;
              const availability = availabilityLine(partner);
              const availabilityPaused = availability !== 'Accepting new referrals';
              return (
                <Pressable
                  key={partner.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedPartner }}
                  accessibilityLabel={`${partner.name}. ${matchExplanation(partner)}. ${coverageLine(partner)}. Pickup: ${partner.pickup}. ${availability}`}
                  onPress={() => {
                    setRecipient(partner.id);
                    setPartnerOpen(false);
                  }}
                  style={({ pressed }) => ({
                    gap: 4,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderColor: color.line,
                    backgroundColor: pressed ? color.bg : undefined,
                  })}
                >
                  <View style={[row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                    <Copy kind={selectedPartner ? 'strong' : 'body'} style={{ flex: 1 }}>
                      {partner.name}
                    </Copy>
                    {selectedPartner ? (
                      <Copy kind="small" tint={color.pine}>
                        Selected
                      </Copy>
                    ) : null}
                  </View>
                  <Copy kind="small" tint={color.muted}>
                    {matchExplanation(partner)}
                  </Copy>
                  <Copy kind="small" tint={color.ink}>
                    {coverageLine(partner)}
                  </Copy>
                  <Copy kind="small" tint={color.muted}>
                    Pickup: {partner.pickup}
                  </Copy>
                  <Copy kind="small" tint={availabilityPaused ? color.rust : color.muted}>
                    {availability}
                  </Copy>
                </Pressable>
              );
            })}
            {unavailable.length ? (
              <View style={{ gap: 4, paddingTop: 12 }}>
                <Copy kind="strong">Temporarily unavailable for these needs</Copy>
                <Copy kind="small" tint={color.muted}>
                  These providers still appear so you can see why they are paused. Pick an accepting
                  partner above to send your referral.
                </Copy>
                {unavailable.map((partner) => (
                  <View
                    key={`paused-${partner.id}`}
                    accessibilityLabel={`${partner.name}. ${pausedServiceLine(partner, result.needs)}. ${coverageLine(partner)}. Pickup: ${partner.pickup}`}
                    style={{
                      gap: 4,
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderColor: color.line,
                      opacity: 0.85,
                    }}
                  >
                    <Copy kind="body">{partner.name}</Copy>
                    <Copy kind="small" tint={color.rust}>
                      {pausedServiceLine(partner, result.needs)}
                    </Copy>
                    <Copy kind="small" tint={color.muted}>
                      {coverageLine(partner)}
                    </Copy>
                    <Copy kind="small" tint={color.muted}>
                      Pickup: {partner.pickup}
                    </Copy>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Disclosure>
      </Card>
      <Card style={addNeedOpen ? { zIndex: 20, overflow: 'visible' } : undefined}>
        <Copy kind="strong">Needs identified</Copy>
        <Copy kind="small" tint={color.muted}>
          Remove a need if it no longer applies, or add one that is still missing.
        </Copy>
        <View
          style={{
            ...row,
            alignItems: 'flex-start',
            overflow: 'visible',
            zIndex: addNeedOpen ? 20 : undefined,
          }}
        >
          {addable.length ? (
            <View style={{ zIndex: 20 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a need"
                accessibilityState={{ expanded: addNeedOpen }}
                onPress={() => setAddNeedOpen(!addNeedOpen)}
                style={{
                  ...row,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: color.line,
                  backgroundColor: color.paper,
                }}
              >
                <Plus size={14} color={color.pine} />
                {addNeedOpen ? (
                  <ChevronUp size={14} color={color.pine} />
                ) : (
                  <ChevronDown size={14} color={color.pine} />
                )}
              </Pressable>
              {addNeedOpen ? (
                <View
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    minWidth: 140,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: color.line,
                    backgroundColor: color.paper,
                    paddingVertical: 4,
                    zIndex: 30,
                    elevation: 6,
                    shadowColor: '#000',
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  {addable.map((need) => (
                    <Pressable
                      key={'add-' + need}
                      accessibilityRole="button"
                      accessibilityLabel={'Add ' + need}
                      onPress={async () => {
                        const remaining = missingAddableNeeds([...result.needs, need]);
                        if (!remaining.length) setAddNeedOpen(false);
                        await addNeed(need);
                      }}
                      style={({ pressed }) => ({
                        ...row,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        backgroundColor: pressed ? color.pale : color.paper,
                      })}
                    >
                      <Copy kind="small">{need}</Copy>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={{ ...wrap, flex: 1 }}>
            {result.needs.map((need) => (
              <Pressable
                key={need}
                accessibilityRole="button"
                accessibilityLabel={'Remove ' + need}
                onPress={() => removeNeed(need)}
                style={{
                  ...row,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: color.pale,
                }}
              >
                <Copy kind="small">{need}</Copy>
                <X size={14} color={color.muted} />
              </Pressable>
            ))}
          </View>
        </View>
      </Card>
      {initialPartner && !originalWording ? (
        <Card>
          <Field
            label="Your message"
            multiline
            value={message}
            placeholder="What do you need?"
            change={syncFromMessage}
          />
        </Card>
      ) : (
        <Card style={{ gap: 2 }}>
          <View style={[wrap, { justifyContent: 'space-between' }]}>
            <Copy kind="strong">Your message</Copy>
            <Btn
              label={editingMessage ? 'Done' : 'Edit message'}
              quiet
              onPress={() => setEditingMessage(!editingMessage)}
            />
          </View>
          {editingMessage ? (
            <Field label="Message to share" multiline value={message} change={syncFromMessage} />
          ) : (
            <Copy>{message}</Copy>
          )}
          {draftReady ? (
            <>
              <Copy kind="small" tint={color.muted}>
                A suggested draft is ready. Preview it below, then apply it or keep your own words.
              </Copy>
              <Disclosure
                label="Suggested draft"
                detail="Preview only—your message stays unchanged until you apply it."
                expanded={draftPreviewOpen}
                onToggle={() => setDraftPreviewOpen(!draftPreviewOpen)}
              >
                <Copy kind="small">{suggestedDraft}</Copy>
              </Disclosure>
              <View style={wrap}>
                <Btn label="Use suggested draft" onPress={() => applyMessageNow(suggestedDraft)} />
                {message !== originalWording ? (
                  <Btn
                    label="Keep my wording"
                    secondary
                    onPress={() => applyMessageNow(originalWording)}
                  />
                ) : null}
              </View>
            </>
          ) : null}
        </Card>
      )}
      <Card style={{ paddingVertical: 10 }}>
        <Disclosure
          label="Sharing options"
          detail={shareSummary(shared)}
          expanded={sharingOpen}
          onToggle={() => setSharingOpen(!sharingOpen)}
        >
          <ShareDetails selected={shared} onChange={changeShared} showHeading={false} />
        </Disclosure>
      </Card>
      <View style={{ gap: 8 }}>
        {!message.trim() ? (
          <Copy kind="small" tint={color.muted}>
            Add a message before sending.
          </Copy>
        ) : null}
        <View style={wrap}>
          <Btn
            label="Send referral"
            stretch
            disabled={!activeRecipient || !message.trim()}
            onPress={async () => {
              const text = message.trim();
              if (!text) throw new Error('Add a message before sending.');
              if (!activeRecipient) throw new Error('Choose a partner before sending.');
              let needsForSend = result.needs;
              if (matchTimer.current) {
                clearTimeout(matchTimer.current);
                matchTimer.current = null;
                needsForSend = interpretNeeds(text);
                applyMatchResult(
                  withNeeds(
                    needsForSend,
                    result.source === 'keywords' ? 'keywords' : 'model',
                    areaPreference(text),
                    partners,
                  ),
                );
              }
              await run({
                type: 'send',
                id: newId(),
                partnerId: activeRecipient,
                message: text,
                needs: needsForSend,
                shared: detailsToShare(shared, workspace.data?.account.details),
                at: now(),
              });
              router.replace('/activity');
            }}
          />
          <Btn
            label="Edit request"
            secondary
            onPress={editRequest}
          />
        </View>
      </View>
    </Page>
  );
}
