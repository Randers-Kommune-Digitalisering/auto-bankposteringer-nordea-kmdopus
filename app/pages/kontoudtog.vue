<script setup lang="ts">
import { h } from 'vue'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import type { StatementTransaction } from '~/types/transactions'
import useFlattenArray from '~/composables/useFlattenArray'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UPopover = resolveComponent('UPopover')

definePageMeta({
  path: '/kontoudtog'
})

const endDefault = today(getLocalTimeZone())
const startDefault = endDefault.subtract({ days: 29 })

const defaultRange = {
  start: startDefault,
  end: endDefault
}

const dateRange = ref<any>(defaultRange)

const start = computed(() => {
  const v = dateRange.value?.start ?? startDefault
  return v.toDate(getLocalTimeZone()).toISOString().slice(0, 10)
})

const end = computed(() => {
  const v = dateRange.value?.end ?? endDefault
  return v.toDate(getLocalTimeZone()).toISOString().slice(0, 10)
})

const { data, status, refresh } = await useFetch<StatementTransaction[]>('/api/transactions/statement', {
  key: computed(() => `statement:${start.value}:${end.value}`),
  query: computed(() => ({ start: start.value, end: end.value }))
})

const allRows = computed<StatementTransaction[]>(() => useFlattenArray<StatementTransaction>(data))

const rows = computed<StatementTransaction[]>(() => {
  return [...allRows.value].sort((a, b) => {
    return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
  })
})

function resolveTransactionType(row: StatementTransaction): string | null {
  if (row.bkTxCdProprietary && row.bkTxCdProprietary.trim().length) {
    return row.bkTxCdProprietary.trim()
  }

  const parts = [row.bkTxCdDomain, row.bkTxCdFamily, row.bkTxCdSubFamily]
    .map((value) => (value ? value.trim() : ''))
    .filter(Boolean)

  if (parts.length) {
    return parts.join('/')
  }

  return null
}

function resolveCounterpart(row: StatementTransaction): string | null {
  const isOutgoing = row.creditDebitIndicator === 'DBIT'
  if (isOutgoing) {
    return row.creditorName ?? row.ultimateCreditorName ?? row.creditorId ?? row.creditorAccountIban ?? null
  }

  return row.debtorName ?? row.ultimateDebtorName ?? row.debtorId ?? row.debtorAccountIban ?? null
}

type DetailEntry = { label: string; value: string }

const classBadgeColumn = 'flex flex-wrap gap-1'

function normalizeText(value: string): string {
  return value.trim()
}

function uniqueTexts(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>()
  values.forEach((v) => {
    if (!v) return
    const n = normalizeText(v)
    if (n.length) set.add(n)
  })
  return Array.from(set)
}

function uniqueTextsFromArray(values: Array<string[] | null | undefined>): string[] {
  const set = new Set<string>()
  values.forEach((arr) => {
    if (!Array.isArray(arr)) return
    arr.forEach((v) => {
      const n = normalizeText(v)
      if (n.length) set.add(n)
    })
  })
  return Array.from(set)
}

function buildFreeText(row: StatementTransaction): string[] {
  return uniqueTexts([
    ...uniqueTextsFromArray([row.remittanceUstrd, row.remittanceAdditional]),
    ...uniqueTexts([row.remittanceCreditorReference, row.entryAdditionalInfo, row.txAdditionalInfo])
  ])
}

function buildDetails(row: StatementTransaction): DetailEntry[] {
  const details: DetailEntry[] = []

  const add = (label: string, value: unknown) => {
    if (value === null || value === undefined) return
    if (Array.isArray(value)) {
      const filtered = value.filter((v) => typeof v === 'string' && v.trim().length)
      if (!filtered.length) return
      details.push({ label, value: filtered.join(' · ') })
      return
    }

    const str = String(value)
    if (!str.trim().length) return
    details.push({ label, value: str })
  }

  add('Transaktions-id', row.id)
  add('Kørsel', row.runId)
  add('Konto-id', row.accountId)
  add('Kontonavn', row.bankAccountName)

  add('Beløb', row.amount)
  add('Valuta', row.currency)
  add('Kredit/debet', row.creditDebitIndicator)
  add('Status', row.status)
  add('Bogføringsdato', row.bookingDate)
  add('Valørdag', row.valueDate)

  add('Statement-id', row.statementId)
  add('Entry index', row.entryIndex)

  add('NtryRef', row.ntryRef)
  add('NtryAcctSvcrRef', row.ntryAcctSvcrRef)
  add('Entry additional info', row.entryAdditionalInfo)

  add('TxAcctSvcrRef', row.txAcctSvcrRef)
  add('EndToEndId', row.refsEndToEndId)
  add('InstrId', row.refsInstrId)
  add('PmtInfId', row.refsPmtInfId)
  add('UETR', row.uetr)
  add('Tx additional info', row.txAdditionalInfo)

  add('BkTxCd (domain)', row.bkTxCdDomain)
  add('BkTxCd (family)', row.bkTxCdFamily)
  add('BkTxCd (sub family)', row.bkTxCdSubFamily)
  add('BkTxCd (proprietary)', row.bkTxCdProprietary)

  add('Debtor name', row.debtorName)
  add('Debtor id', row.debtorId)
  add('Debtor IBAN', row.debtorAccountIban)
  add('Creditor name', row.creditorName)
  add('Creditor id', row.creditorId)
  add('Creditor IBAN', row.creditorAccountIban)
  add('Ultimate debtor', row.ultimateDebtorName)
  add('Ultimate creditor', row.ultimateCreditorName)

  add('Remittance (Ustrd)', row.remittanceUstrd)
  add('Creditor reference', row.remittanceCreditorReference)
  add('Remittance additional', row.remittanceAdditional)

  add('Behandlingsstatus', row.processingStatus)
  add('Regel-id', row.ruleApplied)

  return details
}

