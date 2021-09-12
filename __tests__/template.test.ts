import {Template} from '../src/template'

test('title', () => {
  const template = new Template()
  expect(template.title).toEqual(`Release ${new Date().toLocaleDateString()}`)
})

test('body', () => {
  const date = new Date()
  const pullRequests = [
    {number: 123, author: 'yutailang0119'},
    {number: 789, author: 'yutailang0119'},
    {number: 456, author: 'y7g'},
    {number: 123, author: 'yutailang0119'}
  ]
  const template = new Template(pullRequests)
  expect(template.body).toEqual(
    `- #123 @yutailang0119\n- #456 @y7g\n- #789 @yutailang0119\n`
  )
})
