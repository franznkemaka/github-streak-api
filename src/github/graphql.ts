import axios from 'axios';

const url = 'https://api.github.com/graphql';

const getGitHubTokens = () => {
  return process.env.GITHUB_TOKENS?.split?.(',') ?? [];
};

const getGitHubToken = () => {
  const tokens = getGitHubTokens();
  if (tokens.length == 0) return undefined;
  if (tokens.length == 1) return tokens[0];
  return tokens[Math.floor(Math.random() * (tokens.length - 1))];
};

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
    const contributionYears =
      res.data?.data?.user?.contributionsCollection?.contributionYears || undefined;
    return contributionYears;
  } catch (e) {
    return undefined;
  }
};

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
    return res.data?.data?.user?.contributionsCollection?.contributionCalendar;
  } catch (e) {
    return undefined;
  }
};

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

export const parseContributions = (graphs: ContributionGraph[]) => {
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
 * @returns
 */
export const getStreakStats = (contributions?: Contributions) => {
  if (!contributions) {
    return undefined;
  }

  const contributionsArr = Object.keys(contributions);
  const todayKey = contributionsArr.at(-1) ?? '';
  const firstKey = contributionsArr[0] ?? '';

  const stats = {
    totalContributions: 0,
    firstContribution: '',
    longestStreak: {
      start: firstKey,
      end: firstKey,
      length: 0,
    },
    currentStreak: {
      start: firstKey,
      end: firstKey,
      length: 0,
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
      stats.currentStreak.length += 1;
      stats.currentStreak.end = contributionDate;

      // set start on first day of streak
      if (stats.currentStreak.length == 1) {
        stats.currentStreak.start = contributionDate;
      }

      // first date is the first contribution
      if (stats.firstContribution.length <= 0) {
        stats.firstContribution = contributionDate;
      }

      // update longest streak
      if (stats.currentStreak.length > stats.longestStreak.length) {
        // copy current streak start, end, and length into longest streak
        stats.longestStreak.start = stats.currentStreak.start;
        stats.longestStreak.end = stats.currentStreak.end;
        stats.longestStreak.length = stats.currentStreak.length;
      }
    }

    // reset streak with exception for today
    else if (contributionDate != todayKey) {
      // reset streak
      stats.currentStreak.length = 0;
      stats.currentStreak.start = todayKey;
      stats.currentStreak.end = todayKey;
    }
  }
  return stats;
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
