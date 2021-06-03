import {PullRequestItem} from '../src/github'
import {checkList} from '../src/template'

test('checkList', () => {
  const pullRequests: PullRequestItem[] = [
    {number: 123, title: 'AAA', author: 'yutailang0119'},
    {number: 456, title: 'BBB', author: 'y7g'}
  ]
  const result = checkList(pullRequests)
  expect(result).toEqual(`- #123 AAA @yutailang0119\n- #456 BBB @y7g\n`)
})