const formatAmount = (row: StatementTransaction): string => {
  const currency = row.currency ?? 'DKK'
  const n = Number(String(row.amount).replace(/,/g, '.'))
  if (Number.isFinite(n)) {
    return n.toLocaleString('da-DK', { style: 'currency', currency })
  }
  return `${row.amount} ${currency}`
}

const columns: TableColumn<StatementTransaction>[] = [
  {
    accessorKey: 'bookingDate',
    header: 'Dato',
    size: 120,
    cell: ({ row }) => {
      return new Date(row.getValue('bookingDate')).toLocaleString('da-DK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  },
  {
    id: 'account',
    header: 'Konto',
    size: 180,
    cell: ({ row }) => {
      return row.original.bankAccountName ?? row.original.accountId ?? '-'
    }
  },
  {
    id: 'amount',
    header: 'Beløb',
    size: 140,
    cell: ({ row }) => {
      return h('span', { class: 'font-medium' }, formatAmount(row.original))
    }
  },
  {
    id: 'counterpart',
    header: 'Modpart',
    size: 220,
    cell: ({ row }) => {
      const counterpart = resolveCounterpart(row.original)
      if (!counterpart) return '-'

      return h('div', { class: classBadgeColumn }, [
        h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'secondary' }, () => counterpart)
      ])
    }
  },
  {
    id: 'freeText',
    header: 'Fritekst',
    enableSorting: false,
    cell: ({ row }) => {
      const texts = buildFreeText(row.original)
      if (!texts.length) return '-'

      return h(
        'div',
        { class: classBadgeColumn },
        texts.map((text) =>
          h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'primary' }, () => text)
        )
      )
    }
  },
  {
    id: 'type',
    header: 'Transaktionstype',
    size: 180,
    cell: ({ row }) => {
      const txType = resolveTransactionType(row.original)
      if (!txType) return '-'

      return h('div', { class: classBadgeColumn }, [
        h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'warning' }, () => txType)
      ])
    }
  },
  {
    id: 'details',
    header: 'Detaljer',
    size: 80,
    enableSorting: false,
    cell: ({ row }) => {
      const entries = buildDetails(row.original)

      return h(
        UPopover,
        { popper: { placement: 'left-start' } },
        {
          default: () =>
            h(UButton, {
              icon: 'i-lucide-info',
              label: 'Vis',
              variant: 'outline',
              size: 'xs',
              color: 'neutral'
            }),
          content: () =>
            h(
              'div',
              { class: 'p-4 max-w-2xl max-h-96 overflow-y-auto space-y-2' },
              entries.map((entry) =>
                h('div', { class: 'flex gap-2 text-sm' }, [
                  h('span', { class: 'text-muted w-40 shrink-0' }, entry.label),
                  h('span', { class: 'break-all min-w-0' }, entry.value)
                ])
              )
            )
        }
      )
    }
  }
]

const tableUi = {
  base: 'border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  tr: 'group',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'align-top group-has-[td:not(:empty)]:border-b border-default',
  separator: 'h-0'
}
</script>

<template>
  <UDashboardPanel id="statement">
    <template #header>
      <UDashboardNavbar title="Kontoudtog">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            icon="i-lucide-refresh-cw"
            label="Opdater"
            variant="ghost"
            :loading="status === 'pending'"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <DashboardDateRangePicker v-model="dateRange" :reset-value="defaultRange" />

        <div v-if="dateRange?.start && dateRange?.end" class="text-sm text-muted">
          {{ rows.length }} transaktioner i valgt periode
        </div>

        <UEmpty
          v-if="!rows.length && status !== 'pending'"
          icon="i-lucide-archive"
          title="Ingen transaktioner"
          description="Der er ingen transaktioner i den valgte periode endnu."
          class="border border-dashed border-default rounded-lg"
        >
          <template #actions>
            <UButton size="sm" variant="solid" @click="refresh()">
              Opdater
            </UButton>
          </template>
        </UEmpty>

        <UTable
          v-else
          :data="rows"
          :columns="columns"
          :loading="status === 'pending'"
          :ui="tableUi"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
