import * as github from '@actions/github'
import {
  Repository,
  Commit,
  CreatePullRequestInput,
  CreatePullRequestPayload,
  UpdatePullRequestInput,
  UpdatePullRequestPayload
} from '@octokit/graphql-schema'

type ExistingPullRequest = {id: string}

export type PullRequestItem = {
  number: number
  title: string
  author: string
}

export class GitHub {
  private token: string
  private owner: string
  private name: string

  constructor(token: string, owner: string, name: string) {
    this.token = token
    this.owner = owner
    this.name = name
  }

  async detectExistingPullRequest(
    baseRefName: string,
    headRefName: string
  ): Promise<{repositoryId: string; pullRequest?: ExistingPullRequest}> {
    const octokit = github.getOctokit(this.token)

    const query = `
    query detectExistingReleasePullRequest($owner: String!, $name: String!, $baseRefName: String!, $headRefName: String!) {
      repository(owner: $owner, name: $name) {
        ... on Repository {
          id
          pullRequests(baseRefName: $baseRefName, headRefName: $headRefName, states: OPEN, first: 1, orderBy: {field: UPDATED_AT, direction: ASC}) {
            edges {
              node {
                ... on PullRequest {
                  id
                }
              }
            }
          }
        }
      }
    }
    `
    const {repository} = await octokit.graphql<{repository: Repository}>({
      query,
      owner: this.owner,
      name: this.name,
      baseRefName,
      headRefName
    })
    const pullRequest = (): ExistingPullRequest | undefined => {
      if (repository.pullRequests.edges === undefined) return undefined
      if (repository.pullRequests.edges === null) return undefined
      if (repository.pullRequests.edges.length === 0) return undefined
      if (repository.pullRequests.edges[0]?.node?.id === undefined)
        return undefined
      if (repository.pullRequests.edges[0]?.node.id === null) return undefined
      return {id: repository.pullRequests.edges[0].node.id}
    }

    return new Promise(resolve => {
      resolve({
        repositoryId: repository.id,
        pullRequest: pullRequest()
      })
    })
  }

  async createPullRequest(
    repositoryId: string,
    baseRefName: string,
    headRefName: string,
    title: string,
    body: string
  ): Promise<number> {
    const octokit = github.getOctokit(this.token)

    const query = `
    mutation createPullRequest($input: CreatePullRequestInput!) {
      createPullRequest(input: $input) {
        pullRequest {
          ... on PullRequest {
            number
          }
        }
      }
    }
    `
    const input: CreatePullRequestInput = {
      repositoryId,
      baseRefName,
      headRefName,
      title,
      body
    }
    const {payload} = await octokit.graphql<{
      payload: CreatePullRequestPayload
    }>({
      query,
      input
    })

    if (payload.pullRequest === undefined)
      throw Error(`Cannot read property 'pullRequest' of undefined`)
    if (payload.pullRequest === null)
      throw Error(`Cannot read property 'pullRequest' of null`)
    const pullRequestNumber = payload.pullRequest.number

    return new Promise(resolve => {
      resolve(pullRequestNumber)
    })
  }

  async updatePullRequest(
    pullRequestId: string,
    title: string,
    body: string
  ): Promise<number> {
    const octokit = github.getOctokit(this.token)

    const query = `
    mutation updatePullRequest($input: UpdatePullRequestInput!) {
      updatePullRequest(input: $input) {
        pullRequest {
          ... on PullRequest {
            number
          }
        }
      }
    }
    `
    const input: UpdatePullRequestInput = {
      pullRequestId,
      title,
      body
    }
    const {payload} = await octokit.graphql<{
      payload: UpdatePullRequestPayload
    }>({
      query,
      input
    })

    if (payload.pullRequest === undefined)
      throw Error(`Cannot read property 'pullRequest' of undefined`)
    if (payload.pullRequest === null)
      throw Error(`Cannot read property 'pullRequest' of null`)
    const pullRequestNumber = payload.pullRequest.number

    return new Promise(resolve => {
      resolve(pullRequestNumber)
    })
  }

  async associatedPullRequest(
    expression: string
  ): Promise<PullRequestItem | undefined> {
    const octokit = github.getOctokit(this.token)

    const query = `
    query associatedPullRequest($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
          ... on Commit {
            associatedPullRequests(first: 1, orderBy: {field: UPDATED_AT, direction: ASC}) {
              edges {
                node {
                  ... on PullRequest {
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
    }    
    `

    const {repository} = await octokit.graphql<{repository: Repository}>({
      query,
      owner: this.owner,
      name: this.name,
      expression
    })
    const commit = repository.object as Commit

    if (commit.associatedPullRequests?.edges === undefined) return undefined
    if (commit.associatedPullRequests.edges === null) return undefined
    if (commit.associatedPullRequests.edges.length === 0) return undefined
    if (commit.associatedPullRequests.edges[0]?.node?.author === undefined)
      return undefined
    if (commit.associatedPullRequests.edges[0].node.author === null)
      return undefined

    const pr: PullRequestItem = {
      number: commit.associatedPullRequests.edges[0].node.number,
      title: commit.associatedPullRequests.edges[0].node.title,
      author: commit.associatedPullRequests.edges[0].node.author.login
    }
    return new Promise(resolve => {
      resolve(pr)
    })
  }

  async compareSHAs(
    baseRefName: string,
    headRefName: string
  ): Promise<string[]> {
    const octokit = github.getOctokit(this.token)

    let page: number | undefined = undefined
    const shas: string[] = []
    while (!Number.isNaN(page)) {
      let response
      try {
        // https://docs.github.com/en/rest/reference/repos#compare-two-commits
        response = await octokit.rest.repos.compareCommits({
          owner: this.owner,
          repo: this.name,
          base: baseRefName,
          head: headRefName,
          per_page: 100,
          page
        })
      } catch (error) {
        throw error
      }

      for (const commit of response.data.commits) {
        shas.push(commit.sha)
      }

      // https://github.com/octokit/plugin-paginate-rest.js/blob/597472cb40bc312ae3b1f37892332875e1233b5b/src/iterator.ts#L33-L38
      const next: string | undefined = ((response.headers.link || '').match(
        /<([^>]+)>;\s*rel="next"/
      ) || [])[1]
      if (next === undefined) {
        page = NaN
        continue
      }
      const p = new URL(next).searchParams.get('page')
      if (p === null) {
        page = NaN
        continue
      }
      page = Number(p)
    }

    return new Promise(resolve => {
      resolve(shas)
    })
  }
}
