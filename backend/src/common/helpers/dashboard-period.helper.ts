import * as moment from 'moment';

export interface ResolveDashboardPeriodInput {
  year?: number;
  month?: number;
  week?: number;
}

export interface ResolvedDashboardPeriod {
  start: Date;
  end: Date;
  label: string;
  previous: { start: Date; end: Date };
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function ordinalWeek(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export function resolveDashboardPeriod(
  input: ResolveDashboardPeriodInput,
): ResolvedDashboardPeriod {
  const now = moment();
  const year = input.year ?? now.year();

  let startM: moment.Moment;
  let endM: moment.Moment;
  let label: string;

  if (input.month == null && input.week == null) {
    startM = moment({ year }).startOf('year');
    endM = moment({ year }).endOf('year');
    label = `${year}`;
  } else if (input.week == null) {
    const month = (input.month ?? now.month() + 1) - 1;
    startM = moment({ year, month, day: 1 }).startOf('day');
    endM = moment({ year, month, day: 1 }).endOf('month');
    label = `${MONTH_NAMES[month]} ${year}`;
  } else {
    const month = (input.month ?? now.month() + 1) - 1;
    const week = input.week;
    const monthStart = moment({ year, month, day: 1 });
    startM = monthStart.clone().add((week - 1) * 7, 'days').startOf('day');
    endM = startM.clone().add(6, 'days').endOf('day');
    const monthEnd = moment({ year, month, day: 1 }).endOf('month');
    if (endM.isAfter(monthEnd)) endM = monthEnd;
    label = `${ordinalWeek(week)} Week ${MONTH_NAMES[month]} ${year}`;
  }

  const start = startM.toDate();
  const end = endM.toDate();
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return {
    start,
    end,
    label,
    previous: { start: prevStart, end: prevEnd },
  };
}

export function trendFromValues(
  current: number,
  previous: number,
): { trendPercentage: number; trendDirection: 'up' | 'down' | 'flat' } {
  if (previous === 0 && current === 0) {
    return { trendPercentage: 0, trendDirection: 'flat' };
  }
  if (previous === 0) {
    return { trendPercentage: 100, trendDirection: 'up' };
  }
  const raw = ((current - previous) / previous) * 100;
  const rounded = Math.round(raw);
  return {
    trendPercentage: Math.abs(rounded),
    trendDirection:
      rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat',
  };
}
