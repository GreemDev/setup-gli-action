import * as core from '@actions/core'

export class Inputs {
  static get version(): string {
    return core.getInput('version')
  }

  static get token(): string {
    return core.getInput('token')
  }
}
