// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import type { TableRow } from '@nuxt/ui'
import {
  activateClickableTableRowOnKeydown,
  createTableRowSelectHandler,
} from '../../app/composables/useClickableTableRows'

type Account = { id: string }

function createRowElement() {
  const row = document.createElement('tr')
  row.setAttribute('role', 'button')
  row.tabIndex = 0
  return row
}

describe('clickable table row interactions', () => {
  it('forwards the original row from Nuxt UI select', () => {
    const account = { id: 'account-1' }
    const onSelect = vi.fn()
    const handler = createTableRowSelectHandler(onSelect)

    handler(new Event('click'), { original: account } as TableRow<Account>)

    expect(onSelect).toHaveBeenCalledWith(account)
  })

  it.each(['Enter', ' '])('activates a focused row with key %j', (key) => {
    const row = createRowElement()
    const click = vi.fn()
    row.addEventListener('click', click)
    row.addEventListener('keydown', activateClickableTableRowOnKeydown)

    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    row.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(click).toHaveBeenCalledOnce()
  })

  it('does not activate the row for keyboard events from child controls', () => {
    const row = createRowElement()
    const button = document.createElement('button')
    const rowClick = vi.fn()
    button.addEventListener('click', vi.fn())
    row.addEventListener('click', rowClick)
    row.addEventListener('keydown', activateClickableTableRowOnKeydown)
    row.append(button)

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    button.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(rowClick).not.toHaveBeenCalled()
  })

  it('ignores other keys and non-row targets', () => {
    const row = createRowElement()
    const click = vi.fn()
    row.addEventListener('click', click)
    row.addEventListener('keydown', activateClickableTableRowOnKeydown)

    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    const child = document.createElement('span')
    row.append(child)
    child.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

    expect(click).not.toHaveBeenCalled()
  })
})