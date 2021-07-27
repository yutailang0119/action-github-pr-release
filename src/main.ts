import * as core from '@actions/core'
import {getInputs} from './input'
import {GitHub} from './github'
import {Template} from './template'

async function run(): Promise<void> {
  try {
    const inputs = getInputs()
    const productionBranch = inputs.productionBranch
    const stagingBranch = inputs.stagingBranch

    const gh = new GitHub(inputs.token, inputs.owner, inputs.name)

    const compareSHAs = await gh.compareSHAs(productionBranch, stagingBranch)
    const pullRequests = await Promise.all(
      compareSHAs.map(async sha => {
        return gh.associatedPullRequest(sha)
      })
    )

    const template = new Template(
      new Date(),
      pullRequests.flatMap(pr => pr ?? [])
    )
    const title = template.title()
    const body = template.checkList()

    if (inputs.isDryRun) {
      core.info('Dry-run. Not mutating PR')
      core.info(title)
      core.info(body)
    } else {
      const existingPullRequest = await gh.detectExistingPullRequest(
        productionBranch,
        stagingBranch
      )
      if (existingPullRequest.pullRequest === null) {
        await gh.createPullRequest(
          existingPullRequest.repositoryId,
          productionBranch,
          stagingBranch,
          title,
          body
        )
      } else {
        await gh.updatePullRequest(
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
