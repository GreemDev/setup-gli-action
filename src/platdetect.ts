import { arch, platform } from 'os'
import * as libc from 'detect-libc'

export const PLATFORM_FILE_EXTENSION: string = (() => {
  switch (platform()) {
    case 'win32':
      return '.exe'
    default:
      return ''
  }
})()

/**
 * A properly formed string for concatenation for finding an asset to download.
 *
 * Undefined on platforms GLI does not support installation on.
 */
export const PLATFORM_OS_IDENTIFIER: string | undefined = (() => {
  switch (platform()) {
    case 'darwin':
      return 'osx'
    case 'win32':
      return 'win'
    case 'linux': {
      return libc.isNonGlibcLinuxSync() ? 'linux-musl' : 'linux'
    }
    default:
      return undefined
  }
})()

/**
 * A properly formed string for concatenation for finding an asset to download.
 *
 * Undefined on architectures GLI does not support installation on.
 */
export const PLATFORM_ARCH_IDENTIFIER: string | undefined = (() => {
  const a = arch()
  switch (a) {
    case 'arm':
    case 'arm64':
    case 'x64':
      return a
    case 'ia32':
      return 'x86'
    default:
      return undefined
  }
})()

export const REQUIRED_GLI_BINARY_NAME: string = (() => {
  return `gli-${PLATFORM_OS_IDENTIFIER}-${PLATFORM_ARCH_IDENTIFIER}${PLATFORM_FILE_EXTENSION}`
})()
