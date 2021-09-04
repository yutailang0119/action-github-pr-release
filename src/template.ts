import {PullRequestItem} from '../src/github'

export class Template {
  title: string
  body: string
  labelIds?: string[]

  constructor(
    title?: string,
    pullRequests: PullRequestItem[] = [],
    labelIds?: string[]
  ) {
    if (title !== undefined) {
      this.title = title
    } else {
      const date = new Date()
      this.title = `Release ${date.toLocaleDateString()}`
    }
    this.body = Array.from(
      new Map(pullRequests.map(pr => [pr.number, pr])).values()
    ).reduce((p: string, pr: PullRequestItem): string => {
      return `${p}- #${pr.number} @${pr.author}\n`
    }, '')
    this.labelIds = labelIds
  }
}
