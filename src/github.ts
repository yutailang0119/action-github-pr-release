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
    let page: number | undefined = undefined
    let shas: string[] = []
    while (!Number.isNaN(page)) {
      await octokit.rest.repos
        .compareCommits({
          owner: this.owner,
          repo: this.repo,
          base: this.productionBranch,
          head: this.stagingBranch,
          per_page: 5,
          page: page
        })
        .then(response => {
          response.data.commits.forEach(commit => {
            shas.push(commit.sha)
          })

          // https://github.com/octokit/plugin-paginate-rest.js/blob/597472cb40bc312ae3b1f37892332875e1233b5b/src/iterator.ts#L33-L38
          const next: string | undefined = ((response.headers.link || '').match(
            /<([^>]+)>;\s*rel="next"/
          ) || [])[1]
          if (next === undefined) {
            page = NaN
            return
          }
          const p = new URL(next).searchParams.get('page')
          if (p === null) {
            page = NaN
            return
          }
          page = Number(p)
        })
    }
    return new Promise(resolve => {
      resolve(shas)
    })
  }
}
