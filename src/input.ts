import * as core from '@actions/core'
import * as github from '@actions/github'

export type Inputs = {
  token: string
  owner: string
  repo: string
  productionBranch: string
  stagingBranch: string
  isDryRun: boolean
  isDraft: boolean
}

export function getInputs(): Inputs {
  const {owner, repo} = repository()
  const token = core.getInput('token', {required: true})
  const productionBranch = core.getInput('production_branch')
  const stagingBranch = core.getInput('staging_branch')
  const isDryRun = core.getBooleanInput('dry_run')
  const isDraft = core.getBooleanInput('draft')

  return {
    token,
    owner,
    repo,
    productionBranch,
    stagingBranch,
    isDryRun,
    isDraft
  }
}

function repository(): {owner: string; repo: string} {
  if (core.getInput('repository')) {
    const [owner, repo] = core.getInput('repository').split('/')
    return {owner, repo}
  }
  return github.context.repo
}
