import { parseEntry, type SupportCommand } from '../src/features/partnerships/ledger';
import { detailsToShare, shareFields } from '../src/domain/referrals';
import {
  categories,
  neighborhoods,
  type CommunityCommand,
  type ReferralCommand,
  type SharedDetails,
  type WorkspaceCommand,
} from '../src/domain/types';
import { referralMessageLimit } from '../src/shared/workspace';
import { WorkspaceError } from './referral-access';

function invalid(): never {
  throw new WorkspaceError(400, 'Invalid workspace command.');
}

export function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function text(value: unknown, limit = 160): string {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) invalid();
  return value.trim();
}

function integer(value: unknown, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) invalid();
  return value;
}

function option<T extends string>(value: unknown, options: readonly T[]): T {
  const result = options.find((entry) => value === entry);
  return result ?? invalid();
}

function share(value: unknown) {
  if (!Array.isArray(value)) invalid();
  return value.map((key) => option(key, shareFields));
}

export function parseCommand(input: unknown, details: SharedDetails): CommunityCommand | ReferralCommand | WorkspaceCommand | SupportCommand {
  const cmd = object(input);
  const at = new Date().toISOString();
  switch (cmd.type) {
    case 'partnership': {
      try { return { type: 'partnership', entry: parseEntry(cmd.entry) }; } catch { return invalid(); }
    }
    case 'post':
      return {
        type: cmd.type,
        id: text(cmd.id),
        title: text(cmd.title, 160),
        body: text(cmd.body, 4000),
        at,
        ...(Object.hasOwn(cmd, 'group') ? { group: option(cmd.group, neighborhoods) } : {}),
      };
    case 'reply':
      return {
        type: cmd.type,
        id: text(cmd.id),
        postId: text(cmd.postId),
        from: option(cmd.from, ['resident', 'author'] as const),
        body: text(cmd.body, 4000),
        at,
      };
    case 'event-rsvp':
      return { type: cmd.type, postId: text(cmd.postId), joined: cmd.joined === true };
    case 'group-membership':
      return { type: cmd.type, group: option(cmd.group, neighborhoods), joined: cmd.joined === true };
    case 'save-post':
      return { type: cmd.type, postId: text(cmd.postId), saved: cmd.saved === true };
    case 'edit-post':
      return { type: cmd.type, postId: text(cmd.postId), authorId: text(cmd.authorId),
        title: text(cmd.title, 160), body: text(cmd.body, 4000) };
    case 'close-post':
      return { type: cmd.type, postId: text(cmd.postId), authorId: text(cmd.authorId) };
    case 'report-post':
      return { type: cmd.type, postId: text(cmd.postId), id: text(cmd.id),
        reporterId: text(cmd.reporterId), reason: text(cmd.reason, 1200), at };
    case 'hide-post':
      return { type: cmd.type, postId: text(cmd.postId), moderatorId: text(cmd.moderatorId),
        reason: text(cmd.reason, 1200), at };
    case 'request-membership':
      return { type: cmd.type, partnerId: text(cmd.partnerId) };
    case 'approve-membership':
      return { type: cmd.type, accountId: text(cmd.accountId) };
    case 'send-referral-message':
      return {
        type: cmd.type,
        assignmentId: text(cmd.assignmentId),
        messageId: text(cmd.messageId),
        body: text(cmd.body, referralMessageLimit),
      };
    case 'mark-activity-read':
      return { type: cmd.type, updateId: text(cmd.updateId) };
    case 'reserve-volunteer':
      return { type: cmd.type, roleId: option(cmd.roleId, ['sorting', 'distribution'] as const) };
    case 'cancel-volunteer':
      return { type: cmd.type };
    case 'update-volunteer-role':
      return { type: cmd.type, roleId: option(cmd.roleId, ['sorting', 'distribution'] as const),
        capacity: integer(cmd.capacity, 1, 100), instructions: text(cmd.instructions, 600) };
    case 'record-attendance':
      return { type: cmd.type, accountId: text(cmd.accountId), minutes: integer(cmd.minutes, 0, 1440) };
    case 'send': {
      if (!Array.isArray(cmd.needs) || cmd.needs.length > categories.length) invalid();
      const fields = object(cmd.shared);
      const shared = detailsToShare(shareFields.filter((key) => Object.hasOwn(fields, key)), details);
      return { type: cmd.type, id: text(cmd.id), partnerId: text(cmd.partnerId), message: text(cmd.message, 4000),
        needs: cmd.needs.map((value) => option(value, categories)), shared, at };
    }
    case 'accept':
      return { type: cmd.type, id: text(cmd.id), partnerId: text(cmd.partnerId), at };
    case 'schedule': {
      const appointment = cmd.appointment === null ? null : object(cmd.appointment);
      return { type: cmd.type, id: text(cmd.id), partnerId: text(cmd.partnerId), appointment: appointment && {
        date: text(appointment.date, 10), time: text(appointment.time, 5),
        instructions: appointment.instructions === '' ? '' : text(appointment.instructions, 600),
      } };
    }
    case 'decline-service':
      return { type: cmd.type, id: text(cmd.id), partnerId: text(cmd.partnerId),
        category: option(cmd.category, categories), reason: text(cmd.reason, 1200), at };
    case 'propose-handoff':
      return { type: cmd.type, id: text(cmd.id), partnerId: text(cmd.partnerId),
        handoffId: text(cmd.handoffId), recipientId: text(cmd.recipientId),
        category: option(cmd.category, categories), reason: text(cmd.reason, 1200) };
    case 'complete':
      return { type: cmd.type, id: text(cmd.id), partnerId: text(cmd.partnerId), category: option(cmd.category, categories),
        programId: cmd.programId === undefined ? undefined : text(cmd.programId), at };
    case 'respond-handoff': {
      const response = option(cmd.response, ['approve', 'decline'] as const);
      const base = { type: cmd.type, id: text(cmd.id), handoffId: text(cmd.handoffId) } as const;
      return response === 'decline' ? { ...base, response } : { ...base, response, share: share(cmd.share), at };
    }
    case 'seek-provider':
      return { type: cmd.type, id: text(cmd.id), assignmentId: text(cmd.assignmentId), recipientId: text(cmd.recipientId),
        category: option(cmd.category, categories), message: text(cmd.message, 4000), share: share(cmd.share), at };
    case 'withdraw-need':
      return { type: cmd.type, id: text(cmd.id), category: option(cmd.category, categories) };
    default:
      return invalid();
  }
}
