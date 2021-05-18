import * as github from '@actions/github'
import {Repo} from './Repo'

async function compareSHAs(token: string, repo: Repo): Promise<string[]> {
  const octokit = github.getOctokit(token)

  // https://docs.github.com/en/rest/reference/repos#compare-two-commits
  const shas = await octokit
    .paginate(octokit.rest.repos.compareCommits, {
      owner: repo.owner,
      repo: repo.name,
      base: repo.productionBranch,
      head: repo.stagingBranch,
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
