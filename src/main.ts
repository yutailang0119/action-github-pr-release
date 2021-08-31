import * as core from '@actions/core'
import {getInputs} from './input'
import {GitHub} from './github'
import {Template} from './template'

async function run(): Promise<void> {
  try {
    const inputs = getInputs()
    const productionBranch = inputs.productionBranch
    const stagingBranch = inputs.stagingBranch

    const gh = new GitHub(inputs.token, inputs.owner, inputs.repo)

    const compareSHAs = await gh.compareSHAs(productionBranch, stagingBranch)
    if (compareSHAs.length === 0) {
      core.info("There isn't anything to compare.")
      return
    }

    const pullRequests = await Promise.all(
      compareSHAs.map(async sha => {
        return gh.associatedPullRequest(sha)
      })
    )
    if (pullRequests.length === 0) {
      core.info("There isn't associated Pull Requests.")
      return
    }

    const repository = await gh.repository(
      productionBranch,
      stagingBranch,
      inputs.label
    )

    const template = new Template(
      new Date(),
      pullRequests.flatMap(pr => pr ?? [])
    )

    if (inputs.isDryRun) {
      core.info('Dry-run. Not mutating Pull Request.')
      core.info(template.title())
      core.info(template.checkList())
    } else {
      if (repository.pullRequest === undefined) {
        await gh.createPullRequest(
          repository.id,
          productionBranch,
          stagingBranch,
          template
        )
      } else {
        await gh.updatePullRequest(repository.pullRequest.id, template)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
