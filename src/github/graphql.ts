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
