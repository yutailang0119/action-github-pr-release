import {PullRequestItem} from '../src/github'

export function checkList(pullRequests: PullRequestItem[]): string {
  return pullRequests.reduce((v: string, pr: PullRequestItem): string => {
    return `${v}- #${pr.number} ${pr.title} @${pr.author}\n`
  }, '')
}
