import github from '../src/github';

describe('GitHub Unit Test', () => {
  it('can get env tokens', () => {
    const tokens = process.env.GITHUB_TOKENS;
    process.env.GITHUB_TOKENS = 't1,t2';
    expect(github.getGitHubTokens()).toStrictEqual(['t1', 't2']);
    process.env.GITHUB_TOKENS = 't1';
    expect(github.getGitHubTokens()).toStrictEqual(['t1']);
    process.env.GITHUB_TOKENS = tokens;
  });

  it('can get random env token', () => {
    const tokens = process.env.GITHUB_TOKENS;
    process.env.GITHUB_TOKENS = 't1';
    expect(github.getGitHubToken()).toStrictEqual('t1');
    process.env.GITHUB_TOKENS = 't1,t2';
    // @ts-ignore
    expect(['t1', 't2'].includes(github.getGitHubToken())).toBeTruthy();
    process.env.GITHUB_TOKENS = tokens;
  });

  it('can parse contribution graphs', () => {
    const contributions = {
      '2020-12-30': 1,
      '2020-12-31': 0,
      '2021-01-01': 1,
      '2021-01-02': 1,
      '2021-01-03': 1,
      '2021-01-04': 0,
      '2021-01-05': 1,
      '2021-01-06': 1,
    };

    const stats = github.extractStreakStats(contributions);
    expect(stats?.totalContributions).toBe(6);
    expect(stats?.firstContribution).toBe('2020-12-30');
    expect(stats?.longestStreak.start).toBe('2021-01-01');
    expect(stats?.longestStreak.end).toBe('2021-01-03');
    expect(stats?.longestStreak.days).toBe(3);
    expect(stats?.currentStreak.start).toBe('2021-01-05');
    expect(stats?.currentStreak.end).toBe('2021-01-06');
    expect(stats?.currentStreak.days).toBe(2);
  });
});
