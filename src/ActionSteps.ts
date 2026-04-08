import { getOctokit, GitHubRelease, GitHubReleaseAsset } from './lib/Octokit.js'
import { info, debug } from '@actions/core'
import * as fs from 'node:fs'
import * as io from '@actions/io'
import { join } from 'node:path'
import { Inputs } from './lib/ActionInputs.js'
import * as process from 'node:process'
import {
  isWindows,
  PLATFORM_FILE_EXTENSION,
  REQUIRED_GLI_BINARY_NAME
} from './lib/PlatformDetect.js'

export async function getRelease(): Promise<GitHubRelease> {
  const octokit = getOctokit(Inputs.token)

  const desiredVersion = Inputs.version

  info(`Requesting version ${desiredVersion}`)

  const release =
    desiredVersion === undefined || desiredVersion === 'latest'
      ? await octokit.rest.repos.getLatestRelease({
          owner: 'GreemDev',
          repo: 'GLI'
        })
      : await octokit.rest.repos.getReleaseByTag({
          owner: 'GreemDev',
          repo: 'GLI',
          tag: Inputs.version
        })

  if (!release || !release.data) {
    throw new Error(
      `Could not find a version of GLI matching '${Inputs.version}'.`
    )
  }

  return release
}

export function findAsset(release: GitHubRelease): GitHubReleaseAsset {
  const foundAsset = release.data.assets.find(
    (asset) => asset.name === REQUIRED_GLI_BINARY_NAME
  )

  if (foundAsset === undefined) {
    throw new Error(
      `Could not find a GLI binary matching ${REQUIRED_GLI_BINARY_NAME} on ${release.data.html_url}`
    )
  } else {
    // Log required binary for debugging sessions
    debug(`Found asset: ${foundAsset.name}`)
  }

  return foundAsset
}

export async function setupPaths(): Promise<{ parent: string; tool: string }> {
  const home = isWindows
    ? join(process.env['SystemDrive']!, process.env['HOMEPATH']!)
    : process.env['HOME']!

  const parentDir = home === '/root' ? '/usr/bin' : join(home, '.bin')

  await io.mkdirP(parentDir)

  const outPath = join(parentDir, `gli${PLATFORM_FILE_EXTENSION}`)

  if (fs.existsSync(outPath)) {
    debug(`Found GLI installation; overwriting`)
    fs.rmSync(outPath)
  }

  return { parent: parentDir, tool: outPath }
}
