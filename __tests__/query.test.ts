import {validate} from '@octokit/graphql-schema'
import {test} from '@jest/globals'
import * as query from '../src/query'

test('validate repository', () => {
  validate(query.repository)
})

test('validate associatedPullRequest', () => {
  validate(query.associatedPullRequest)
})

test('validate createPullRequest', () => {
  validate(query.createPullRequest)
})

test('validate updatePullRequest', () => {
  validate(query.updatePullRequest)
})
