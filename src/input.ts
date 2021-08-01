import * as core from '@actions/core'
import * as github from '@actions/github'

export type Inputs = {
  token: string
  owner: string
  name: string
  productionBranch: string
  stagingBranch: string
  isDryRun: boolean
}

export function getInputs(): Inputs {
  const repository = core.getInput('repository') ?? github.context.repo.repo
  const splited = repository.split('/')
  const owner = splited[0]
  const name = splited[1]

  const token = core.getInput('token', {required: true})
  const productionBranch = core.getInput('production_branch')
  const stagingBranch = core.getInput('staging_branch')
  const isDryRun = core.getBooleanInput('dry_run')

  return {token, owner, name, productionBranch, stagingBranch, isDryRun}
}
