export const detectExistingPullRequest = `
query ($owner: String!, $name: String!, $baseRefName: String!, $headRefName: String!) {
  repository(owner: $owner, name: $name) {
    ... on Repository {
      id
      pullRequests(baseRefName: $baseRefName, headRefName: $headRefName, states: OPEN, first: 1, orderBy: {field: UPDATED_AT, direction: ASC}) {
        edges {
          node {
            ... on PullRequest {
              id
            }
          }
        }
      }
    }
  }
}
`

export const associatedPullRequest = `
query ($owner: String!, $name: String!, $expression: String!) {
  repository(owner: $owner, name: $name) {
    object(expression: $expression) {
      ... on Commit {
        associatedPullRequests(first: 1, orderBy: {field: UPDATED_AT, direction: ASC}) {
          edges {
            node {
              ... on PullRequest {
                number
                author {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
}      
`

export const createPullRequest = `
mutation ($input: CreatePullRequestInput!) {
  createPullRequest(input: $input) {
    clientMutationId
  }
}
`

export const updatePullRequest = `
mutation ($input: UpdatePullRequestInput!) {
  updatePullRequest(input: $input) {
    clientMutationId
  }
}
`
