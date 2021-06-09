import {Template} from '../src/template'

test('title', () => {
  const date = new Date()
  const template = new Template(date, [])
  expect(template.title()).toEqual(`Release ${date}`)
})

test('checkList', () => {
  const date = new Date()
  const pullRequests = [
    {number: 123, title: 'AAA', author: 'yutailang0119'},
    {number: 456, title: 'BBB', author: 'y7g'},
    {number: 123, title: 'AAA', author: 'yutailang0119'}
  ]
  const template = new Template(date, pullRequests)
  expect(template.checkList()).toEqual(
    `- #123 AAA @yutailang0119\n- #456 BBB @y7g\n`
  )
})
