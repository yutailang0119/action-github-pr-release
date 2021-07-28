import * as process from 'process'
import {GitHub} from '../src/github'

test('detectExistingPullRequest', async () => {
  const repository = process.env.TEST_REPOSITORY
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = process.env.TEST_TOKEN
  const productionBranch = process.env.TEST_PRODUCTION_BRANCH
  const stagingBranch = process.env.TEST_STAGING_BRANCH
  const repositoryId = process.env.TEST_REPOSITORY_ID
  const pullRequestId = process.env.TEST_PULL_REQUEST_ID

  const gh = new GitHub(token, owner, name)

  const result = await gh.detectExistingPullRequest(
    productionBranch,
    stagingBranch
  )
  expect(result.repositoryId).toEqual(repositoryId)
  expect(result.pullRequest).not.toBeNull()
  expect(result.pullRequest!.id).toEqual(pullRequestId)
})

test('associatedPullRequest', async () => {
  const repository = process.env.TEST_REPOSITORY
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = process.env.TEST_TOKEN
  const commitSHA = process.env.TEST_COMMIT_SHA
  const pullRequestNumber = process.env.TEST_PULL_REQUEST_NUMBER

  const gh = new GitHub(token, owner, name)

  const result = await gh.associatedPullRequest(commitSHA)
  expect(result!.number).toEqual(Number(pullRequestNumber))
})

test('compareSHAs', async () => {
  const repository = process.env.TEST_REPOSITORY
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = process.env.TEST_TOKEN
  const productionBranch = process.env.TEST_PRODUCTION_BRANCH
  const stagingBranch = process.env.TEST_STAGING_BRANCH

  const gh = new GitHub(token, owner, name)

  const result = await gh.compareSHAs(productionBranch, stagingBranch)
  expect(result).not.toEqual([])
})
