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

    if (inputs.label !== undefined && repository.labelId === undefined) {
      core.setFailed(`Not found ${inputs.label}`)
      return
    }

    const template = new Template(
      pullRequests.flatMap(pr => pr ?? []),
      repository.labelId !== undefined ? [repository.labelId] : undefined
    )

    if (inputs.isDryRun) {
      core.info('Dry-run. Not mutating Pull Request.')
      core.info(`title: ${template.title}`)
      core.info(`body: ${template.body}`)
      if (inputs.label !== undefined)
        core.info(`labels: ${inputs.label}: ${template.labelIds}`)
    } else {
      let pullRequestId: string
      if (repository.pullRequest === undefined) {
        pullRequestId = await gh.createPullRequest(
          repository.id,
          productionBranch,
          stagingBranch,
          template,
          inputs.isDraft
        )
      } else {
        pullRequestId = repository.pullRequest.id
      }
      await gh.updatePullRequest(pullRequestId, template)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
