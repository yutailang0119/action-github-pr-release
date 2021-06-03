import {PullRequestItem} from '../src/github'

export class Template {
  pullRequests: PullRequestItem[]

  constructor(pullRequests: PullRequestItem[]) {
    this.pullRequests = pullRequests
  }

  checkList(): string {
    return this.pullRequests.reduce(
      (v: string, pr: PullRequestItem): string => {
        return `${v}- #${pr.number} ${pr.title} @${pr.author}\n`
      },
      ''
    )
  }
}
