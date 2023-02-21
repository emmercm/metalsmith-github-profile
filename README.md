# metalsmith-github-profile

**⚠️ This repistory has been moved to [metalsmith-plugins](https://github.com/emmercm/metalsmith-plugins/tree/main/packages/metalsmith-github-profile). ⚠️**

[![npm Version](https://badgen.net/npm/v/metalsmith-github-profile?icon=npm)](https://www.npmjs.com/package/metalsmith-github-profile)
[![npm Weekly Downloads](https://badgen.net/npm/dw/metalsmith-github-profile)](https://www.npmjs.com/package/metalsmith-github-profile)

[![Known Vulnerabilities](https://snyk.io/test/npm/metalsmith-github-profile/badge.svg)](https://snyk.io/test/npm/metalsmith-github-profile)
[![Test Coverage](https://badgen.net/codecov/c/github/emmercm/metalsmith-github-profile/main?icon=codecov)](https://codecov.io/gh/emmercm/metalsmith-github-profile)
[![Maintainability](https://badgen.net/codeclimate/maintainability/emmercm/metalsmith-github-profile?icon=codeclimate)](https://codeclimate.com/github/emmercm/metalsmith-github-profile/maintainability)

[![GitHub](https://badgen.net/badge/emmercm/metalsmith-github-profile/purple?icon=github)](https://github.com/emmercm/metalsmith-github-profile)
[![License](https://badgen.net/github/license/emmercm/metalsmith-github-profile?color=grey)](https://github.com/emmercm/metalsmith-github-profile/blob/main/LICENSE)

A Metalsmith plugin to fetch GitHub profile information as global metadata.

## Installation

```bash
npm install --save metalsmith-github-profile
```

## JavaScript Usage

```javascript
const Metalsmith    = require('metalsmith');
const githubProfile = require('metalsmith-github-profile');

Metalsmith(__dirname)
    .use(githubProfile({
        username: "<your-username-here>"
        // additional options
    }))
    .build((err) => {
        if (err) {
            throw err;
        }
    });
```

## Global metadata

This plugin adds a metadata field named `github.profile` to the global metadata which can be used with templating engines, such as with [`handlebars`](https://www.npmjs.com/package/handlebars):

```handlebars
GitHub username: {{ github.profile.user.login }}

The rest of the page content.
```

The following metadata is available from the GitHub public API:

- [`github.profile.user`](https://docs.github.com/en/rest/reference/users#get-a-user) (`Object`)
- [`github.profile.repos`](https://docs.github.com/en/rest/reference/repos#list-repositories-for-a-user) (`Object[]`)

## Options

### `username` (required)

Type: `string`

The GitHub username to fetch information for.

### `authorization` (optional)

Type: `{username: string, token: string}`

A GitHub username and OAuth token (including personal access tokens) to use for API requests to get around rate limits.

You can source the token from environment variables like this:

```javascript
githubProfile({
  username: "emmercm",
  authorization: {
    username: "emmercm",
    token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  }
})
```

### `timeout` (optional)

Type: `number` Default: `5000`

Timeout in milliseconds for API requests to GitHub.

### `retries` (optional)

Type: `number` Default: `3`

Number of times to retry GitHub API requests.

### `retryableStatusCodes` (optional)

Type: `number[]` Default: `[0, 408, 500, 502, 503, 504]`

A list of HTTP status codes to retry GitHub API requests on.

## Changelog

[Changelog](./CHANGELOG.md)
