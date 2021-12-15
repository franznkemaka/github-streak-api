import { ContributionGraph, fetchContributionGraphs } from './graphql';

/**
 * Parse all user active contributions to a large
 * single calendar(array) with contribution count
 */
export const parseContributionGraphs = (graphs: ContributionGraph[]) => {
  const contributions: Contributions = {};
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = now.toISOString().split('T')[0];

  for (const graph of graphs) {
    for (const week of graph.weeks) {
      for (const contributionDay of week.contributionDays) {
        const date = contributionDay.date;
        const count = contributionDay.contributionCount;

        // count contributions up until today
        // also count next day if user contributed already
        if (date <= today || (date == tomorrow && count > 0)) {
          // add contributions to the array
          contributions[date] = count;
        }
      }
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
const extractStreakStats = (contributions?: Contributions) => {
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
  const contributionYears = [2020, 2021];
  const contributionGraphs = await fetchContributionGraphs(username, contributionYears);
  const contributions = parseContributionGraphs(contributionGraphs);
  const stats = extractStreakStats(contributions);
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
