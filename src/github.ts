import * as github from '@actions/github'
import {
  Repository,
  Commit,
  CreatePullRequestInput,
  CreatePullRequestPayload,
  UpdatePullRequestInput,
  UpdatePullRequestPayload
} from '@octokit/graphql-schema'
import * as query from './query'
import {Template} from './template'

export type PullRequestItem = {
  number: number
  author: string
}

export class GitHub {
  constructor(
    private token: string,
    private owner: string,
    private name: string
  ) {}

  async repository(
    baseRefName: string,
    headRefName: string,
    label?: string
  ): Promise<{id: string; labelId?: string; pullRequest?: {id: string}}> {
    const octokit = github.getOctokit(this.token)

    const {repository} = await octokit.graphql<{repository: Repository}>({
      query: query.repository,
      owner: this.owner,
      name: this.name,
      baseRefName,
      headRefName,
      label
    })
    const pullRequest = (): {id: string} | undefined => {
      if (repository.pullRequests.edges === undefined) return undefined
      if (repository.pullRequests.edges === null) return undefined
      if (repository.pullRequests.edges.length === 0) return undefined
      if (repository.pullRequests.edges[0]?.node?.id === undefined)
        return undefined
      if (repository.pullRequests.edges[0]?.node.id === null) return undefined
      return {id: repository.pullRequests.edges[0].node.id}
    }
    const labelId = (): string | undefined => {
      if (repository.label === undefined) return undefined
      if (repository.label === null) return undefined
      return repository.label.id
    }

    return new Promise(resolve => {
      resolve({
        id: repository.id,
        labelId: labelId(),
        pullRequest: pullRequest()
      })
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

    if (commit.associatedPullRequests.edges[0].node.state !== 'MERGED')
      return undefined

    const pr: PullRequestItem = {
      number: commit.associatedPullRequests.edges[0].node.number,
      author: commit.associatedPullRequests.edges[0].node.author.login
    }
    return new Promise(resolve => {
      resolve(pr)
    })
  }

  async createPullRequest(
    repositoryId: string,
    baseRefName: string,
    headRefName: string,
    template: Template,
    draft: boolean
  ): Promise<string> {
    const octokit = github.getOctokit(this.token)

    const input: CreatePullRequestInput = {
      repositoryId,
      baseRefName,
      headRefName,
      title: template.title,
      body: template.body,
      draft
    }
    const {createPullRequest} = await octokit.graphql<{
      createPullRequest: CreatePullRequestPayload
    }>({
      query: query.createPullRequest,
      input
    })

    if (createPullRequest === undefined)
      throw Error(`Cannot read property 'createPullRequest' of undefined`)
    if (createPullRequest.pullRequest === undefined)
      throw Error(
        `Cannot read property 'createPullRequest.pullRequest' of undefined`
      )
    if (createPullRequest.pullRequest === null)
      throw Error(
        `Cannot read property 'createPullRequest.pullRequest' of null`
      )
    const id = createPullRequest.pullRequest.id

    return new Promise(resolve => {
      resolve(id)
    })
  }

  async updatePullRequest(
    pullRequestId: string,
    template: Template
  ): Promise<string> {
    const octokit = github.getOctokit(this.token)

    const input: UpdatePullRequestInput = {
      pullRequestId,
      title: template.title,
      body: template.body,
      labelIds: template.labelIds
    }
    const {updatePullRequest} = await octokit.graphql<{
      updatePullRequest: UpdatePullRequestPayload
    }>({
      query: query.updatePullRequest,
      input
    })

    if (updatePullRequest === undefined)
      throw Error(`Cannot read property 'updatePullRequest' of undefined`)
    if (updatePullRequest.pullRequest === undefined)
      throw Error(
        `Cannot read property 'updatePullRequest.pullRequest' of undefined`
      )
    if (updatePullRequest.pullRequest === null)
      throw Error(
        `Cannot read property 'updatePullRequest.pullRequest' of null`
      )
    const id = updatePullRequest.pullRequest.id

    return new Promise(resolve => {
      resolve(id)
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
      let response
      try {
        // https://docs.github.com/en/rest/reference/repos#compare-two-commits
        response = await octokit.rest.repos.compareCommits({
          owner: this.owner,
          repo: this.name,
          base: baseRefName,
          head: headRefName,
          per_page: perPage ?? 100,
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
