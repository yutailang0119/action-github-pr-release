import * as core from '@actions/core'
import {GitHub} from './github'
import {Template} from './template'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const owner = core.getInput('owner')
    const repo = core.getInput('repo')
    const productionBranch = core.getInput('production_branch')
    const stagingBranch = core.getInput('staging_branch')

    const github = new GitHub(token, owner, repo)

    const compareSHAs = await github.compareSHAs(
      productionBranch,
      stagingBranch
    )
    const pullRequests = await Promise.all(
      compareSHAs.map(async sha => {
        return github.associatedPullRequest(sha)
      })
    )

    const template = new Template(
      new Date(),
      pullRequests.flatMap(pr => pr ?? [])
    )

    const existingPullRequest = await github.detectExistingPullRequest(
      productionBranch,
      stagingBranch
    )

    if (existingPullRequest.pullRequest === null) {
      await github.createPullRequest(
        existingPullRequest.repositoryId,
        productionBranch,
        stagingBranch,
        template.title(),
        template.checkList()
      )
    } else {
      await github.updatePullRequest(
        existingPullRequest.pullRequest.id,
        template.title(),
        template.checkList()
      )
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
