import * as core from '@actions/core'
import * as io from '@actions/io'
import * as fs from 'node:fs'
import { join } from 'node:path'
import { getOctokit } from './octokit.js'
import { CoreInputs } from './inputs.js'
import {
  isWindows,
  PLATFORM_FILE_EXTENSION,
  REQUIRED_GLI_BINARY_NAME
} from './platdetect.js'

import * as process from 'node:process'
import { download } from './download.js'

const inputs = new CoreInputs()

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const octokit = getOctokit(inputs.token)

    const desiredVersion = inputs.version

    core.info(`Requesting version ${desiredVersion}`)

    const release =
      desiredVersion === undefined || desiredVersion === 'latest'
        ? await octokit.rest.repos.getLatestRelease({
            owner: 'GreemDev',
            repo: 'GLI'
          })
        : await octokit.rest.repos.getReleaseByTag({
            owner: 'GreemDev',
            repo: 'GLI',
            tag: inputs.version
          })

    if (!release || !release.data) {
      core.setFailed(
        `Could not find a version of GLI matching '${inputs.version}'.`
      )
      return
    }

    core.info(`Retrieved version ${release.data.tag_name}`)

    const foundAsset = release.data.assets.find(
      (asset) => asset.name === REQUIRED_GLI_BINARY_NAME
    )

    if (foundAsset === undefined) {
      core.setFailed(
        `Could not find a GLI binary matching ${REQUIRED_GLI_BINARY_NAME} on ${release.data.html_url}`
      )
      return
    } else {
      // Log required binary for debugging sessions
      core.debug(`Found asset: ${foundAsset.name}`)
    }

    core.info(`Found asset ${foundAsset.name}`)

    const home = isWindows
      ? join(process.env['SystemDrive']!, process.env['HOMEPATH']!)
      : process.env['HOME']!

    const parentDir = join(home, '.bin')

    io.mkdirP(parentDir)

    const outPath = join(parentDir, `gli${PLATFORM_FILE_EXTENSION}`)

    if (fs.existsSync(outPath)) {
      core.debug(`Found GLI installation; overwriting`)
      fs.rmSync(outPath)
    }

    const gliStream = fs.createWriteStream(
      join(parentDir, `gli${PLATFORM_FILE_EXTENSION}`),
      { flags: 'wx', autoClose: true }
    )

    await download(foundAsset.browser_download_url, gliStream).catch(
      (error) => {
        let err = 'An error occurred requesting to download GLI: '
        if (error instanceof AggregateError) {
          err += '\n'
          error.errors.forEach((e) => {
            err += `${e.message}\n`
          })
        } else if (error instanceof Error) {
          err += error.message
        }
        throw new Error(err)
      }
    )

    core.addPath(parentDir)

    core.setOutput('tool_path', gliStream.path)

    if (!isWindows) {
      fs.chmodSync(gliStream.path, 0o775)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
