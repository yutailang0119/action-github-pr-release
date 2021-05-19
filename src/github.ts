import * as github from '@actions/github'
import {Repository, Commit, PullRequest, Maybe} from '@octokit/graphql-schema'

export class GitHub {
  token: string
  owner: string
  repo: string
  productionBranch: string
  stagingBranch: string

  constructor(
    token: string,
    owner: string,
    repo: string,
    productionBranch: string,
    stagingBranch: string
  ) {
    this.token = token
    this.owner = owner
    this.repo = repo
    this.productionBranch = productionBranch
    this.stagingBranch = stagingBranch
  }

  async associatedPullRequest(expression: string): Promise<Maybe<PullRequest>> {
    const octokit = github.getOctokit(this.token)

    const query = `
    query associatedPullRequest($owner: String!, $repo: String!, $expression: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          ... on Commit {
            associatedPullRequests(first: 1, orderBy: {field: UPDATED_AT, direction: ASC}) {
              edges {
                node {
                  title
                  number
                  author {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
    `
    const {repository} = await octokit.graphql<{repository: Repository}>(
      query,
      {
        owner: this.owner,
        repo: this.repo,
        expression: expression
      }
    )
    const commit = repository.object as Commit
    if (commit.associatedPullRequests?.edges === null) return null
    if (commit.associatedPullRequests?.edges === undefined) return null
    if (commit.associatedPullRequests?.edges[0]?.node === undefined) return null
    const pullRequest = commit.associatedPullRequests?.edges[0]?.node
    return new Promise(resolve => {
      resolve(pullRequest)
    })
  }

  async compareSHAs(): Promise<string[]> {
    const octokit = github.getOctokit(this.token)

    // https://docs.github.com/en/rest/reference/repos#compare-two-commits
    const shas = await octokit
      .paginate(octokit.rest.repos.compareCommits, {
        owner: this.owner,
        repo: this.repo,
        base: this.productionBranch,
        head: this.stagingBranch,
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
}
