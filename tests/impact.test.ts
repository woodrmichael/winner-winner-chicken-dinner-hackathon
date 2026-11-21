import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCommand, deliveredServices, impact, mapRows, partnerInbox, residentTimeline } from '../src/domain/model';
import { outstandingNeeds } from '../src/domain/referrals';
import { profile, program, seedState, withDemoSamples } from '../src/domain/seed';
import { categories, type Command } from '../src/domain/types';
import {
  defaultReportMonth,
  impactReport,
  organizationServiceRecords,
  periodName,
  reportMonths,
  reportSummary,
  reportingMonth,
  serviceRecordsCsv,
} from '../src/features/impact/report';
import { decode } from '../src/state/persistence';

const send = {
  type: 'send',
  id: 'coat-request',
  partnerId: 'winter-team',
  at: '2026-11-01T04:00:00Z',
  message: 'Please keep this request private.',
  needs: ['Clothing'],
  shared: { firstName: profile.firstName, callback: profile.callback },
} satisfies Command;
const accept = {
  type: 'accept',
  id: send.id,
  partnerId: send.partnerId,
  at: '2026-11-01T04:30:00Z',
} satisfies Command;

test('monthly requests and deliveries use separate dates at Milwaukee month boundaries', () => {
  const seed = seedState();
  const baseline = { ...seed, referrals: seed.referrals.filter(({ id }) => id.startsWith('seed-')) };
  const accepted = applyCommand(applyCommand(baseline, send), accept);
  const state = applyCommand(accepted, {
    type: 'complete',
    id: send.id,
    partnerId: send.partnerId,
    category: 'Clothing',
    programId: program.id,
    at: '2026-11-01T05:00:00Z',
  });
  const [november, october] = reportMonths(state, new Date('2026-11-21T18:00:00Z'));
  assert.equal(periodName(october), 'October 2026');
  assert.equal(periodName(november), 'November 2026');
  const octoberReport = impactReport(state, october, null);
  assert.equal(octoberReport.received, 1);
  assert.equal(octoberReport.delivered, 0);
  assert.equal(octoberReport.medianResponse, 30 * 60_000);
  const novemberReport = impactReport(state, november, null);
  assert.equal(novemberReport.received, 4);
  assert.equal(novemberReport.delivered, 3);

  const winter = impactReport(state, november, 'winter-team');
  assert.equal(winter.received, novemberReport.received);
  assert.equal(winter.open, novemberReport.open);
  assert.equal(winter.medianResponse, novemberReport.medianResponse);
  assert.equal(winter.delivered, 2);
  assert.equal(winter.assisted, 2);
  assert.deepEqual(winter.byCategory, [{ name: 'Clothing', count: 2 }]);
  assert.deepEqual(winter.byProvider, [{ name: 'Winter Care Collective', count: 2 }]);
  assert.equal(winter.programDeliveries[1].date, 'Nov 1, 2026');
  assert.equal(impactReport(state, november, 'ride-circle').delivered, 0);

  const summary = reportSummary(winter, novemberReport.programDeliveries.length);
  assert.match(summary, /November 2026/);
  assert.match(summary, /Services delivered: 2\nResidents assisted: 2\nWinter Care Collective — 2/);
  assert.match(summary, /Requests received across all providers: 4/);
  assert(!summary.includes(send.message));
  assert(!summary.includes(profile.callback));
  assert(!summary.includes(profile.firstName));
  assert(!summary.includes(send.id));
});

