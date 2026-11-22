import { cash, funding, supportBook } from '../partnerships/ledger';
import { deliveredServices } from '../../domain/model';
import { outstandingNeeds } from '../../domain/referrals';
import { program } from '../../domain/seed';
import { categories, type DemoState, type Referral, type Service } from '../../domain/types';
import { creditedPartners, directory, partnerName } from '../matching/directory';

const timeZone = 'America/Chicago';
const monthParts = new Intl.DateTimeFormat('en-US', {
  month: 'numeric',
  year: 'numeric',
  timeZone,
});
const monthLabel = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const deliveryDate = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone,
});
export const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function reportingMonth(at: string | Date) {
  const parts = monthParts.formatToParts(new Date(at));
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  return year * 12 + month - 1;
}

export function periodName(month: number | null) {
  if (month === null) return 'All time';
  const date = new Date(0);
  date.setUTCFullYear(Math.floor(month / 12), month % 12, 1);
  return monthLabel.format(date);
}

type ReferralSource = Pick<DemoState, 'referrals'> & Partial<Pick<DemoState, 'partners'>>;

function providersOf(state: ReferralSource) {
  const partners = state.partners ?? directory;
  return creditedPartners(
    partners,
    deliveredServices(state).map((service) => service.providerId),
  );
}

export function reportMonths(state: ReferralSource, now = new Date()) {
  const current = reportingMonth(now);
  const recorded = [
    ...state.referrals.map(({ sentAt }) => reportingMonth(sentAt)),
    ...deliveredServices(state).map(({ deliveredAt }) => reportingMonth(deliveredAt)),
  ];
  const first = Math.min(current - 1, ...recorded);
  const last = Math.max(current, ...recorded);
  return Array.from({ length: last - first + 1 }, (_, index) => last - index);
}

export function defaultReportMonth(state: ReferralSource, now = new Date()) {
  const mostRecent = Math.max(
    ...state.referrals.map(({ sentAt }) => Date.parse(sentAt)),
    ...deliveredServices(state).map(({ deliveredAt }) => Date.parse(deliveredAt)),
  );
  return reportingMonth(Number.isFinite(mostRecent) ? new Date(mostRecent) : now);
}

export function selectedReportMonth(period: string | undefined, months: number[], defaultMonth: number) {
  if (period === 'all') return null;
  const month = Number(period);
  return months.includes(month) ? month : defaultMonth;
}

