<a href="https://github.com/yutailang0119/action-github-pr-release/actions"><img alt="action-github-pr-release status" src="https://github.com/yutailang0119/action-github-pr-release/actions/workflows/test.yml/badge.svg"></a>

# GitHub Action to create a "release pull request"

This action creates a "release pull request" that contains features list or pull requests.

This action is inspired by [x-motemen/git-pr-release](https://github.com/x-motemen/git-pr-release).

## Features

This action's features is based on [x-motemen/git-pr-release](https://github.com/x-motemen/git-pr-release).

- [x] Select branchs
    - Production branch
    - Staging branch
- [ ] Tempalate for title and body
    - [ ] Difference update
- [ ] Labels
    - [x] Support single label
    - [ ] Support Multiple labels
- [ ] Replace mention
- [x] As draft
- [ ] Support command options
    - [ ] `squash`: Squash and merge
    - [ ] `no-fetch`: Do not fetch from remote repo before determining target PRs

## Usage

An example workflow(.github/workflows/github-pr-release.yml) to executing action follows:

```yml
name: github-pr-release

on:
  push:
    branches:
    - develop

jobs:
  github-pr-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: yutailang0119/action-github-pr-release@v1
        with:
          token: ${{ github.token }}
          production_branch: main
          staging_branch: develop
          label: Release
```

## Author

[Yutaro Muta](https://github.com/yutailang0119)

## References

- Generated from [actions/typescript-action](https://github.com/actions/typescript-action) as template.

## License

action-github-pr-release is available under the MIT license. See [the LICENSE file](./LICENSE) for more info.
