import * as process from 'process'
import {GitHub} from '../src/github'

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
