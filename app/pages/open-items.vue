<script lang="ts" setup>
    import type { TransactionSelectSchema } from '~/lib/db/schema/index'
    import useFlattenArray from '~/composables/useFlattenArray'
    
    const { data } = await useFetch<TransactionSelectSchema[]>('/api/transactions', {
        lazy: true
    })

    const postings = computed<TransactionSelectSchema[]>(() => useFlattenArray<TransactionSelectSchema>(data));
    
    const postingsByAccount = computed<Record<string, TransactionSelectSchema[]>>(() => {
        const result: Record<string, TransactionSelectSchema[]> = {}

        postings.value.forEach(tx => {
            const accountName = tx.bankAccountName || 'Ukendt konto'
            if (!result[accountName]) {
                result[accountName] = []
            }
            result[accountName].push(tx)
        })

        return result
    });
    
    type VisibleTransaction = {
        Beløb: number | undefined
        Transaktionstype: string
        Modpart: string
        Referencer: string[]
    }

    const visibleDataById = computed<Record<string, VisibleTransaction>>(() => {
        const result: Record<string, VisibleTransaction> = {}

        postings.value.forEach(tx => {
            result[tx.id] = {
                Beløb: tx.amount ?? undefined,
                Transaktionstype: tx.transactionType ?? '',
                Modpart: tx.counterpart ?? '',
                Referencer: tx.references ?? []
            }
        })
        return result
    })

    const amountFormatter = new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency: 'DKK'
    })

    const formatValue = (key: string, value: unknown): string | string[] => {
        if (key === 'Beløb' && typeof value === 'number') {
            return amountFormatter.format(value)
        }

        if (Array.isArray(value)) {
            return value.map(v => String(v))
        }

        return String(value ?? '')
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
            <UPageSection
                v-for="(items, account) in postingsByAccount"
                :key="account"
                :title="account"
                headline="Nordea"
            >
                <UPageColumns>
                    <UPageCard
                        v-for="item in items"
                        :key="item.id"
                        :title="'Transaktion #' + item.id"
                        :description="new Date(item.bookingDate).toLocaleDateString('da-DK')"
                        :disabled="!visibleDataById[item.id]"
                        variant="soft"
                    >
                        <div v-if="visibleDataById[item.id]" class="space-y-1 text-sm">
                            <div
                                v-for="([key, value]) in Object.entries(visibleDataById[item.id] ?? {})"
                                :key="key"
                                class="flex justify-between gap-4"
                            >
                                <span class="font-medium text-gray-400 whitespace-nowrap">
                                    {{ key }}
                                </span>

                                <span class="text-right">
                                    <template v-if="Array.isArray(value)">
                                        <div
                                            v-for="(ref, index) in formatValue(key, value)"
                                            :key="index"
                                        >
                                            {{ ref }}
                                        </div>
                                    </template>

                                    <template v-else>
                                        {{ formatValue(key, value) }}
                                    </template>
                                </span>
                            </div>
                        </div>
                        <div></div>
                        <USeparator>
                            <div class="flex items-center justify-between gap-2">
                                <span class="font-medium whitespace-nowrap">
                                    Behandl
                                </span>
                                <UButton
                                    class="font-bold rounded-full"
                                    trailing-icon="solar:pen-new-round-bold-duotone"
                                    size="xl"
                                />
                            </div>
                        </USeparator>
                    </UPageCard>
                </UPageColumns>
            </UPageSection>
        </template>
    </UDashboardPanel>
</template>