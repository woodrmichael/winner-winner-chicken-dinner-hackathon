import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { detailsToShare } from '../../domain/referrals';
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
  const { run, setRole, setPartnerId } = useDemo();
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
  const [result, setResult] = useState<MatchResult>(emptyMatch);

  const ordered = [
    ...result.matches.map((match) => match.partner),
    ...directory.filter((partner) => !result.matches.some((match) => match.partner.id === partner.id)),
  ];
  const selected = directory.find((partner) => partner.id === recipient);

  function partnerDetail(partner: (typeof directory)[number]) {
    const match = result.matches.find((item) => item.partner.id === partner.id);
    return match?.explanation
      ? match.explanation
      : 'Offers ' + partner.categories.join(' and ').toLowerCase();
  }

  async function openReview(text: string, next: MatchResult, wording: string) {
    const draft =
      next.source === 'model' && next.needs.length
        ? await draftReferral(text, next.needs)
        : wording;
    setOriginalWording(wording);
    setSuggestedDraft(draft);
    setMessage(draft);
    setResult(next);
    const partner = initialPartner ? recipient : next.matches[0]?.partner.id ?? '';
    setRecipient(partner);
    setPartnerOpen(!partner);
    setSharingOpen(false);
    setEditingMessage(false);
    setShared([]);
    setStep('review');
  }

  function removeNeed(need: Category) {
    const needs = result.needs.filter((entry) => entry !== need);
    const next = withNeeds(needs, result.source);
    setResult(next);
    if (!initialPartner && recipient && !next.matches.some((match) => match.partner.id === recipient)) {
      const partner = next.matches[0]?.partner.id ?? '';
      setRecipient(partner);
      setPartnerOpen(!partner);
    }
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
      <Card style={{ gap: 4 }}>
        <Copy kind="small" tint={color.muted}>
          Send to
        </Copy>
        <Disclosure
          label={selected?.name ?? 'Choose a partner'}
          detail={
            selected
              ? partnerDetail(selected)
              : result.source === 'keywords'
                ? 'Model unavailable. Select a partner below.'
                : 'No match found. Select a partner below.'
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
      {result.needs.length ? (
        <Card>
          <Copy kind="strong">Needs identified</Copy>
          <Copy kind="small" tint={color.muted}>
            Remove a need if it no longer applies, then review the recipient.
          </Copy>
          <View style={wrap}>
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
        </Card>
      ) : null}
      {initialPartner && !originalWording ? (
        <Card>
          <Field label="Your message" multiline value={message} placeholder="What do you need?"
            change={(text) => {
              setMessage(text);
              setResult(withNeeds(interpretNeeds(text)));
            }}
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
          <>
            <Field label="Message to share" multiline value={message} change={setMessage} />
            <View style={wrap}>
              <Btn
                label="Use suggested draft"
                secondary
                disabled={!suggestedDraft}
                onPress={() => setMessage(suggestedDraft)}
              />
              <Btn
                label="Keep my wording"
                secondary
                onPress={() => setMessage(originalWording)}
              />
            </View>
          </>
        ) : (
          <Copy>{message}</Copy>
        )}
      </Card>
      )}
      <Card style={{ paddingVertical: 10 }}>
        <Disclosure
          label="Sharing options"
          detail={shareSummary(shared)}
          expanded={sharingOpen}
          onToggle={() => setSharingOpen(!sharingOpen)}
        >
          <ShareDetails selected={shared} onChange={setShared} showHeading={false} />
        </Disclosure>
      </Card>
      <View style={wrap}>
        <Btn
          label="Send referral"
          stretch
          disabled={!recipient || !message.trim()}
          onPress={async () => {
            await run({
              type: 'send',
              id: newId(),
              partnerId: recipient,
              message,
              needs: result.needs,
              shared: detailsToShare(shared),
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
    </Page>
  );
}
