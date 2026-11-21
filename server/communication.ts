import { randomUUID } from 'node:crypto';
import type { ReferralCommand, WorkspaceCommand } from '../src/domain/types';
import type { Account, ActivityUpdate, ReferralMessage } from '../src/shared/workspace';
import { assignmentScope, participant, WorkspaceError } from './referral-access';
import type { Workspace } from './workspace';

type Audience = 'resident' | 'partner';
type StoredMessage = Omit<ReferralMessage, 'sentByYou'> & { senderId: string; requestId: string };
type StoredUpdate = Omit<ActivityUpdate, 'read' | 'partnerId'> & { audience: Audience; readBy: string[] };
export type Communication = { messages: StoredMessage[]; updates: StoredUpdate[] };
export const emptyCommunication = (): Communication => ({ messages: [], updates: [] });

function addUpdate(
  workspace: Workspace,
  assignmentId: string,
  kind: ActivityUpdate['kind'],
  audience: Audience,
  at = new Date().toISOString(),
): Workspace {
  const update: StoredUpdate = { id: randomUUID(), kind, assignmentId, audience, at, readBy: [] };
  return {
    ...workspace,
    communication: { ...workspace.communication, updates: [update, ...workspace.communication.updates] },
  };
}

export function communicationFor(workspace: Workspace, account: Account) {
  const visible = new Map(workspace.referrals.flatMap((referral) => referral.assignments.flatMap((assignment) => {
    const side = participant(account, { referral, assignment });
    return side ? [[assignment.id, { side, partnerId: assignment.partnerId }] as const] : [];
  })));
  const messages = workspace.communication.messages.flatMap(({ senderId, requestId: _requestId, ...message }) =>
    visible.has(message.assignmentId) ? [{ ...message, sentByYou: senderId === account.id }] : [],
  );
  const updates = workspace.communication.updates.flatMap(({ audience, readBy, ...update }) => {
    const scope = visible.get(update.assignmentId);
    return scope?.side === audience ? [{ ...update, partnerId: scope.partnerId, read: readBy.includes(account.id) }] : [];
  });
  return { messages, updates };
}

export function notifyReferralChange(previous: Workspace, next: Workspace, command: ReferralCommand): Workspace {
  if (previous === next) return next;
  switch (command.type) {
    case 'send':
      return addUpdate(next, command.id, 'new-referral', 'partner', command.at);
    case 'accept':
      return addUpdate(next, command.id, 'accepted', 'resident', command.at);
    case 'propose-handoff':
      return addUpdate(next, command.id, 'proposed-handoff', 'resident');
    case 'seek-provider':
      return addUpdate(next, command.assignmentId, 'new-referral', 'partner', command.at);
    case 'respond-handoff':
      return command.response === 'approve'
        ? addUpdate(next, command.handoffId, 'new-referral', 'partner', command.at)
        : next;
    default:
      return next;
  }
}

export function applyCommunicationCommand(
  workspace: Workspace,
  account: Account,
  command: Extract<WorkspaceCommand, { type: 'send-referral-message' | 'mark-activity-read' }>,
): Workspace {
  const { communication } = workspace;
  if (command.type === 'mark-activity-read') {
    const update = communication.updates.find(({ id }) => id === command.updateId);
    const scope = update && assignmentScope(workspace.referrals, update.assignmentId);
    if (!update || !scope || participant(account, scope) !== update.audience) {
      throw new WorkspaceError(404, 'This update is unavailable.');
    }
    if (update.readBy.includes(account.id)) return workspace;
    return {
      ...workspace,
      communication: {
        ...communication,
        updates: communication.updates.map((entry) => entry === update
          ? { ...entry, readBy: [...entry.readBy, account.id] }
          : entry),
      },
    };
  }

  const scope = assignmentScope(workspace.referrals, command.assignmentId);
  const side = scope && participant(account, scope);
  if (!scope || !side) throw new WorkspaceError(404, 'This conversation is unavailable.');
  if (communication.messages.some((message) =>
    message.requestId === command.messageId && message.assignmentId === command.assignmentId && message.senderId === account.id,
  )) return workspace;

  const at = new Date().toISOString();
  const message: StoredMessage = {
    id: randomUUID(),
    requestId: command.messageId,
    assignmentId: command.assignmentId,
    senderId: account.id,
    sender: side === 'partner' ? account.name : scope.assignment.shared.firstName ?? 'Resident',
    body: command.body,
    at,
  };
  return addUpdate({
    ...workspace,
    communication: {
      ...communication,
      messages: [...communication.messages, message],
    },
  }, command.assignmentId, 'reply', side === 'resident' ? 'partner' : 'resident', at);
}
