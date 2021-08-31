import {Template} from '../src/template'

test('title', () => {
  const date = new Date()
  const template = new Template(date, [])
  expect(template.title()).toEqual(`Release ${date}`)
})

test('body', () => {
  const date = new Date()
  const pullRequests = [
    {number: 123, author: 'yutailang0119'},
    {number: 456, author: 'y7g'},
    {number: 123, author: 'yutailang0119'}
  ]
  const template = new Template(date, pullRequests)
  expect(template.body()).toEqual(`- #123 @yutailang0119\n- #456 @y7g\n`)
})
