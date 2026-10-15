import type { RunStatus } from '~/lib/db/schema/enums'

export type RunStatusColor = 'success' | 'error' | 'warning' | 'neutral'

export function getRunStatusPresentation(status: RunStatus | null | undefined): {
  color: RunStatusColor
  label: string
} {
  switch (status) {
    case 'udført':
      return { color: 'success', label: 'Udført' }
    case 'fejl':
      return { color: 'error', label: 'Fejl' }
    case 'indlæser':
      return { color: 'warning', label: 'Indlæser' }
    case 'afventer':
      return { color: 'warning', label: 'Afventer' }
    default:
      return { color: 'neutral', label: '—' }
  }
}