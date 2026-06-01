<script lang="ts" setup>
import BookingModal from '~/components/open-items/BookingModal.vue'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import { useOpenTransactions } from '~/composables/useOpenTransactions'
import type { OpenTransaction, TransactionSummary } from '~/types/transactions'

const {
  pending,
  refresh,
  transactions,
  groupedByAccount
} = await useOpenTransactions()

const { data: openItemsSettings } = await useFetch<{ allowIndividualGroupedProcessing: boolean }>(
  '/api/settings/open-items',
  {
    key: 'open-items-settings',
    default: () => ({ allowIndividualGroupedProcessing: false }),
  },
)

const isBookingOpen = ref(false)
const selectedTransactionId = ref<string | null>(null)
const selectedGroupTransactions = ref<OpenTransaction[] | null>(null)

const selectedTransaction = computed(() =>
  transactions.value.find((tx) => tx.id === selectedTransactionId.value) ?? null
)

const modalTransaction = computed<OpenTransaction | null>(() => {
  if ((selectedGroupTransactions.value?.length ?? 0) > 1) {
    return toGroupedModalTransaction(selectedGroupTransactions.value ?? [])
  }
  return selectedTransaction.value
})

const allowIndividualGroupedProcessing = computed(
  () => openItemsSettings.value?.allowIndividualGroupedProcessing ?? false,
)

type OpenTransactionStack = {
  stackId: string
  groupKey: string | null
  items: OpenTransaction[]
  representative: OpenTransaction
  totalAmount: number
  isGrouped: boolean
}

type AccountStackBuckets = Record<string, OpenTransactionStack[]>

const stacksByAccount = computed<AccountStackBuckets>(() => {
  const buckets: AccountStackBuckets = {}

  for (const [accountKey, items] of Object.entries(groupedByAccount.value)) {
    const byStack = new Map<string, OpenTransactionStack>()

    for (const item of items) {
      const stackId = item.groupKey ? `group:${item.groupKey}` : `single:${item.id}`
      const existing = byStack.get(stackId)

      if (!existing) {
        byStack.set(stackId, {
          stackId,
          groupKey: item.groupKey,
          items: [item],
          representative: item,
          totalAmount: item.amount,
          isGrouped: Boolean(item.groupKey),
        })
        continue
      }

      existing.items.push(item)
      existing.totalAmount += item.amount
    }

    buckets[accountKey] = Array.from(byStack.values())
  }

  return buckets
})

const expandedStackIds = ref<Record<string, boolean>>({})

function toggleStack(stackId: string) {
  expandedStackIds.value[stackId] = !expandedStackIds.value[stackId]
}

function isStackExpanded(stackId: string): boolean {
  return expandedStackIds.value[stackId] ?? false
}

const dkkFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
})

function toStackSummary(stack: OpenTransactionStack): TransactionSummary {
  if (!stack.isGrouped || stack.items.length <= 1) {
    return stack.representative.summary
  }

  const base = stack.representative.summary
  const lineCount = stack.items.length
  const references = Array.from(new Set(stack.items.flatMap((entry) => entry.references ?? [])))

  return {
    ...base,
    amount: {
      ...base.amount,
      raw: stack.totalAmount,
      value: dkkFormatter.format(stack.totalAmount),
    },
    transactionId: {
      ...base.transactionId,
      value: `Samlepost (${lineCount} linjer)`,
    },
    sections: base.sections.map((section) => {
      if (section.key !== 'fritekst') {
        return section
      }
      return {
        ...section,
        chips: references,
      }
    }),
  }
}

function toGroupedModalTransaction(items: OpenTransaction[]): OpenTransaction | null {
  if (items.length === 0) return null
  if (items.length === 1) return items[0] ?? null

  const representative = items[0]
  if (!representative) return null

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const references = Array.from(new Set(items.flatMap((entry) => entry.references ?? [])))
  const base = representative.summary

  return {
    ...representative,
    amount: totalAmount,
    references,
    summary: {
      ...base,
      amount: {
        ...base.amount,
        raw: totalAmount,
        value: dkkFormatter.format(totalAmount),
      },
      transactionId: {
        ...base.transactionId,
        value: `Samlepost (${items.length} linjer)`,
      },
      sections: base.sections.map((section) => {
        if (section.key !== 'fritekst') {
          return section
        }
        return {
          ...section,
          chips: references,
        }
      }),
    },
  }
}

function openBookingModal(transaction: OpenTransaction) {
  selectedGroupTransactions.value = null
  selectedTransactionId.value = transaction.id
  isBookingOpen.value = true
}

function openGroupedBookingModal(items: OpenTransaction[]) {
  selectedGroupTransactions.value = items
  selectedTransactionId.value = items[0]?.id ?? null
  isBookingOpen.value = true
}

