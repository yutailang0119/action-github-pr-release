import * as process from 'process'
import {GitHub} from '../src/github'

test('associatedPullRequest', async () => {
  const token = process.env.TEST_TOKEN ?? ''
  const owner = process.env.TEST_REPOSITORY_OWNER ?? ''
  const repo = process.env.TEST_REPOSITORY_NAME ?? ''
  const commitSHA = process.env.TEST_COMMIT_SHA ?? ''
  const pullRequestNumber = process.env.TEST_PULL_REQUEST_NUMBER ?? ''

  const github = new GitHub(token, owner, repo)

  const result = await github.associatedPullRequest(commitSHA)
  expect(result!.number).toEqual(Number(pullRequestNumber))
})

test('compareSHAs', async () => {
  const token = process.env.TEST_TOKEN ?? ''
  const owner = process.env.TEST_REPOSITORY_OWNER ?? ''
  const repo = process.env.TEST_REPOSITORY_NAME ?? ''
  const productionBranch = process.env.TEST_PRODUCTION_BRANCH ?? ''
  const stagingBranch = process.env.TEST_STAGING_BRANCH ?? ''

  const github = new GitHub(token, owner, repo)

  const result = await github.compareSHAs(productionBranch, stagingBranch)
  expect(result).not.toEqual([])
})
