import Stripe from 'stripe';
import { appendEntry, projects, supportBook, type Pledge } from '../src/features/partnerships/ledger';
import { WorkspaceError } from '../src/shared/referralAccess';
import { isOrganizer, type SponsorCheckout, type Workspace } from '../src/shared/workspaceModel';
import type { Account } from '../src/shared/workspace';

export type SponsorGateway = {
  create(pledge: Pledge, cents: number): Promise<{ id: string; url: string | null }>;
  event(raw: Buffer, signature: string): Stripe.Event;
};

export function createSponsorGateway(): SponsorGateway | undefined {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const address = process.env.STRIPE_CHECKOUT_RETURN_ORIGIN?.trim();
  if (!key || !signingSecret || !address) return undefined;
  const origin = new URL(address);
  if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) {
    throw new Error('STRIPE_CHECKOUT_RETURN_ORIGIN must use HTTPS or a local loopback address.');
  }
  const stripe = new Stripe(key, { timeout: 5000, maxNetworkRetries: 1 });
  const returnUrl = new URL('/sponsorship/return', origin);
  return {
    create(pledge, cents) {
      const project = projects.find(({ id }) => id === pledge.project)!;
      return stripe.checkout.sessions.create({
        mode: 'payment',
        integration_identifier: 'comforce_sponsor_kwtzpvqm',
        adaptive_pricing: { enabled: false },
        client_reference_id: pledge.id,
        metadata: { flow: 'comforce_sponsorship' },
        line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: cents,
          product_data: { name: `${project.name} sponsorship` } } }],
        success_url: `${returnUrl}?result=received`,
        cancel_url: `${returnUrl}?result=cancelled`,
      });
    },
    event: (raw, signature) => stripe.webhooks.constructEvent(raw, signature, signingSecret),
  };
}

function findPledge(workspace: Workspace, pledgeId: string) {
  return supportBook(workspace.supportEntries).pledges.find(({ id }) => id === pledgeId);
}

function balance(pledge: Pledge) {
  return pledge.supplies + pledge.operations - pledge.paid;
}

export function createSponsorPayments(gateway: SponsorGateway, read: () => Workspace, save: (next: Workspace) => void) {
  const creating = new Set<string>();
  return {
    async checkout(account: Account, pledgeId: unknown, cents: unknown) {
      if (!isOrganizer(account)) throw new WorkspaceError(403, 'Coordinator access is required.');
      if (typeof pledgeId !== 'string' || !pledgeId || pledgeId.length > 160) {
        throw new WorkspaceError(400, 'Choose a confirmed pledge.');
      }
      const workspace = read();
      const pledge = findPledge(workspace, pledgeId);
      if (!pledge) throw new WorkspaceError(404, 'Pledge unavailable.');
      const active = workspace.sponsorCheckouts?.find((entry) => entry.pledgeId === pledgeId);
      if (active) return { url: active.url, sessionId: active.sessionId };
      if (typeof cents !== 'number' || !Number.isSafeInteger(cents) || cents < 50 || cents > 99_999_999 || cents > balance(pledge)) {
        throw new WorkspaceError(400, 'Enter an amount of at least $0.50 within the remaining pledge and Stripe’s payment limit.');
      }
      if (creating.has(pledgeId)) throw new WorkspaceError(409, 'A payment link is being created. Try again shortly.');
      creating.add(pledgeId);
      try {
        const session = await gateway.create(pledge, cents);
        if (!session.url) throw new WorkspaceError(502, 'Stripe did not return a payment link. Try again.');
        const current = read();
        const actor = current.accounts.find(({ id }) => id === account.id);
        if (!actor || !isOrganizer(actor)) throw new WorkspaceError(403, 'Coordinator access is required.');
        const currentPledge = findPledge(current, pledgeId);
        if (!currentPledge || cents > balance(currentPledge)) {
          throw new WorkspaceError(409, 'The pledge balance changed. Review the remaining balance and try again.');
        }
        const checkout: SponsorCheckout = { sessionId: session.id, pledgeId, cents, url: session.url };
        save({ ...current, sponsorCheckouts: [...(current.sponsorCheckouts ?? []), checkout] });
        return { url: checkout.url, sessionId: checkout.sessionId };
      } finally {
        creating.delete(pledgeId);
      }
    },

    webhook(raw: Buffer, signature: string) {
      let event: Stripe.Event;
      try {
        event = gateway.event(raw, signature);
      } catch {
        throw new WorkspaceError(400, 'Invalid Stripe webhook signature.');
      }
      switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded':
        case 'checkout.session.async_payment_failed':
        case 'checkout.session.expired':
          break;
        default: return;
      }
      const session = event.data.object;
      const workspace = read();
      const checkout = workspace.sponsorCheckouts?.find(({ sessionId }) => session.id === sessionId);
      if (!checkout || session.metadata?.flow !== 'comforce_sponsorship') return;
      if (session.client_reference_id !== checkout.pledgeId || session.amount_total !== checkout.cents || session.currency !== 'usd' || session.mode !== 'payment') {
        throw new WorkspaceError(409, 'Stripe payment does not match the active pledge checkout.');
      }
      const closed = event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed';
      if (!closed && session.payment_status !== 'paid') return;
      save({ ...workspace,
        supportEntries: closed ? workspace.supportEntries : appendEntry(workspace.supportEntries, {
          kind: 'payment', id: `stripe:${session.id}`, pledgeId: checkout.pledgeId, cents: checkout.cents,
        }),
        sponsorCheckouts: workspace.sponsorCheckouts?.filter(({ sessionId }) => sessionId !== session.id),
      });
    },
  };
}