function firstResponse(referral: Referral) {
  const accepted = referral.assignments.flatMap(({ acceptedAt }) =>
    acceptedAt ? [Date.parse(acceptedAt)] : [],
  );
  if (!accepted.length) return null;
  return Math.max(0, Math.min(...accepted) - Date.parse(referral.sentAt));
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return (sorted[middle] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2;
}

export function responseTime(milliseconds: number | null) {
  if (milliseconds === null) return '—';
  if (milliseconds === 0) return '0 min';
  if (milliseconds < 60_000) return '<1 min';
  const minutes = Math.round(milliseconds / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days) return hours % 24 ? `${days}d ${hours % 24}h` : `${days}d`;
  if (hours) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
  return `${minutes} min`;
}

export function impactReport(state: ReferralSource, month: number | null, providerId: string | null) {
  const inPeriod = (at: string) => month === null || reportingMonth(at) === month;
  const services: Service[] = [];
  const assisted = new Set<string>();
  const replies: number[] = [];
  let received = 0;
  let open = 0;
  let awaiting = 0;

  for (const referral of state.referrals) {
    const deliveries = referral.services.filter(
      (service) =>
        !service.voidedAt &&
        inPeriod(service.deliveredAt) &&
        (providerId === null || service.providerId === providerId),
    );
    if (deliveries.length) {
      services.push(...deliveries);
      assisted.add(referral.residentId);
    }
    if (!inPeriod(referral.sentAt)) continue;
    received++;
    const response = firstResponse(referral);
    const isOpen = outstandingNeeds(referral).length > 0;
    if (isOpen) open++;
    if (response !== null) replies.push(response);
    else if (isOpen) awaiting++;
  }

  return {
    period: periodName(month),
    provider: providerId === null ? 'All providers' : partnerName(state.partners ?? directory, providerId),
    received,
    open,
    delivered: services.length,
    assisted: assisted.size,
    answered: replies.length,
    awaiting,
    medianResponse: median(replies),
    byCategory: categories.map((name) => ({
      name,
      count: services.filter((service) => service.category === name).length,
    })).filter(({ count }) => count > 0).sort((a, b) => b.count - a.count),
    byProvider: providersOf(state).map(({ id, name }) => ({
      name,
      count: services.filter((service) => service.providerId === id).length,
    })).filter(({ count }) => count > 0).sort((a, b) => b.count - a.count),
    programDeliveries: services.filter(({ programId }) => programId === program.id)
      .sort((a, b) => Date.parse(b.deliveredAt) - Date.parse(a.deliveredAt))
      .map(({ category, deliveredAt, providerId }, index) => ({
        key: `${providerId}-${category}-${index}`,
        category,
        date: deliveryDate.format(new Date(deliveredAt)),
        provider: partnerName(state.partners ?? directory, providerId),
      })),
  };
}

export type ImpactReport = ReturnType<typeof impactReport>;

export function organizationServiceRecords(
  state: ReferralSource,
  providerId: string,
  month: number | null,
) {
  return deliveredServices(state)
    .filter((service) =>
      service.providerId === providerId &&
      (month === null || reportingMonth(service.deliveredAt) === month),
    )
    .sort((left, right) => Date.parse(right.deliveredAt) - Date.parse(left.deliveredAt));
}

export function serviceRecordsCsv(records: ReturnType<typeof organizationServiceRecords>) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const header = ['Delivery date', 'Category', 'Provider', 'Program'];
  const rows = records.map((record) => [
    record.deliveredAt,
    record.category,
    partnerName(record.providerId),
    record.programId ?? '',
  ]);
  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

export const reportKey = (month: number | null) => String(month ?? 'all');

export function impactReports(state: ReferralSource, now = new Date()) {
  const months = reportMonths(state, now);
  return {
    months,
    defaultMonth: defaultReportMonth(state, now),
    periods: Object.fromEntries([null, ...months].map((month) => [
      reportKey(month),
      {
        all: impactReport(state, month, null),
        byProvider: Object.fromEntries(
          providersOf(state).map(({ id }) => [id, impactReport(state, month, id)]),
        ),
      },
    ])),
  };
}

export type ImpactReports = ReturnType<typeof impactReports>;

export function reportSummary(report: ImpactReport, programDeliveryCount: number, book = supportBook()) {
  const pledges = book.pledges.filter((p) => p.project === 'drive');
  const totals = funding(pledges);
  const breakdown = ({ name, count }: { name: string; count: number }) => `${name} — ${count}`;
  return [
    'ComForce Connect · Our impact',
    `Reporting period: ${report.period} (Milwaukee time)`,
    `Delivery provider: ${report.provider}`,
    '',
    `Requests received across all providers: ${report.received}`,
    `Still open among those requests: ${report.open}`,
    `Awaiting first acceptance among those requests: ${report.awaiting}`,
    `Median time to first acceptance: ${report.medianResponse === null ? 'No acceptances yet' : responseTime(report.medianResponse)} (${report.answered} answered)`,
    '',
    `Services delivered: ${report.delivered}`,
    `Residents assisted: ${report.assisted}`,
    ...report.byProvider.map(breakdown),
    ...(report.byCategory.length ? ['By service', ...report.byCategory.map(breakdown)] : []),
    '',
    `${program.name} deliveries across all providers: ${programDeliveryCount}`,
    `Program funding to date: ${cash(totals.paid)} received toward ${dollars.format(program.goal)}, plus ${cash(totals.outstanding)} in outstanding pledges`,
    `Supplies and services received: ${cash(totals.suppliesPaid)} · Operations received: ${cash(totals.operationsPaid)}`,
    ...(totals.unallocatedPaid ? [`Earlier receipts without a recorded purpose: ${cash(totals.unallocatedPaid)}`] : []),
    `Program sponsors: ${[...new Map(pledges.map((p) => [p.business.toLowerCase(), p.business])).values()].join(', ')}`,
  ].join('\n');
}
