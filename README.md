# 👨‍💻 GitHub Streak API

A simple and fast api that provides GitHub Streak Stats: **total contributions, current streak and longest streak.**

## ✨ Production-ready api

- Ready to use
- HTTPS
- Supports CORS
- Fast due to extensive caching

```json

https://api.rigle.co/github-streak/stats/[GITHUB_USERNAME_HERE]

Example:

https://api.rigle.co/github-streak/stats/franznkemaka

Returns:

{
    "totalContributions": xxxxx,
    "firstContribution": "xxxx-xx-xx",
    "longestStreak": {
        "start": "xxxx-xx-xx",
        "end": "xxxx-xx-xx",
        "days": xxxx
    },
    "currentStreak": {
        "start": "xxxx-xx-xx",
        "end": "xxxx-xx-xx",
        "days": xxxx
    }
}

```

## 🙋‍♂️ How it works?

Using GitHub GraphQL, we collect all contribution years of the provided user. GitHub Calendar is limited to a single year only. In order to obtain a full contribution calendar ever, we grab all calendars one-by-one in parallel.

For better performance, the collected information are cached.

The longest streak is the highest consecutive days

The current streak is the total days before a 0 contribution-day

## 📤 Deploying it on your own

Foremost you need to generate a Personal Access Token (PAT) on GitHub.

Visit [this link](https://github.com/settings/tokens/new?description=GitHub%20Streak%20Stats%20API) to create a new Personal Access Token (no scopes required

> **ℹ NOTE** This project is inspired by [github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats) from [@DenverCoder1](https://github.com/DenverCoder1). Thank your for your work!

## ⚖️ Terms & Conditions

When using the production api (api.rigle.co/github-streak/stats) hereby production-api, please avoid sending too many requests to maintain higher availability.
The production-api might collect and store your IP for security reasons.
It is favorable to host your own instance when possible, to avoid GitHub GraphQL downtimes.

## ❤️ Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## ⚖️ License

This project is licensed under the [MIT license](LICENSE)

© 2021 Franz Nkemaka
