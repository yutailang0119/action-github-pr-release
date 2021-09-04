import {PullRequestItem} from '../src/github'

export class Template {
  constructor(
    private date: Date,
    private pullRequests: PullRequestItem[],
    public labelIds?: string[]
  ) {
    this.date = date
    this.pullRequests = Array.from(
      new Map(pullRequests.map(pr => [pr.number, pr])).values()
    )
    this.labelIds = labelIds
  }

  title = (): string => {
    return `Release ${this.date}`
  }

  body = (): string => {
    return this.pullRequests.reduce(
      (p: string, pr: PullRequestItem): string => {
        return `${p}- #${pr.number} @${pr.author}\n`
      },
      ''
    )
  }
}
