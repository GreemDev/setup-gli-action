import * as core from '@actions/core'

export interface Inputs {
  readonly version: string
  readonly token: string | undefined
}

export class CoreInputs implements Inputs {
  get version(): string {
    return core.getInput('version')
  }

  get token(): string {
    return core.getInput('token')
  }
}
