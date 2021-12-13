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

export const getContributionYears = async (username: string): Promise<number[] | undefined> => {
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

export const getContributionGraphs = async (username: string) => {
  const year = new Date().getFullYear();
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
    return res.data;
  } catch (e) {
    return undefined;
  }
};