test('demo fixtures enrich older workspaces without replacing existing records', () => {
  const full = seedState();
  const previous = applyCommand(
    { ...full, posts: full.posts.slice(0, 3), referrals: full.referrals.slice(0, 4) },
    send,
  );
  const bookmarked = applyCommand(previous, { type: 'save-post', postId: 'drive', saved: true });
  const expanded = withDemoSamples(decode(JSON.stringify(bookmarked)));
  assert.equal(expanded.referrals.length, full.referrals.length + 1);
  assert.deepEqual(
    expanded.referrals.find(({ id }) => id === send.id),
    previous.referrals.find(({ id }) => id === send.id),
  );
  assert.deepEqual(expanded.community.savedPostIds, ['drive']);
  assert.equal(withDemoSamples(expanded), expanded);
  assert.deepEqual(expanded.posts, full.posts);

  const month = defaultReportMonth(full);
  const report = impactReport(full, month, null);
  const total = impactReport(full, null, null);
  assert.equal(report.period, 'November 2026');
  assert.equal(report.received, 126);
  assert(report.delivered > 80);
  assert(report.assisted < report.delivered);
  assert.equal(total.delivered, deliveredServices(full).length);
  assert.equal(total.delivered, total.byProvider.reduce((sum, { count }) => sum + count, 0));
  const community = impact(full);
  assert.deepEqual(
    [total.received, total.open, total.delivered, total.programDeliveries.length],
    [community.received, community.open, community.delivered, community.programDeliveries],
  );
  for (const { area, delivered } of mapRows(full)) {
    assert(delivered > 20);
    const local = full.referrals.filter(({ assignments }) => assignments[0].shared.neighborhood === area);
    assert.equal(delivered, local.flatMap(({ services }) => services).length);
  }
  for (const category of categories) {
    const rows = mapRows(full, category);
    const shared = full.referrals.filter(({ assignments }) => assignments[0].shared.neighborhood);
    assert.equal(
      rows.reduce((sum, row) => sum + row.open, 0),
      shared.flatMap(outstandingNeeds).filter((need) => need === category).length,
    );
    assert.equal(
      rows.reduce((sum, row) => sum + row.delivered, 0),
      shared.flatMap(({ services }) => services).filter((service) => service.category === category).length,
    );
  }
  assert.equal(residentTimeline(full).length, 3);
  assert(partnerInbox(full, 'winter-team').some(({ status }) => status === 'Sent'));
});

test('median excludes unanswered referrals and retains first acceptance across reload', () => {
  const empty = { ...seedState(), referrals: [] };
  const unaccepted = applyCommand(applyCommand(empty, send), { ...send, id: 'waiting' });
  const waitingReport = impactReport(unaccepted, null, null);
  assert.equal(waitingReport.awaiting, 2);
  assert.equal(waitingReport.medianResponse, null);
  const accepted = applyCommand(unaccepted, accept);
  const twoAnswered = applyCommand(
    applyCommand(accepted, { ...send, id: 'later' }),
    { ...accept, id: 'later', at: '2026-11-01T05:30:00Z' },
  );
  const reaccepted = applyCommand(twoAnswered, { ...accept, at: '2026-11-01T06:30:00Z' });
  const state = decode(JSON.stringify(reaccepted));
  const [, october] = reportMonths(state, new Date('2026-11-01T12:00:00Z'));
  const report = impactReport(state, october, 'table');
  assert.equal(report.received, 3);
  assert.equal(report.answered, 2);
  assert.equal(report.awaiting, 1);
  assert.equal(report.medianResponse, 60 * 60_000);
  assert.equal(report.delivered, 0);
});

test('organization exports reconcile with provider Impact and exclude unrelated records', () => {
  const state = seedState();
  const month = reportingMonth('2026-11-21T18:00:00Z');
  const winterRecords = organizationServiceRecords(state, 'winter-team', month);
  const tableRecords = organizationServiceRecords(state, 'table', month);
  const winterReport = impactReport(state, month, 'winter-team');
  assert.equal(winterRecords.length, winterReport.delivered);
  assert(winterRecords.every((record) => record.providerId === 'winter-team'));
  assert(!winterRecords.some((record) => record.providerId === 'table'));
  const csv = serviceRecordsCsv(winterRecords);
  assert(csv.includes('Delivery date'));
  assert(csv.includes('Category'));
  assert(csv.includes('Winter Care Collective'));
  assert(csv.includes(winterRecords[0].deliveredAt));
  assert.equal(tableRecords.length, impactReport(state, month, 'table').delivered);
  assert.equal(organizationServiceRecords(state, 'winter-team', reportingMonth('2026-01-01T00:00:00Z')).length, 0);
});
