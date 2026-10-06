export const RELEASE_MODEL: 'continuous-web'
export function isFullSha(commit: string | null | undefined): boolean
export function buildVersion(version: string | undefined, commit: string | undefined): string
export function resolveCommitFromEnv(env?: NodeJS.ProcessEnv): { commit: string; source: string }
