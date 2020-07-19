#!/usr/bin/env node

const request = require('superagent');
const bluebird = require('bluebird');
const jsonToMarkdown = require('json-to-markdown');
const _ = require('lodash');

const token = process.env.GITHUB_TOKEN;

const retrievePage = (pageNr) => request('https://api.github.com/search/repositories')
  .query({
    q: 'programming language',
    sort: 'stars',
    page: pageNr,
  })
  .set('Authorization', `token ${token}`)
  .set('user-agent', 'bot')
  .then(
    ({ body }) => body
      .items
      .map((item) => _.pick(
        item,
        'html_url',
        'stargazers_count',
        'full_name',
        'description',
      )),
  );

const retrievePageWithError = async (pageNr) => {
  try {
    const data = retrievePage(pageNr);
    return data;
  } catch (error) {
    console.error(error);
    await bluebird.delay(20000);
    return retrievePageWithError(pageNr);
  }
};

const findRepos = async () => {
  const results = [];
  for (let pageNr = 1; pageNr <= 20; pageNr += 1) {
    console.log(`processing page #${pageNr}`);
    const pageData = await retrievePageWithError(pageNr);
    if (!pageData.length) {
      break;
    }
    results.push(...pageData);
  }
  console.log(jsonToMarkdown(
    results.map((item, i) => ({
      '#': i + 1,
      name: `[${item.full_name}](${item.html_url})`,
      stars: item.stargazers_count,
      description: item.description,
    })),
    ['#', 'name', 'stars', 'description'],
  ));
};

findRepos();
