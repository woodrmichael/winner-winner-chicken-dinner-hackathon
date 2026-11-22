import { useMemo } from 'react';
import type { Referral } from '../../domain/types';
import { useDemo } from '../../state/Demo';
import { defaultReportMonth, impactReport, reportKey, reportMonths, selectedReportMonth } from './report';

const emptyReferrals: Referral[] = [];

export function useImpactReport(period: string | undefined, provider: string | null = null) {
  const { state, shared } = useDemo();
  const stored = shared.data?.reporting.impactReports;
  const referrals = shared.enabled ? emptyReferrals : state.referrals;
  const requiresSignIn = shared.enabled && !shared.data;

  return useMemo(() => {
    const source = { referrals };
    const months = stored?.months ?? reportMonths(source);
    const month = selectedReportMonth(period, months, stored?.defaultMonth ?? defaultReportMonth(source));
    const sharedPeriod = stored?.periods[reportKey(month)];
    const completeReport = sharedPeriod?.all ?? impactReport(source, month, null);
    const report = provider
      ? sharedPeriod?.byProvider[provider] ?? impactReport(source, month, provider)
      : completeReport;
    return { months, month, completeReport, report, requiresSignIn };
  }, [period, provider, referrals, stored, requiresSignIn]);
}
