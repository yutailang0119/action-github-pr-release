import * as github from '@actions/github'
import {Repository} from './Repository'

async function compareSHAs(
  token: string,
  repository: Repository
): Promise<string[]> {
  const octokit = github.getOctokit(token)

  // https://docs.github.com/en/rest/reference/repos#compare-two-commits
  const shas = await octokit
    .paginate(octokit.rest.repos.compareCommits, {
      owner: repository.owner,
      repo: repository.name,
      base: repository.productionBranch,
      head: repository.stagingBranch,
      per_page: 100
    })
    .then(result => {
      return result.commits.map(commit => {
        return commit.sha
      })
    })

  return new Promise(resolve => {
    resolve(shas)
  })
}
