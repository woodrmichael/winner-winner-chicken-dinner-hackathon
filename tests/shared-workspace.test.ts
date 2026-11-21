import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { type TestContext } from 'node:test';
import { createApi, withPassword } from '../server/api';
import { createWorkspace, demoAccounts, restoreCommunication, type Workspace } from '../server/workspace';
import type { SharedSnapshot } from '../src/shared/workspace';

async function fixture(t: TestContext) {
  const password = (id: string) => `test-password-for-${id}`;
  let saved = createWorkspace([
    ...demoAccounts.map((account) => withPassword(account, password(account.id))),
    withPassword({ id: 'ride-worker', name: 'Avery Green', kind: 'worker', details: {},
      membership: { partnerId: 'ride-circle', status: 'approved', admin: false } }, password('ride-worker')),
  ]);
  const server = createApi(saved, (next: Workspace) => { saved = JSON.parse(JSON.stringify(next)); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const address = server.address();
  assert(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;

  async function request<T>(path: string, method: string, token?: string, body?: unknown) {
    const response = await fetch(url + path, { method, headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json() as T };
  }

  return {
    request,
    async login(username: string) {
      const result = await request<{ token: string; workspace: SharedSnapshot }>('/session', 'POST', undefined,
        { username, password: password(username) });
      assert.equal(result.status, 200);
      assert.ok(!('passwordHash' in result.data.workspace.account));
      return result.data.token;
    },
    read: (token: string) => request<SharedSnapshot>('/workspace', 'GET', token),
    command: (token: string, body: unknown) => request<SharedSnapshot>('/commands', 'POST', token, body),
    stored: () => saved,
  };
}

test('partnerships route private inquiries to organizers and publish only confirmed project support', async (t) => {
  const api = await fixture(t);
  const resident = await api.login('alex');
  const organizer = await api.login('organizer');
  const observer = await api.login('jordan');
  const submit = (token: string, entry: object) => api.command(token, { type: 'partnership', entry });
  const before = (await api.read(observer)).data;
  const offer = { kind: 'offer', id: 'team', project: 'drive', business: 'Corner Shop', supplies: 15000, operations: 5000, volunteers: 2 };
  assert.equal((await submit(resident, { kind: 'inquiry', id: 'question', project: 'drive', business: 'Corner Shop',
    proposal: 'Could we bring a team?', contact: 'Email the team lead' })).status, 200);
  assert.equal((await submit(resident, offer)).status, 200);
  const pending = (await api.read(observer)).data;
  assert.deepEqual(pending.support, before.support);
  assert.deepEqual(pending.volunteers.summary, before.volunteers.summary);
  const inbox = (await api.read(organizer)).data.support;
  assert.equal(inbox.inquiries[0].contact, 'Email the team lead');
  assert.equal(inbox.offers.length, 1);
  const confirm = { kind: 'confirm', id: 'review', offerId: 'team' };
  assert.equal((await submit(resident, confirm)).status, 403);
  assert.equal((await submit(organizer, confirm)).status, 200);
  assert.equal((await submit(organizer, { kind: 'payment', id: 'check', cents: 5000, pledgeId: 'team' })).status, 200);
  const publicView = (await api.read(observer)).data;
  const sponsor = publicView.support.pledges.find((p) => p.id === 'team');
  assert.equal(sponsor?.paid, 5000);
  assert.equal(sponsor?.volunteers, 2);
  assert.deepEqual(publicView.reporting.projectDeliveries, before.reporting.projectDeliveries);
  assert(!JSON.stringify(publicView).includes('Email the team lead'));
});

test('shared map filters count the outstanding ride and delivered coat separately', async (t) => {
  const api = await fixture(t);
  const resident = await api.login('alex');
  const worker = await api.login('winter-worker');
  const observer = await api.login('jordan');
  const id = 'map-category-referral';
  const message = 'Private clothing and ride request for the map check';
  const before = (await api.read(observer)).data.reporting;

  assert.equal((await api.command(resident, {
    type: 'send', id, partnerId: 'winter-team', message,
    needs: ['Clothing', 'Transportation'], shared: { neighborhood: 'Harambee' },
  })).status, 200);
  assert.equal((await api.command(worker, { type: 'accept', id, partnerId: 'winter-team' })).status, 200);
  assert.equal((await api.command(worker, { type: 'complete', id, partnerId: 'winter-team', category: 'Clothing' })).status, 200);

  const snapshot = (await api.read(observer)).data;
  const after = snapshot.reporting.mapByCategory;
  const harambee = (groups: typeof after, category: 'Clothing' | 'Transportation') =>
    groups.find((entry) => entry.category === category)?.rows.find((row) => row.area === 'Harambee');
  const clothesBefore = harambee(before.mapByCategory, 'Clothing');
  const clothesAfter = harambee(after, 'Clothing');
  const ridesBefore = harambee(before.mapByCategory, 'Transportation');
  const ridesAfter = harambee(after, 'Transportation');
  assert(clothesBefore && clothesAfter && ridesBefore && ridesAfter);
  assert.deepEqual(clothesAfter, { ...clothesBefore, delivered: clothesBefore.delivered + 1 });
  assert.deepEqual(ridesAfter, { ...ridesBefore, open: ridesBefore.open + 1 });
  const beforeImpact = before.impactReports.periods.all;
  const afterImpact = snapshot.reporting.impactReports.periods.all;
  assert.equal(afterImpact.all.received, beforeImpact.all.received + 1);
  assert.equal(afterImpact.byProvider['winter-team'].delivered, beforeImpact.byProvider['winter-team'].delivered + 1);
  assert.equal(afterImpact.all.delivered, snapshot.reporting.impact.delivered);
  assert(!JSON.stringify(snapshot.reporting.impactReports).includes(id));
  assert(!JSON.stringify(snapshot).includes(message));
});

test('an older shared workspace opens with empty communication history', () => {
  const { communication, ...older } = createWorkspace([]);
  const migrated = restoreCommunication(JSON.parse(JSON.stringify(older)));
  assert.deepEqual(migrated, { ...older, communication });
});

test('private threads and unread updates follow the assignment and persist per account', async (t) => {
  const api = await fixture(t);
  const resident = await api.login('alex');
  const worker = await api.login('winter-worker');
  const colleague = await api.login('organizer');
  const neighbor = await api.login('jordan');
  const pending = await api.login('candidate');
  const rideWorker = await api.login('ride-worker');
  assert.equal((await api.command(pending, { type: 'request-membership', partnerId: 'winter-team' })).status, 200);
  const id = 'thread-task-8';
  const send = {
    type: 'send', id, partnerId: 'winter-team', message: 'Coats and a ride after a fire',
    needs: ['Clothing', 'Transportation'], shared: {},
  };
  assert.equal((await api.command(resident, send)).status, 200);
  assert.equal((await api.command(resident, send)).status, 200);
  assert.deepEqual((await api.read(resident)).data.updates, []);
  const incoming = (await api.read(worker)).data.updates;
  assert.equal(incoming.length, 1);
  assert.equal(incoming[0].kind, 'new-referral');
  assert.equal(incoming[0].assignmentId, id);
  assert.equal(incoming[0].read, false);
  const mark = { type: 'mark-activity-read', updateId: incoming[0].id };
  assert.equal((await api.command(neighbor, mark)).status, 404);
  assert.equal((await api.command(resident, mark)).status, 404);
  assert.equal((await api.command(worker, mark)).data.updates[0].read, true);
  assert.equal((await api.read(await api.login('winter-worker'))).data.updates[0].read, true);
  assert.equal((await api.read(colleague)).data.updates[0].read, false);

  const accept = { type: 'accept', id, partnerId: 'winter-team' };
  assert.equal((await api.command(worker, accept)).status, 200);
  assert.equal((await api.command(worker, accept)).status, 200);
  assert.deepEqual((await api.read(resident)).data.updates.map(({ kind, read }) => ({ kind, read })), [
    { kind: 'accepted', read: false },
  ]);

  const question = {
    type: 'send-referral-message', assignmentId: id, messageId: 'same-client-id', body: 'Which sizes should I bring?',
  };
  assert.equal((await api.command(worker, question)).status, 200);
  assert.equal((await api.command(worker, question)).status, 200);
  assert.equal((await api.command(neighbor, question)).status, 404);
  assert.equal((await api.command(pending, question)).status, 404);
  assert.equal((await api.command(rideWorker, question)).status, 404);
  assert.equal((await api.command(resident, { ...question, body: '   ' })).status, 400);
  assert.equal((await api.command(resident, { ...question, body: '6 and 8', sender: 'Fake Worker' })).status, 200);

  const thread = (await api.read(resident)).data.messages;
  const workerThread = (await api.read(worker)).data.messages;
  assert.deepEqual(thread.map(({ sender, body, sentByYou }) => ({ sender, body, sentByYou })), [
    { sender: 'Jamie Reed', body: question.body, sentByYou: false },
    { sender: 'Resident', body: '6 and 8', sentByYou: true },
  ]);
  assert.deepEqual(workerThread.map(({ sentByYou }) => sentByYou), [true, false]);
  assert.equal(new Set(thread.map(({ id: messageId }) => messageId)).size, 2);
  assert.ok(thread.every(({ at }) => Number.isFinite(Date.parse(at))));
  assert.ok(thread.every((message) => !('senderId' in message) && !('requestId' in message)));
  const workerReply = (await api.read(worker)).data.updates.filter((update) => update.kind === 'reply');
  assert.equal(workerReply.length, 1);
  assert.equal(workerReply[0].read, false);
  assert.equal((await api.read(resident)).data.updates.filter((update) => update.kind === 'reply').length, 1);
  assert.equal((await api.read(pending)).data.updates.length, 0);
  assert.equal((await api.read(neighbor)).data.messages.length, 0);

  const handoffId = 'thread-ride-handoff';
  const propose = { type: 'propose-handoff', id, partnerId: 'winter-team', handoffId,
    recipientId: 'ride-circle', category: 'Transportation', reason: 'Arrange the pickup ride' };
  assert.equal((await api.command(worker, propose)).status, 200);
  assert.equal((await api.command(worker, propose)).status, 200);
  const handoffs = (await api.read(resident)).data.updates.filter((update) => update.kind === 'proposed-handoff');
  assert.equal(handoffs.length, 1);
  assert.equal(handoffs[0].assignmentId, id);
  assert.deepEqual((await api.read(rideWorker)).data.updates, []);
  assert.equal((await api.command(resident, { type: 'respond-handoff', id, handoffId, response: 'approve', share: [] })).status, 200);
  const newPartner = (await api.read(rideWorker)).data;
  assert.equal(newPartner.updates[0].assignmentId, handoffId);
  assert.deepEqual(newPartner.messages, []);
  assert.equal((await api.command(rideWorker, question)).status, 404);
  assert.equal((await api.command(rideWorker, { ...question, assignmentId: handoffId, body: 'What time is pickup?' })).status, 200);
  assert.deepEqual((await api.read(worker)).data.messages.map(({ assignmentId }) => assignmentId), [id, id]);
  assert.equal((await api.read(resident)).data.messages.length, 3);
  assert.equal(api.stored().communication.messages.length, 3);
  assert.deepEqual(api.stored().communication.updates.find(({ id: updateId }) => updateId === mark.updateId)?.readBy, ['winter-worker']);
});

test('shared referrals are visible only to the resident and approved recipient, and approval applies to an existing session', async (t) => {
  const api = await fixture(t);
  assert.equal((await api.request('/workspace', 'GET')).status, 401);
  assert.equal((await api.request('/session', 'POST', undefined, { username: 'alex', password: 'wrong' })).status, 401);
  const resident = await api.login('alex');
  const neighbor = await api.login('jordan');
  const worker = await api.login('winter-worker');
  const unrelated = await api.login('table-worker');
  const candidate = await api.login('candidate');
  const admin = await api.login('organizer');
  const id = 'private-referral';
  const message = 'Private request for a size 6 coat from another device';

  const sent = await api.command(resident, { type: 'send', id, partnerId: 'winter-team', message,
    needs: ['Clothing'], shared: { firstName: 'Forged name', residentId: 'jordan' } });
  assert.equal(sent.status, 200);
  assert.equal(sent.data.referrals[0].residentId, 'alex');
  assert.deepEqual(sent.data.referrals[0].assignments[0].shared, { firstName: 'Alex' });
  assert.ok(!JSON.stringify((await api.read(neighbor)).data).includes(message));
  assert.ok(!JSON.stringify((await api.read(unrelated)).data).includes(message));
  assert.equal((await api.command(neighbor, { type: 'withdraw-need', id, category: 'Clothing' })).status, 404);
  assert.equal((await api.command(unrelated, { type: 'complete', id, partnerId: 'winter-team', category: 'Clothing' })).status, 403);
  assert.equal((await api.command(unrelated, { type: 'complete', id, partnerId: 'table', category: 'Clothing' })).status, 404);

  const inbox = (await api.read(worker)).data.inbox.find((ticket) => ticket.assignment.id === id);
  assert.equal(inbox?.assignment.message, message);
  assert.ok(inbox && !('residentId' in inbox));
  assert.equal((await api.command(candidate, { type: 'request-membership', partnerId: 'winter-team' })).status, 200);
  assert.equal((await api.read(candidate)).data.inbox.length, 0);
  assert.equal((await api.command(candidate, { type: 'accept', id, partnerId: 'winter-team' })).status, 403);
  assert.equal((await api.command(worker, { type: 'approve-membership', accountId: 'candidate' })).status, 403);
  assert.deepEqual((await api.read(admin)).data.requests.map((entry) => entry.id), ['candidate']);
  assert.equal((await api.command(admin, { type: 'approve-membership', accountId: 'candidate' })).status, 200);
  assert.ok((await api.read(candidate)).data.inbox.some((ticket) => ticket.assignment.id === id));
  assert.equal((await api.command(candidate, { type: 'accept', id, partnerId: 'winter-team' })).status, 200);
  const accepted = (await api.read(resident)).data.referrals[0];
  assert.ok(accepted.assignments[0].acceptedAt);
  assert.equal(api.stored().referrals[0].assignments[0].acceptedAt, accepted.assignments[0].acceptedAt);
  assert.equal((await api.request('/session', 'DELETE', candidate)).status, 200);
  assert.equal((await api.read(candidate)).status, 401);
});

test('shared volunteer capacity and confirmed time come from the same signups', async (t) => {
  const api = await fixture(t);
  const alex = await api.login('alex');
  const jordan = await api.login('jordan');
  const sam = await api.login('sam');
  const admin = await api.login('organizer');
  const reserve = { type: 'reserve-volunteer', roleId: 'distribution' };

  const roles = (await api.read(alex)).data.volunteers.roles;
  assert.deepEqual(roles.map(({ capacity }) => capacity), [4, 2]);
  assert.equal((await api.command(alex, reserve)).status, 200);
  const claims = await Promise.all([api.command(jordan, reserve), api.command(sam, reserve)]);
  assert.deepEqual(claims.map(({ status }) => status).sort(), [200, 409]);
  const winner = claims[0].status === 200 ? jordan : sam;
  const other = winner === jordan ? sam : jordan;
  const otherId = other === jordan ? 'jordan' : 'sam';
  assert.deepEqual((await api.read(admin)).data.volunteers.roles.map(({ reserved }) => reserved), [0, 2]);
  assert.equal((await api.command(winner, { type: 'cancel-volunteer' })).status, 200);
  assert.deepEqual((await api.read(admin)).data.volunteers.roles.map(({ reserved }) => reserved), [0, 1]);
  assert.equal((await api.command(other, reserve)).status, 200);

  const attendance = { type: 'record-attendance', accountId: 'alex', minutes: 120 };
  assert.equal((await api.command(alex, attendance)).status, 403);
  assert.equal((await api.command(admin, { ...attendance, minutes: -1 })).status, 400);
  assert.equal((await api.command(admin, attendance)).status, 200);
  assert.equal((await api.command(admin, { ...attendance, accountId: otherId, minutes: 0 })).status, 200);
  const personal = (await api.read(alex)).data.volunteers;
  assert.equal(personal.signup?.minutes, 120);
  assert.deepEqual(personal.roster, []);
  assert.deepEqual(personal.summary, { signups: 2, participants: 1, minutes: 120 });
  assert.equal((await api.read(other)).data.volunteers.signup?.minutes, 0);
  assert.equal(api.stored().signups.find(({ accountId }) => accountId === 'alex')?.minutes, 120);
  assert.equal((await api.command(alex, { type: 'cancel-volunteer' })).status, 409);
});

test('post reports stay private and only the moderator account can hide a post', async (t) => {
  const api = await fixture(t);
  const alex = await api.login('alex');
  const jordan = await api.login('jordan');
  const worker = await api.login('winter-worker');
  const moderator = await api.login('organizer');

  const report = {
    type: 'report-post',
    postId: 'pantry',
    id: 'pantry-report-shared',
    reporterId: 'fake-id',
    reason: 'The pickup details are incorrect.',
  };
  assert.equal((await api.command(alex, report)).status, 200);
  assert.equal((await api.command(jordan, report)).status, 200);
  assert.equal((await api.command(worker, report)).status, 403);

  const residentSnapshot = (await api.read(jordan)).data;
  assert.equal(residentSnapshot.community.reports.length, 0);
  assert.equal(residentSnapshot.posts.some((post) => post.id === 'pantry'), true);

  assert.equal((await api.command(worker, {
    type: 'hide-post',
    postId: 'pantry',
    moderatorId: 'winter-worker',
    reason: 'Unauthorized moderation.',
  })).status, 403);

  const hide = {
    type: 'hide-post',
    postId: 'pantry',
    moderatorId: 'organizer',
    reason: 'Verified as an outdated duplicate.',
  };
  assert.equal((await api.command(moderator, hide)).status, 200);
  assert.equal((await api.command(moderator, hide)).status, 200);

  const hiddenToResident = (await api.read(jordan)).data;
  assert.equal(hiddenToResident.posts.some((post) => post.id === 'pantry'), false);
  assert.equal(hiddenToResident.community.reports.length, 0);
  const hiddenToModerator = (await api.read(moderator)).data;
  assert.equal(hiddenToModerator.posts.find((post) => post.id === 'pantry')?.status, 'hidden');
  assert.equal(hiddenToModerator.community.reports.length, 2);
  assert.equal(hiddenToModerator.community.moderation.length, 1);
});

test('worker service exports and corrections reconcile across the shared workspace', async (t) => {
  const api = await fixture(t);
  const winter = await api.login('winter-worker');
  const table = await api.login('table-worker');
  const resident = await api.login('alex');
  const id = 'task12-correction';
  assert.equal((await api.command(resident, {
    type: 'send',
    id,
    partnerId: 'winter-team',
    message: 'A coat for the correction check',
    needs: ['Clothing'],
    shared: { neighborhood: 'Harambee' },
  })).status, 200);
  assert.equal((await api.command(winter, {
    type: 'accept', id, partnerId: 'winter-team',
  })).status, 200);
  assert.equal((await api.command(winter, {
    type: 'complete', id, partnerId: 'winter-team', category: 'Clothing',
  })).status, 200);
  const beforeWinter = (await api.read(winter)).data;
  const beforeDelivered = beforeWinter.reporting.impact.delivered;
  const beforeRecord = beforeWinter.reporting.serviceRecords.find(
    (record) => record.referralId === id,
  );
  assert(beforeRecord);
  assert(beforeWinter.reporting.serviceRecords.every((record) => record.providerId === 'winter-team'));

  const unauthorized = {
    type: 'correct-service',
    id,
    partnerId: 'winter-team',
    serviceId: beforeRecord.id,
    void: true,
    reason: 'Should be rejected.',
  };
  assert.equal((await api.command(table, unauthorized)).status, 403);

  const correction = {
    ...unauthorized,
    workerId: 'forged-id',
    workerName: 'Forged name',
  };
  assert.equal((await api.command(winter, correction)).status, 200);
  assert.equal((await api.command(winter, correction)).status, 200);

  const afterWinter = (await api.read(winter)).data;
  assert.equal(afterWinter.reporting.impact.delivered, beforeDelivered - 1);
  assert.equal(afterWinter.reporting.serviceRecords.find(
    (record) => record.id === beforeRecord.id,
  )?.voidedAt === undefined, false);
  const residentAfter = (await api.read(resident)).data;
  assert(residentAfter.referrals.some((referral) =>
    referral.id === id &&
    referral.services.every((service) => service.id !== beforeRecord.id || service.voidedAt),
  ));
  const correctionRecord = afterWinter.reporting.serviceRecords.find(
    (record) => record.id === beforeRecord.id,
  );
  assert.equal(correctionRecord?.corrections[0].workerId, 'winter-worker');
  assert.equal(correctionRecord?.corrections[0].workerName, 'Jamie Reed');
  assert(correctionRecord?.corrections[0].reason);
});
