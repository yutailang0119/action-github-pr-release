import {PullRequestItem} from '../src/github'

export class Template {
  private date: Date
  private pullRequests: PullRequestItem[]

  constructor(date: Date, pullRequests: PullRequestItem[]) {
    this.date = date
    this.pullRequests = Array.from(
      new Map(pullRequests.map(pr => [pr.number, pr])).values()
    )
  }

  title(): string {
    return `Release ${this.date}`
  }

  body(): string {
    return this.pullRequests.reduce(
      (p: string, pr: PullRequestItem): string => {
        return `${p}- #${pr.number} @${pr.author}\n`
      },
      ''
    )
  }
}
