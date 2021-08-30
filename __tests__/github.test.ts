import * as process from 'process'
import {GitHub} from '../src/github'

test('repository', async () => {
  const repository = process.env.TEST_REPOSITORY ?? '/'
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = process.env.TEST_TOKEN ?? ''
  const productionBranch = process.env.TEST_PRODUCTION_BRANCH ?? ''
  const stagingBranch = process.env.TEST_STAGING_BRANCH ?? ''
  const repositoryId = process.env.TEST_REPOSITORY_ID
  const pullRequestId = process.env.TEST_EXISTING_PULL_REQUEST_ID

  const gh = new GitHub(token, owner, name)

  const result = await gh.repository(productionBranch, stagingBranch)
  expect(result.id).toEqual(repositoryId)
  expect(result.pullRequest).not.toBeUndefined()
  expect(result.pullRequest!.id).toEqual(pullRequestId)
})

test('Not Found repository.pullRequest', async () => {
  const repository = process.env.TEST_REPOSITORY ?? '/'
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = process.env.TEST_TOKEN ?? ''
  const productionBranch = process.env.TEST_PRODUCTION_BRANCH ?? ''
  const emptyBranch = process.env.TEST_EMPTY_BRANCH ?? ''
  const repositoryId = process.env.TEST_REPOSITORY_ID

  const gh = new GitHub(token, owner, name)

  const result = await gh.repository(productionBranch, emptyBranch)
  expect(result.id).toEqual(repositoryId)
  expect(result.pullRequest).toBeUndefined()
})

test('associatedPullRequest', async () => {
  const repository = process.env.TEST_REPOSITORY ?? '/'
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = process.env.TEST_TOKEN ?? ''
  const commitSHA = process.env.TEST_ASSOCIATED_COMMIT_SHA ?? ''
  const pullRequestNumber = process.env.TEST_ASSOCIATED_PULL_REQUEST_NUMBER

  const gh = new GitHub(token, owner, name)

  const result = await gh.associatedPullRequest(commitSHA)
  expect(result).not.toBeUndefined()
  expect(result!.number).toEqual(Number(pullRequestNumber))
})

test('Not Found associatedPullRequest', async () => {
  const repository = process.env.TEST_REPOSITORY ?? '/'
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = process.env.TEST_TOKEN ?? ''
  const commitSHA = process.env.TEST_NOT_ASSOCIATED_COMMIT_SHA ?? ''
  const pullRequestNumber = process.env.TEST_ASSOCIATED_PULL_REQUEST_NUMBER

  const gh = new GitHub(token, owner, name)

  const result = await gh.associatedPullRequest(commitSHA)
  expect(result).toBeUndefined()
})

test('compareSHAs', async () => {
  const repository = process.env.TEST_REPOSITORY ?? '/'
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = process.env.TEST_TOKEN ?? ''
  const productionBranch = process.env.TEST_PRODUCTION_BRANCH ?? ''
  const stagingBranch = process.env.TEST_STAGING_BRANCH ?? ''

  const gh = new GitHub(token, owner, name)

  const result = await gh.compareSHAs(productionBranch, stagingBranch, 3)
  expect(result).not.toEqual([])
})
