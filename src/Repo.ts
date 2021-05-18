export class Repo {
  owner: string
  name: string
  productionBranch: string
  stagingBranch: string

  constructor(
    owner: string,
    name: string,
    productionBranch: string,
    stagingBranch: string
  ) {
    this.owner = owner
    this.name = name
    this.productionBranch = productionBranch
    this.stagingBranch = stagingBranch
  }
}
