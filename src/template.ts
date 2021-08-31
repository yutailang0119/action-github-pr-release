import {PullRequestItem} from '../src/github'

export class Template {
  private date: Date
  private pullRequests: PullRequestItem[]
  labelIds?: string[]

  constructor(
    date: Date,
    pullRequests: PullRequestItem[],
    labelIds?: string[]
  ) {
    this.date = date
    this.pullRequests = Array.from(
      new Map(pullRequests.map(pr => [pr.number, pr])).values()
    )
    this.labelIds = labelIds
  }

  title(): string {
    return `Release ${this.date}`
  }

  checkList(): string {
    return this.pullRequests.reduce(
      (p: string, pr: PullRequestItem): string => {
        return `${p}- #${pr.number} @${pr.author}\n`
      },
      ''
    )
  }
}
