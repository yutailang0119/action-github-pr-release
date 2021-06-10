import * as core from '@actions/core'
import {GitHub} from './github'
import {Template} from './template'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', {required: true})
    const owner = core.getInput('owner', {required: true})
    const name = core.getInput('name', {required: true})
    const productionBranch = core.getInput('production_branch')
    const stagingBranch = core.getInput('staging_branch')
    const isDryRun = core.getBooleanInput('dry_run')

    const github = new GitHub(token, owner, name)

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
    const title = template.title()
    const body = template.checkList()

    if (isDryRun) {
      core.info('Dry-run. Not mutating PR')
      core.info(title)
      core.info(body)
    } else {
      const existingPullRequest = await github.detectExistingPullRequest(
        productionBranch,
        stagingBranch
      )
      if (existingPullRequest.pullRequest === null) {
        await github.createPullRequest(
          existingPullRequest.repositoryId,
          productionBranch,
          stagingBranch,
          title,
          body
        )
      } else {
        await github.updatePullRequest(
          existingPullRequest.pullRequest.id,
          title,
          body
        )
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
