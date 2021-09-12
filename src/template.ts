import {PullRequestItem} from '../src/github'

export class Template {
  title: string
  body: string
  labelIds?: string[]

  constructor(pullRequests: PullRequestItem[] = [], labelIds?: string[]) {
    const date = new Date()
    this.title = `Release ${date.toLocaleDateString()}`
    this.body = Array.from(
      new Map(pullRequests.map(pr => [pr.number, pr])).values()
    )
      .sort((lhs, rhs) => {
        if (lhs.number === rhs.number) return 0
        return lhs.number > rhs.number ? 1 : -1
      })
      .reduce((previous: string, pr: PullRequestItem): string => {
        return `${previous}- #${pr.number} @${pr.author}\n`
      }, '')
    this.labelIds = labelIds
  }
}
