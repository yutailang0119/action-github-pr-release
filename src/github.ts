import * as github from '@actions/github'
import {
  Repository,
  Commit,
  CreatePullRequestInput,
  UpdatePullRequestInput
} from '@octokit/graphql-schema'
import * as query from './query'

type ExistingPullRequest = {id: string}

export type PullRequestItem = {
  number: number
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

    const {repository} = await octokit.graphql<{repository: Repository}>({
      query: query.detectExistingPullRequest,
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
  ): Promise<void> {
    const octokit = github.getOctokit(this.token)

    const input: CreatePullRequestInput = {
      repositoryId,
      baseRefName,
      headRefName,
      title,
      body
    }
    await octokit.graphql({
      query: query.createPullRequest,
      input
    })

    return new Promise(resolve => {
      resolve()
    })
  }

  async updatePullRequest(
    pullRequestId: string,
    title: string,
    body: string
  ): Promise<void> {
    const octokit = github.getOctokit(this.token)

    const input: UpdatePullRequestInput = {
      pullRequestId,
      title,
      body
    }
    await octokit.graphql({
      query: query.updatePullRequest,
      input
    })

    return new Promise(resolve => {
      resolve()
    })
  }

  async associatedPullRequest(
    expression: string
  ): Promise<PullRequestItem | undefined> {
    const octokit = github.getOctokit(this.token)

    const {repository} = await octokit.graphql<{repository: Repository}>({
      query: query.associatedPullRequest,
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
      author: commit.associatedPullRequests.edges[0].node.author.login
    }
    return new Promise(resolve => {
      resolve(pr)
    })
  }

  async compareSHAs(
    baseRefName: string,
    headRefName: string,
    perPage?: number
  ): Promise<string[]> {
    const octokit = github.getOctokit(this.token)

    let page: number | undefined = undefined
    const shas: string[] = []
    while (!Number.isNaN(page)) {
      // https://docs.github.com/en/rest/reference/repos#compare-two-commits
      await octokit.rest.repos
        .compareCommits({
          owner: this.owner,
          repo: this.name,
          base: baseRefName,
          head: headRefName,
          per_page: perPage ?? 100,
          page
        })
        .then(response => {
          for (const commit of response.data.commits) {
            shas.push(commit.sha)
          }

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
        .catch(error => {
          throw error
        })
    }

    return new Promise(resolve => {
      resolve(shas)
    })
  }
}
