import { useMemo } from 'react';
import { useDemo } from '../../state/Demo';
import { defaultReportMonth, impactReport, reportKey, reportMonths, selectedReportMonth } from './report';

export function useImpactReport(period: string | undefined, provider: string | null = null) {
  const { state, shared } = useDemo();
  const stored = shared.data?.reporting.impactReports;
  const { referrals } = state;

  return useMemo(() => {
    const source = { referrals };
    const months = stored?.months ?? reportMonths(source);
    const month = selectedReportMonth(period, months, stored?.defaultMonth ?? defaultReportMonth(source));
    const sharedPeriod = stored?.periods[reportKey(month)];
    const completeReport = sharedPeriod?.all ?? impactReport(source, month, null);
    const report = provider
      ? sharedPeriod?.byProvider[provider] ?? impactReport(source, month, provider)
      : completeReport;
    return { months, month, completeReport, report };
  }, [period, provider, referrals, stored]);
}
