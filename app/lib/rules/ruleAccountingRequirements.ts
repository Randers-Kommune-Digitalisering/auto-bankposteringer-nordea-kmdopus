import type { RuleStatus, RuleType } from '../db/schema/enums'

export function ruleRequiresAccounting(type: RuleType, status: RuleStatus): boolean {
  return type !== 'undtagelse' && status === 'aktiv'
}
