import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { detailsToShare } from '../../domain/referrals';
import { profile } from '../../domain/seed';
import type { Category } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Disclosure } from '../../ui/Disclosure';
import { SelectionRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Field, Page, color, row, wrap } from '../../ui/kit';
import { ShareDetails, shareSummary, type ShareKey } from './ShareDetails';
import { directory } from './directory';
import { example } from './match';
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

export default function Ask() {
  const { partner } = useLocalSearchParams<{ partner?: string }>();
  const initialPartner = directory.find((entry) => entry.id === partner)?.id;
  return <RequestForm key={initialPartner ?? 'community'} initialPartner={initialPartner} />;
}

function RequestForm({ initialPartner }: { initialPartner?: string }) {
  const { run, shared: workspace, setRole, setPartnerId } = useDemo();
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialPartner ? 'review' : 'describe');
  const [description, setDescription] = useState('');
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

  useEffect(
    () => () => {
      if (matchTimer.current) clearTimeout(matchTimer.current);
    },
    [],
  );

  const ordered = [
    ...result.matches.map((match) => match.partner),
    ...directory.filter((partner) => !result.matches.some((match) => match.partner.id === partner.id)),
  ];
  const selected = directory.find((partner) => partner.id === recipient);
  const noAutomaticMatches = result.matches.length === 0;
  const splitNeeds = result.needs.length > 1 && !needsFullyCovered(result.needs);
  const addable = missingAddableNeeds(result.needs);
  const draftReady = !!suggestedDraft && suggestedDraft !== message;

  function partnerDetail(partner: (typeof directory)[number]) {
    const match = result.matches.find((item) => item.partner.id === partner.id);
    const base = match?.explanation
      ? match.explanation
      : 'Offers ' + partner.categories.join(' and ').toLowerCase();
    const preferred = areaPreference();
    if (preferred && partner.area === preferred) {
      return base + ' · Serves ' + partner.area;
    }
    return base;
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
    const next = withNeeds(needs, result.source, areaPreference());
    applyMatchResult(next, true);
    await refreshDraft(needs);
  }

  async function addNeed(need: Category) {
    if (result.needs.includes(need)) return;
    const needs = [...result.needs, need];
    const next = withNeeds(needs, result.source, areaPreference());
    applyMatchResult(next, true);
    await refreshDraft(needs);
  }

  function changeShared(keys: ShareKey[]) {
    const neighborhoodChanged =
      keys.includes('neighborhood') !== shared.includes('neighborhood');
    setShared(keys);
    if (!result.needs.length) return;
    applyMatchResult(
      withNeeds(result.needs, result.source, areaPreference(message, keys)),
      neighborhoodChanged,
    );
  }

  if (workspace.enabled && workspace.data?.account.kind !== 'resident') {
    return (
      <Page title="Ask for help">
        <Card>
          <Copy>Sign in as a resident to send a private referral.</Copy>
          <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />
        </Card>
      </Page>
    );
  }

  if (step === 'describe') {
    return (
      <Page title="Ask for help">
        <Card>
          <Field
            label="What do you need?"
            multiline
            value={description}
            change={setDescription}
            placeholder="Clothing, groceries, a ride…"
          />
          <View style={wrap}>
            <Btn
              label="Find resources"
              stretch
              disabled={!description.trim()}
              onPress={async () => {
                const text = description.trim();
                if (isVagueRequest(text)) {
                  setClarification('');
                  setStep('clarify');
                  return;
                }
                const next = await findResources(text);
                await openReview(text, next, text);
              }}
            />
            <Btn label="Clothing and a ride" secondary onPress={() => setDescription(example)} />
          </View>
        </Card>
      </Page>
    );
  }

  if (step === 'clarify') {
    return (
      <Page title="A little more detail">
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
            placeholder="Food for tonight, a ride, clothes…"
          />
          <View style={wrap}>
            <Btn
              label="Continue"
              stretch
              disabled={!clarification.trim()}
              onPress={async () => {
                const detail = clarification.trim();
                const combined = description.trim() + ' ' + detail;
                const next = await findResources(combined);
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
            <Btn
              label="Back"
              secondary
              onPress={() => {
                setStep('describe');
                setClarification('');
              }}
            />
          </View>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Review referral">
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
        <Disclosure
          label={selected?.name ?? 'Choose a partner'}
          detail={
            selected
              ? partnerDetail(selected)
              : noAutomaticMatches
                ? 'No automatic matches found. Select a partner manually.'
                : result.source === 'keywords'
                  ? 'Model unavailable. Select a partner below.'
                  : 'Select a partner below.'
          }
          expanded={partnerOpen}
          onToggle={() => setPartnerOpen(!partnerOpen)}
        >
          <View accessibilityRole="radiogroup" accessibilityLabel="Available partners">
            {ordered.map((partner) => (
              <SelectionRow
                key={partner.id}
                label={partner.name}
                detail={partnerDetail(partner)}
                selected={recipient === partner.id}
                onPress={() => {
                  setRecipient(partner.id);
                  setPartnerOpen(false);
                }}
              />
            ))}
          </View>
        </Disclosure>
      </Card>
      <Card style={addNeedOpen ? { zIndex: 20, overflow: 'visible' } : undefined}>
        <Copy kind="strong">Needs identified</Copy>
        <Copy kind="small" tint={color.muted}>
          Remove a need if it no longer applies, or add one that is still missing.
        </Copy>
        <View style={{ ...wrap, overflow: 'visible', zIndex: addNeedOpen ? 20 : undefined }}>
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
                        setAddNeedOpen(false);
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
            disabled={!recipient || !message.trim()}
            onPress={async () => {
              const text = message.trim();
              if (!text) throw new Error('Add a message before sending.');
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
                  ),
                );
              }
              await run({
                type: 'send',
                id: newId(),
                partnerId: recipient,
                message: text,
                needs: needsForSend,
                shared: detailsToShare(shared, workspace.data?.account.details),
                at: now(),
              });
              setPartnerId(recipient);
              setRole('Resident');
              router.replace('/activity');
            }}
          />
          <Btn
            label="Edit request"
            secondary
            onPress={() => {
              setDescription(originalWording || message);
              setStep('describe');
            }}
          />
        </View>
      </View>
    </Page>
  );
}
