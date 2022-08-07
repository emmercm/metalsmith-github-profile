'use strict';

const http = require('http');
const https = require('https');

const async = require('async');
const deepmerge = require('deepmerge');

const retryJsonGet = (link, options, callback, attempt = 1) => {
  const url = new URL(link);
  const library = {
    'http:': http,
    'https:': https,
  }[url.protocol];

  const requestOptions = {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'metalsmith-github-profile',
    },
    timeout: options.timeout,
  };

  let authorized = false;
  if (options.authorization && Object.keys(options.authorization)) {
    const token = `${options.authorization.username}:${options.authorization.token}`;
    requestOptions.headers.Authorization = `Basic ${Buffer.from(token).toString('base64')}`;
    authorized = true;
  }

  const req = library.request(link, requestOptions, (res) => {
    const rateLimitLimit = parseInt(res.headers['x-ratelimit-limit'], 10);
    const rateLimitRemaining = parseInt(res.headers['x-ratelimit-remaining'], 10);
    const rateLimitReset = parseInt(res.headers['x-ratelimit-reset'], 10);

    // Try to warn the user about silent authentication issues if authorization was intended
    if (authorized && rateLimitLimit < 1000) {
      console.log(`WARN: Authorization possibly failed, ${rateLimitRemaining}/${rateLimitLimit} rate limit calls remaining`);
    }

    if (res.statusCode < 200 || res.statusCode > 299) {
      if (options.retryableStatusCodes.includes(res.statusCode)) {
        if (attempt <= options.retries) {
          setTimeout(() => {
            retryJsonGet(link, options, callback, attempt + 1);
          }, (2 ** attempt) * 100);
        } else {
          callback(new Error('retry limit reached'), null);
        }
      } else {
        let message = `HTTP ${res.statusCode}: ${res.statusMessage}`;
        if (rateLimitRemaining <= 0) {
          message += `(rate limit reset at ${(new Date(rateLimitReset * 1000)).toLocaleString()})`;
        }
        callback(new Error(message), null);
      }
      return;
    }

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      callback(null, JSON.parse(data));
    });
  });

  req.on('error', (err) => {
    callback(err, null);
  });

  req.on('timeout', () => {
    req.destroy(); // cause an error
  });

  req.end();
};

const getUser = (username) => (options, callback) => {
  retryJsonGet(`https://api.github.com/users/${username}`, options, callback);
};

const getRepos = (username, page = 1, results = []) => (options, callback) => {
  retryJsonGet(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}`, options, (err, data) => {
    // Recurse to get all pages
    if (data && data.length) {
      results = [...results, ...data];
      getRepos(username, page + 1, results)(options, callback);
      return;
    }

    // Key the results by repo name
    results = results.reduce((obj, repo) => {
      delete repo.owner; // large, duplicate info
      obj[repo.name] = repo;
      return obj;
    }, {});

    callback(err, results);
  });
};

/**
 * Plugin entrypoint.
 * @param {Object} options
 * @returns {function(Object.<string, Object>, Object, function)}
 */
module.exports = (options) => {
  options = deepmerge({
    timeout: 5 * 1000,
    authorization: {},
    retries: 3,
    retryableStatusCodes: [0, 408, 500, 502, 503, 504],
  }, options || {});

  return (files, metalsmith, done) => {
    const methods = {
      user: getUser(options.username),
      repos: getRepos(options.username),
    };
    async.mapValues(methods, (value, key, callback) => {
      value(options, callback);
    }, (err, result) => {
      if (err) {
        done(err);
        return;
      }

      const metadata = metalsmith.metadata();
      if (!metadata.github) {
        metadata.github = {};
      }
      metadata.github.profile = result;

      done();
    });
  };
};
