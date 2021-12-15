import { ContributionGraph, fetchContributionGraph, fetchContributionYears } from './graphql';
import flatCache from 'flat-cache';
import path from 'path/posix';

/**
 * Fetch user contribution calendars for provided years
 */
export const fetchContributions = async (
  username: string,
  contributionYears: number[],
  cache: any,
) => {
  let allContributions: Contributions | undefined = undefined;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentYear = now.getFullYear();
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = now.toISOString().split('T')[0];

  const manyContributions: Contributions[] = [];
  const yearsToFetch: number[] = [];

  // -- grab year's contributions from cache
  for (const contributionYear of contributionYears) {
    const cacheKey = `contributions_${contributionYear}`;
    const isCacheable = contributionYear != currentYear;
    const cachedContributions = cache.getKey(cacheKey);

    if (!isCacheable || !cachedContributions) {
      yearsToFetch.push(contributionYear);
      continue;
    }

    console.log(`Using ${cacheKey} for ${username}`);
    manyContributions.push(cachedContributions);
  }

  // -- fetch remaining year's contributions in concurrently
  const fetchContributionGraphRequests = yearsToFetch
    .slice()
    .map((year) => fetchContributionGraph(username, year));
  const fetchContributionGraphRes = await Promise.all(fetchContributionGraphRequests);
  let i = 0;
  for (const graph of fetchContributionGraphRes) {
    if (!graph) {
      continue;
    }

    const contributionYear = yearsToFetch[i];
    const isCacheable = contributionYear != currentYear;
    const contributions = parseContributionGraph(graph);

    if (isCacheable && contributions) {
      const cacheKey = `contributions_${contributionYear}`;
      console.log(`Setting ${cacheKey} for ${username}`);
      cache.setKey(cacheKey, contributions);
    }

    contributions && manyContributions.push(contributions);

    // TODO: cache values daily if already contributed for current day
    i++;
  }

  // flatten all contributions to a single object
  for (const contributions of manyContributions) {
    for (const contributionDate in contributions) {
      if (!allContributions) {
        allContributions = {};
      }

      const count = contributions[contributionDate];
      // count contributions up until today
      // also count next day if user contributed already
      if (contributionDate <= today || (contributionDate == tomorrow && count > 0)) {
        // add contributions to the array
        allContributions[contributionDate] = count;
      }
    }
  }

  return allContributions;
};

/**
 * Transform GitHub contribution graph to contributions object
 */
const parseContributionGraph = (graph?: ContributionGraph) => {
  if (!graph) return undefined;

  let contributions: Contributions | undefined = undefined;
  for (const week of graph.weeks) {
    for (const contributionDay of week.contributionDays) {
      const date = contributionDay.date;
      const count = contributionDay.contributionCount;
      if (!contributions) {
        contributions = {};
      }
      contributions[date] = count;
    }
  }
  return contributions;
};

/**
 * Extract streak stats based on contribution count and dates
 *
 * @param contributions
 * @returns stats
 */
export const extractStreakStats = (contributions?: Contributions) => {
  if (!contributions) {
    return undefined;
  }

  const contributionsArr = Object.keys(contributions);
  const todayKey = contributionsArr.at(-1) ?? '';
  const firstKey = contributionsArr[0] ?? '';

  const stats: StreakStats = {
    totalContributions: 0,
    firstContribution: '',
    longestStreak: {
      start: firstKey,
      end: firstKey,
      days: 0,
    },
    currentStreak: {
      start: firstKey,
      end: firstKey,
      days: 0,
    },
  };

  // calculate stats based on contributions
  for (const contributionDate in contributions) {
    const contributionCount = contributions[contributionDate];
    // add contribution count to total
    stats.totalContributions += contributionCount;

    // check if still in streak
    if (contributionCount > 0) {
      // increment streak
      stats.currentStreak.days += 1;
      stats.currentStreak.end = contributionDate;

      // set start on first day of streak
      if (stats.currentStreak.days == 1) {
        stats.currentStreak.start = contributionDate;
      }

      // first date is the first contribution
      if (stats.firstContribution.length <= 0) {
        stats.firstContribution = contributionDate;
      }

      // update longest streak
      if (stats.currentStreak.days > stats.longestStreak.days) {
        // copy current streak start, end, and length into longest streak
        stats.longestStreak.start = stats.currentStreak.start;
        stats.longestStreak.end = stats.currentStreak.end;
        stats.longestStreak.days = stats.currentStreak.days;
      }
    }

    // reset streak with exception for today
    else if (contributionDate != todayKey) {
      // reset streak
      stats.currentStreak.days = 0;
      stats.currentStreak.start = todayKey;
      stats.currentStreak.end = todayKey;
    }
  }
  return stats;
};

/**
 * Fetch and parse github user contribution to obtain streak stats
 *
 * @param username
 * @returns stats
 */
export const getStreakStats = async (username: string) => {
  const cacheDir = path.join(process.cwd(), '.cache/users');
  const cache = flatCache.load(username, cacheDir);

  // -- fetch contribution once per year
  let contributionYears: number[] = [];
  const cachedContributionYears = cache.getKey('contributionYears') ?? [];
  const currentYear = new Date().getFullYear();
  if (!cachedContributionYears || !cachedContributionYears.includes(currentYear)) {
    contributionYears = (await fetchContributionYears(username)) ?? [];
    cache.setKey('contributionYears', contributionYears);
  } else {
    contributionYears = cachedContributionYears;
  }
  contributionYears.sort((a, b) => a - b);

  const contributions = await fetchContributions(username, contributionYears, cache);
  const stats = extractStreakStats(contributions);

  // Persist cache
  cache.save();

  return stats;
};

export type StreakStats = {
  totalContributions: number;
  firstContribution: string;
  longestStreak: {
    start: string;
    end: string;
    days: number;
  };
  currentStreak: {
    start: string;
    end: string;
    days: number;
  };
};

export type Contributions = {
  [key: string]: number;
};
