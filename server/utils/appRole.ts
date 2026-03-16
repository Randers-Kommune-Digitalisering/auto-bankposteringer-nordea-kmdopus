/**
 * Operational roles.
 *
 * The same container image runs in different roles via env configuration.
 * We keep this logic in one place so tasks/plugins can gate behavior consistently.
 */
export type AppRole = 'web' | 'scheduler' | 'worker'

export function getAppRole(buildEnv: NodeJS.ProcessEnv = process.env): AppRole {
  const raw = `${buildEnv.APP_ROLE ?? ''}`.trim()
  if (raw === 'scheduler' || raw === 'worker' || raw === 'web') return raw
  return 'web'
}

export function allowRoleGatedWork(
  requiredRole: Exclude<AppRole, 'web'>,
  buildEnv: NodeJS.ProcessEnv = process.env,
): boolean {
  // Preferred: explicit role.
  if (buildEnv.APP_ROLE) return getAppRole(buildEnv) === requiredRole

  // Backwards-compatible fallback for older deployments.
  return `${buildEnv.ENABLE_SCHEDULED_TASKS ?? ''}`.trim() === '1'
}
