import type { AppRole } from '~/lib/authz/policy'

const ALL_APP_ROLES: readonly AppRole[] = ['bookkeeper', 'admin', 'rule_admin', 'dev']
const SETTINGS_ROLES: readonly AppRole[] = ['admin', 'rule_admin', 'dev']
const RULE_ROLES: readonly AppRole[] = ['rule_admin', 'dev']
const RUN_ROLES: readonly AppRole[] = ['admin', 'bookkeeper', 'dev']
const ERROR_HANDLING_ROLES: readonly AppRole[] = ['admin', 'dev']
const FALLBACK_ROLES: readonly AppRole[] = ['admin', 'dev']

function matchesRoute(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function getApiRequiredRoles(
  path: string,
  method: string,
): readonly AppRole[] | null {
  if (path === '/api/health' && (method === 'GET' || method === 'HEAD')) {
    return null
  }

  if (matchesRoute(path, '/api/_auth')) {
    return null
  }

  if (matchesRoute(path, '/api/fejlhaandtering')) {
    return ERROR_HANDLING_ROLES
  }

  if (
    matchesRoute(path, '/api/rule')
    || matchesRoute(path, '/api/rules')
    || matchesRoute(path, '/api/rule-tags')
    || matchesRoute(path, '/api/rule-versions')
  ) {
    return RULE_ROLES
  }

  if (matchesRoute(path, '/api/banking-agreements')) {
    return SETTINGS_ROLES
  }

  if (matchesRoute(path, '/api/runs')) {
    return RUN_ROLES
  }

  if (
    matchesRoute(path, '/api/dashboard')
    || matchesRoute(path, '/api/transactions')
    || matchesRoute(path, '/api/transaction-code-catalog')
    || matchesRoute(path, '/api/settings')
    || matchesRoute(path, '/api/bank-accounts')
    || matchesRoute(path, '/api/banking-accounts')
  ) {
    return ALL_APP_ROLES
  }

  return FALLBACK_ROLES
}