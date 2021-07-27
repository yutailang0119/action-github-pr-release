import * as core from '@actions/core'
import * as github from '@actions/github'
import {GitHub} from './github'
import {Template} from './template'

async function run(): Promise<void> {
  try {
    const repository = core.getInput('repository') ?? github.context.repo.repo
    const splited = repository.split('/')
    const owner = splited[0]
    const name = splited[1]

    const token = core.getInput('token', {required: true})
    const productionBranch = core.getInput('production_branch')
    const stagingBranch = core.getInput('staging_branch')
    const isDryRun = core.getBooleanInput('dry_run')

    const gh = new GitHub(token, owner, name)

    const compareSHAs = await gh.compareSHAs(
      productionBranch,
      stagingBranch
    )
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

    if (isDryRun) {
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
