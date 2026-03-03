<script lang="ts" setup>
import BookingModal from '~/components/open-items/BookingModal.vue'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import { useOpenTransactions } from '~/composables/useOpenTransactions'
import type { OpenTransaction } from '~/types/transactions'

definePageMeta({
  path: '/åbne-poster'
})

const {
  pending,
  refresh,
  transactions,
  groupedByAccount
} = await useOpenTransactions()

const isBookingOpen = ref(false)
const selectedTransactionId = ref<string | null>(null)

const selectedTransaction = computed(() =>
  transactions.value.find((tx) => tx.id === selectedTransactionId.value) ?? null
)

function openBookingModal(transaction: OpenTransaction) {
  selectedTransactionId.value = transaction.id
  isBookingOpen.value = true
}

async function handleBookingProcessed() {
  isBookingOpen.value = false
  selectedTransactionId.value = null
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
          v-for="(items, accountKey) in groupedByAccount"
          :key="accountKey"
          :title="items[0]?.accountId ?? accountKey"
          :headline="items[0]?.bankAccountName ?? 'Nordea'"
        >
          <template #description>
            {{ items.length }} {{ items.length === 1 ? 'transaktion' : 'transaktioner' }}
          </template>
          <UPageColumns>
            <div v-for="item in items" :key="item.id" class="w-full">
              <BookingSummaryCard :summary="item.summary">
                <template #footer>
                  <div class="flex justify-center mt-4">
                    <UButton
                      class="font-bold rounded-full"
                      color="primary"
                      variant="solid"
                      size="xl"
                      trailing-icon="solar:pen-new-round-bold-duotone"
                      @click="openBookingModal(item)"
                    >
                      Behandl
                    </UButton>
                  </div>
                </template>
              </BookingSummaryCard>
            </div>
          </UPageColumns>
        </UPageSection>
      </template>
    </template>
  </UDashboardPanel>
  <BookingModal v-model:open="isBookingOpen" :transaction="selectedTransaction" @processed="handleBookingProcessed" />
</template>