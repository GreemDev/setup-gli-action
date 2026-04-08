import * as core from '@actions/core'
import * as fs from 'node:fs'
import { isWindows } from './lib/PlatformDetect.js'
import { download } from './lib/Download.js'
import * as ActionSteps from './ActionSteps.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const release = await ActionSteps.getRelease()
    core.info(`Retrieved version ${release.data.tag_name}`)

    const foundAsset = ActionSteps.findAsset(release)

    const { parent, tool } = await ActionSteps.setupPaths()

    const gliStream = fs.createWriteStream(tool, {
      flags: 'wx',
      autoClose: true
    })

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

    core.addPath(parent)

    core.setOutput('tool_path', tool)

    if (!isWindows) {
      fs.chmodSync(tool, 0o775)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
