import {validate} from '@octokit/graphql-schema'
import * as query from '../src/query'

test('validate detectExistingPullRequest', () => {
  validate(query.detectExistingPullRequest)
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
