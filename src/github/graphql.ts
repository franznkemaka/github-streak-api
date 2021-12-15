import axios from 'axios';

const url = 'https://api.github.com/graphql';

/**
 * Parse all env GitHub tokens for later requests
 */
export const getGitHubTokens = () => {
  return process.env.GITHUB_TOKENS?.split?.(',') ?? [];
};

/**
 * Get a random github token for graphql requests.
 * Due to GitHub rate limit, the more the tokens the better
 */
export const getGitHubToken = (): string | undefined => {
  const tokens = getGitHubTokens();
  if (tokens.length == 0) return undefined;
  if (tokens.length == 1) return tokens[0];
  return tokens[Math.floor(Math.random() * (tokens.length - 1))];
};

/**
 * Send request to GitHub GraphQL with custom query
 */
export const fetchGraphQL = async (query: string) => {
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

export type ContributionGraph = {
  totalContributions: number;
  weeks: {
    contributionDays: {
      contributionCount: number;
      date: string;
    }[];
  }[];
};
