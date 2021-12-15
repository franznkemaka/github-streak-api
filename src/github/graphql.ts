import axios from 'axios';

const url = 'https://api.github.com/graphql';

/**
 * Parse all env GitHub tokens for later requests
 */
const getGitHubTokens = () => {
  return process.env.GITHUB_TOKENS?.split?.(',') ?? [];
};

/**
 * Get a random github token for graphql requests.
 * Due to GitHub rate limit, the more the tokens the better
 */
const getGitHubToken = (): string | undefined => {
  const tokens = getGitHubTokens();
  if (tokens.length == 0) return undefined;
  if (tokens.length == 1) return tokens[0];
  return tokens[Math.floor(Math.random() * (tokens.length - 1))];
};

/**
 * Send request to GitHub GraphQL with custom query
 */
const fetchGraphQL = async (query: string) => {
  const githubToken = getGitHubToken();
  return await axios.post(
    url,
    { query },
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v4.idl',
        'User-Agent': 'GitHub-Streak-Api',
      },
    },
  );
};

/**
 * Fetch all contribution years of a GitHub user since creation
 */
export const fetchContributionYears = async (username: string): Promise<number[] | undefined> => {
  const query = `query {
    user(login: "${username}") {
      contributionsCollection {
          contributionYears
      }
    }
  }
  `;

  try {
    const res = await fetchGraphQL(query);
    // TODO: handle user not found
    const contributionYears =
      res.data?.data?.user?.contributionsCollection?.contributionYears || undefined;
    return contributionYears;
  } catch (e) {
    console.error('fetchContributionYears', e);
    return undefined;
  }
};

/**
 * Fetch user contribution calendar of a particular year
 */
export const fetchContributionGraph = async (
  username: string,
  year: number,
): Promise<ContributionGraph | undefined> => {
  const startDate = `${year}-01-01T00:00:00Z`;
  const endDate = `${year}-12-31T23:59:59Z`;
  const query = `query {
    user(login: "${username}") {
      contributionsCollection(from: "${startDate}", to: "${endDate}") {
          contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
          }
      }
    }
  }
  `;

  try {
    const res = await fetchGraphQL(query);
    // TODO: handle user not found
    return res.data?.data?.user?.contributionsCollection?.contributionCalendar;
  } catch (e) {
    console.error('fetchContributionGraph', e);
    return undefined;
  }
};

/**
 * Fetch user contribution calendars for provided years
 */
export const fetchContributionGraphs = async (username: string, contributionYears: number[]) => {
  const graphs: ContributionGraph[] = [];

  for (const contributionYear of contributionYears) {
    const graph = await fetchContributionGraph(username, contributionYear);
    if (graph) {
      graphs.push(graph);
    }
  }

  return graphs;
};

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

type StreakStats = {
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

type Contributions = {
  [key: string]: number;
};

type ContributionGraph = {
  totalContributions: number;
  weeks: {
    contributionDays: {
      contributionCount: number;
      date: string;
    }[];
  }[];
};
