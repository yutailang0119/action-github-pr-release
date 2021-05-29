import * as github from '@actions/github'
import {
  Repository,
  Commit,
  PullRequest,
  CreatePullRequestInput,
  Maybe
} from '@octokit/graphql-schema'

type ExistingPullRequest = Maybe<{number: number}>
type MutatePullRequestInput = {
  repositoryId: string
  baseRefName: string
  headRefName: string
  title: string
  body: Maybe<string>
}

export class GitHub {
  token: string
  owner: string
  repo: string

  constructor(token: string, owner: string, repo: string) {
    this.token = token
    this.owner = owner
    this.repo = repo
  }

  async detectExistingPullRequest(
    baseRefName: string,
    headRefName: string
  ): Promise<{repositoryId: string; pullRequest: ExistingPullRequest}> {
    const octokit = github.getOctokit(this.token)

    const query = `
    query detectExistingReleasePullRequest($owner: String!, $repo: String!, $baseRefName: String!, $headRefName: String!) {
      repository(owner: $owner, name: $repo) {
        id
        pullRequests(baseRefName: $baseRefName, headRefName: $headRefName, states: OPEN, first: 1, orderBy: {field: UPDATED_AT, direction: ASC}) {
          edges {
            node {
              number
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
        baseRefName: baseRefName,
        headRefName: headRefName
      }
    )
    const pullRequest = (): ExistingPullRequest => {
      if (repository.pullRequests.edges === undefined) return null
      if (repository.pullRequests.edges === null) return null
      if (repository.pullRequests.edges[0]?.node === undefined) return null
      if (repository.pullRequests.edges[0]?.node === null) return null
      if (repository.pullRequests.edges[0]?.node?.number === null) return null
      return {number: repository.pullRequests.edges[0]?.node?.number}
    }

    return new Promise(resolve => {
      resolve({
        repositoryId: repository.id,
        pullRequest: pullRequest()
      })
    })
  }

  async createPullRequest(
    input: MutatePullRequestInput
  ): Promise<Maybe<number>> {
    const octokit = github.getOctokit(this.token)

    const query = `
    mutation createPullRequest($input: CreatePullRequestInput!) {
      createPullRequest(input: $input) {
        pullRequest {
          number
        }
      }
    }
    `
    const _input: CreatePullRequestInput = {
      repositoryId: input.repositoryId,
      baseRefName: input.baseRefName,
      headRefName: input.repositoryId,
      title: input.title,
      body: input.body
    }
    const {repository} = await octokit.graphql<{repository: Repository}>(
      query,
      _input
    )

    const pullRequestNumber = (): Maybe<number> => {
      if (repository.pullRequests.edges === undefined) return null
      if (repository.pullRequests.edges === null) return null
      if (repository.pullRequests.edges[0]?.node === undefined) return null
      if (repository.pullRequests.edges[0]?.node === null) return null
      if (repository.pullRequests.edges[0]?.node?.number === null) return null
      return repository.pullRequests.edges[0]?.node?.number
    }
    return new Promise(resolve => {
      resolve(pullRequestNumber())
    })
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

    if (commit.associatedPullRequests?.edges === undefined) return null
    if (commit.associatedPullRequests?.edges === null) return null
    if (commit.associatedPullRequests?.edges[0]?.node === undefined) return null

    const pullRequest = commit.associatedPullRequests?.edges[0]?.node
    return new Promise(resolve => {
      resolve(pullRequest)
    })
  }

  async compareSHAs(
    baseRefName: string,
    headRefName: string
  ): Promise<string[]> {
    const octokit = github.getOctokit(this.token)

    let page: number | undefined = undefined
    let shas: string[] = []
    while (!Number.isNaN(page)) {
      // https://docs.github.com/en/rest/reference/repos#compare-two-commits
      await octokit.rest.repos
        .compareCommits({
          owner: this.owner,
          repo: this.repo,
          base: baseRefName,
          head: headRefName,
          per_page: 100,
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