async function handleBookingProcessed() {
  isBookingOpen.value = false
  selectedTransactionId.value = null
  selectedGroupTransactions.value = null
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="open-items">
    <template #header>
      <UDashboardNavbar title="Åbne poster">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="pending" class="flex justify-center py-10">
        <USkeleton class="h-10 w-32" />
      </div>
      <div v-else-if="!transactions.length" class="py-10 text-center text-gray-500">
        Der er ingen åbne transaktioner at behandle.
      </div>
      <template v-else>
        <UPageSection
          v-for="(stacks, accountKey) in stacksByAccount"
          :key="accountKey"
          :title="stacks[0]?.representative.accountId ?? accountKey"
          :headline="stacks[0]?.representative.bankAccountName ?? 'Nordea'"
        >
          <template #description>
            {{ stacks.length }} {{ stacks.length === 1 ? 'kort' : 'kort' }}
          </template>
          <div class="columns-1 md:columns-2 xl:columns-3 [column-gap:1.5rem]">
            <div
              v-for="stack in stacks"
              :key="stack.stackId"
              class="relative isolate mb-6 w-full min-w-0 break-inside-avoid"
              :class="stack.items.length > 1 ? 'pr-2 pt-2' : ''"
            >
              <div class="relative">
                <div
                  v-if="stack.items.length > 1"
                  class="pointer-events-none absolute inset-0 z-0 -translate-y-1 translate-x-1 rounded-xl border border-default/60 bg-accented"
                />

                <div class="relative z-20 rounded-xl border border-default/60 bg-default">
                  <BookingSummaryCard :summary="toStackSummary(stack)">
                  <template #footer>
                    <div class="mt-4 space-y-3">
                      <div v-if="stack.items.length > 1" class="space-y-3">
                        <div class="flex items-center justify-center">
                          <UBadge color="neutral" variant="subtle" size="sm">
                            Samlepost · {{ stack.items.length }} poster
                          </UBadge>
                        </div>

                        <div
                          class="grid grid-cols-1 gap-2"
                          :class="allowIndividualGroupedProcessing ? 'sm:grid-cols-2' : ''"
                        >
                          <UButton
                            v-if="allowIndividualGroupedProcessing"
                            class="w-full justify-center font-semibold"
                            color="neutral"
                            variant="outline"
                            size="lg"
                            :icon="isStackExpanded(stack.stackId) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                            @click="toggleStack(stack.stackId)"
                          >
                            {{ isStackExpanded(stack.stackId) ? 'Skjul poster' : 'Vis poster' }}
                          </UButton>
                          <UButton
                            class="font-bold"
                            color="primary"
                            variant="solid"
                            size="lg"
                            block
                            trailing-icon="solar:pen-new-round-bold-duotone"
                            @click="openGroupedBookingModal(stack.items)"
                          >
                            Behandl
                          </UButton>
                        </div>
                      </div>

                      <UAlert
                        v-if="stack.items.length > 1 && !allowIndividualGroupedProcessing"
                        color="warning"
                        variant="soft"
                        icon="solar:lock-bold-duotone"
                        title="Individuel behandling er slået fra"
                      />

                      <div v-if="stack.items.length <= 1" class="grid grid-cols-1 gap-2">
                        <UButton
                          class="w-full justify-center font-bold"
                          color="primary"
                          variant="solid"
                          size="lg"
                          block
                          trailing-icon="solar:pen-new-round-bold-duotone"
                          @click="stack.items.length > 1 && allowIndividualGroupedProcessing ? openGroupedBookingModal(stack.items) : openBookingModal(stack.representative)"
                        >
                          Behandl
                        </UButton>
                      </div>
 
                      <UCard
                        v-if="stack.items.length > 1 && allowIndividualGroupedProcessing && isStackExpanded(stack.stackId)"
                        variant="soft"
                        :ui="{ body: 'space-y-2 p-2' }"
                      >
                        <div
                          v-for="member in stack.items"
                          :key="member.id"
                          class="flex items-center justify-between gap-2"
                        >
                          <span class="text-sm font-medium">{{ member.summary.amount.value }}</span>
                          <UButton
                            size="xs"
                            color="primary"
                            variant="soft"
                            :disabled="!allowIndividualGroupedProcessing"
                            @click="openBookingModal(member)"
                          >
                            Behandl linje
                          </UButton>
                        </div>
                      </UCard>
                    </div>
                  </template>
                  </BookingSummaryCard>
                </div>
              </div>
            </div>
          </div>
        </UPageSection>
      </template>
    </template>
  </UDashboardPanel>
  <BookingModal
    v-model:open="isBookingOpen"
    :transaction="modalTransaction"
    :group-transactions="selectedGroupTransactions"
    @processed="handleBookingProcessed"
  />
</template>