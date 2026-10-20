import type { TableRow } from '@nuxt/ui'

export const clickableTableRowsBodyClass = '[&>tr]:cursor-pointer [&>tr]:transition-colors [&>tr:hover]:bg-elevated/50'

export function createTableRowSelectHandler<T>(onSelect: (row: T, tableRow: TableRow<T>) => void) {
  return (_event: Event, row: TableRow<T>) => onSelect(row.original, row)
}

export function activateClickableTableRowOnKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return

  const target = event.target
  if (!(target instanceof HTMLElement) || target.tagName !== 'TR' || target.getAttribute('role') !== 'button') return

  event.preventDefault()
  target.click()
}