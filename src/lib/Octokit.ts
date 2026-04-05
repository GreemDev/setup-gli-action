// modified https://github.com/actions/toolkit/blob/main/packages/github/src/internal/utils.ts + https://github.com/actions/toolkit/blob/main/packages/github/src/utils.ts
// the modification is to not throw if no auth is provided in getAuthString

// octokit + plugins
import { Octokit } from '@octokit/core'
import {
  restEndpointMethods,
  RestEndpointMethodTypes
} from '@octokit/plugin-rest-endpoint-methods'
import * as Types from '@octokit/openapi-types'
import { paginateRest } from '@octokit/plugin-paginate-rest'

import * as http from 'http'
import * as httpClient from '@actions/http-client'
import type { OctokitOptions, OctokitPlugin } from '@octokit/core/types'
import { ProxyAgent, fetch } from 'undici'

export type GitHubRelease =
  RestEndpointMethodTypes['repos']['getLatestRelease']['response']

export type GitHubReleaseAsset = // what the fuck
  Types.paths['/repos/{owner}/{repo}/releases/assets/{asset_id}']['get']['responses']['200']['content']['application/json']

/**
 * Returns a hydrated octokit ready to use for GitHub Actions
 *
 * @param     token    the repo PAT or GITHUB_TOKEN
 * @param     options  other options to set
 */
export function getOctokit(
  token: string,
  options?: OctokitOptions,
  ...additionalPlugins: OctokitPlugin[]
): InstanceType<typeof GitHub> {
  const GitHubWithPlugins = GitHub.plugin(...additionalPlugins)
  return new GitHubWithPlugins(getOctokitOptions(token, options))
}

const baseUrl = getApiBaseUrl()
export const defaults: OctokitOptions = {
  baseUrl,
  request: {
    agent: getProxyAgent(baseUrl),
    fetch: getProxyFetch(baseUrl)
  }
}

export const GitHub = Octokit.plugin(
  restEndpointMethods,
  paginateRest
).defaults(defaults)

/**
 * Convenience function to correctly format Octokit Options to pass into the constructor.
 *
 * @param     token    the repo PAT or GITHUB_TOKEN
 * @param     options  other options to set
 */
export function getOctokitOptions(
  token: string,
  options?: OctokitOptions
): OctokitOptions {
  const opts = Object.assign({}, options || {}) // Shallow clone - don't mutate the object provided by the caller

  // Auth
  const auth = getAuthString(token, opts)
  if (auth) {
    opts.auth = auth
  }

  return opts
}

function getAuthString(
  token: string,
  options: OctokitOptions
): string | undefined {
  if (!token && !options.auth) {
    return undefined
  } else if (token && options.auth) {
    throw new Error('Parameters token and opts.auth may not both be specified')
  }

  return typeof options.auth === 'string' ? options.auth : `token ${token}`
}

function getProxyAgent(destinationUrl: string): http.Agent {
  const hc = new httpClient.HttpClient()
  return hc.getAgent(destinationUrl)
}

function getProxyAgentDispatcher(
  destinationUrl: string
): ProxyAgent | undefined {
  const hc = new httpClient.HttpClient()
  return hc.getAgentDispatcher(destinationUrl)
}

function getProxyFetch(destinationUrl: string): typeof fetch {
  const httpDispatcher = getProxyAgentDispatcher(destinationUrl)
  const proxyFetch: typeof fetch = async (url, opts) => {
    return fetch(url, {
      ...opts,
      dispatcher: httpDispatcher
    })
  }
  return proxyFetch
}

function getApiBaseUrl(): string {
  return process.env['GITHUB_API_URL'] || 'https://api.github.com'
}
