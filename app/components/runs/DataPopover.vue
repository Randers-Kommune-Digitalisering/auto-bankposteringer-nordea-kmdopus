<script setup lang="ts">
    import { onBeforeUnmount } from 'vue'
    import type { RunListItem } from '~/types/runs'

    interface Props {
        type: 'error' | 'transactions' | 'docs'
        run: RunListItem
        open: boolean
    }

    interface Emits {
        (e: 'update:open', value: boolean): void
    }

    const props = defineProps<Props>()
    const emit = defineEmits<Emits>()

    const docUrlMap = new Map<string, string>()
    const isClient = import.meta.client

    const attemptCreateBlobFromContent = (doc: RunListItem['documents'][number]) => {
        if (doc.content instanceof Blob) {
            return doc.content
        }

        if (typeof doc.content === 'string') {
            try {
                const normalizedContent = doc.content.includes(',')
                    ? doc.content.split(',').at(-1) ?? ''
                    : doc.content
                const binary = atob(normalizedContent)
                const bytes = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i)
                }
                return new Blob([bytes], { type: doc.mimeType ?? 'application/octet-stream' })
            } catch (error) {
                console.error('Failed to decode document content', doc.id, error)
            }
        }

        return null
    }

    const getDocUrl = (doc: RunListItem['documents'][number]): string | null => {
        if (!isClient || !doc.content) return null
        
        let url = docUrlMap.get(doc.id)
        if (!url) {
            const blob = attemptCreateBlobFromContent(doc)
            if (!blob) {
                return null
            }
            url = URL.createObjectURL(blob)
            docUrlMap.set(doc.id, url)
        }
        return url
    }

    onBeforeUnmount(() => {
        if (!isClient) {
            return
        }
        for (const url of docUrlMap.values()) {
            URL.revokeObjectURL(url)
        }
        docUrlMap.clear()
    })

    const groupDocsByType = (docs: RunListItem['documents']) => {
        return docs.reduce((acc: Record<string, RunListItem['documents']>, d) => {
            const typeKey = d.type ?? 'ukendt'
            acc[typeKey] = acc[typeKey] ?? []
            acc[typeKey].push(d)
            return acc
        }, {})
    }

    const groupTransactionsByAccount = (txs: RunListItem['transactions']) => {
        return txs.reduce((acc: Record<string, RunListItem['transactions']>, tx) => {
            const account = tx.bankAccountLabel || tx.accountId || 'Ukendt konto'
            if (!acc[account]) {
                acc[account] = []
            }
            acc[account].push(tx)
            return acc
        }, {})
    }

    const getTitle = () => {
        switch (props.type) {
            case 'error':
                return `Fejl (${props.run.errors?.length || 0})`
            case 'transactions':
                return `Transaktioner (${props.run.transactions?.length || 0})`
            case 'docs':
                return `Dokumenter (${props.run.documents?.length || 0})`
        }
    }

    const getIcon = () => {
        switch (props.type) {
            case 'error':
                return 'i-lucide-alert-circle'
            case 'transactions':
                return 'i-lucide-list'
            case 'docs':
                return 'i-lucide-file'
        }
    }

    const getColor = () => {
        switch (props.type) {
            case 'error':
                return 'error'
            case 'transactions':
                return 'neutral'
            case 'docs':
                return 'neutral'
        }
    }

    const getCount = () => {
        switch (props.type) {
            case 'error':
                return props.run.errors?.length || 0
            case 'transactions':
                return props.run.transactions?.length || 0
            case 'docs':
                return props.run.documents?.length || 0
        }
    }
</script>

<template>
    <UPopover :open="open" @update:open="(val) => emit('update:open', val)">
        <UButton
            :icon="getIcon()"
            :label="`${getCount()}`"
            :color="getColor()"
            variant="outline"
            size="xs"
        />

        <template #content>
            <div class="p-4 max-w-2xl max-h-96 overflow-y-auto space-y-3">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-sm" :class="{ 'text-error': type === 'error' }">
                        {{ getTitle() }}
                    </h3>
                </div>

                <!-- Error Content -->
                <template v-if="type === 'error' && run.errors">
                    <ul class="list-disc pl-5 space-y-2">
                        <li v-for="err in run.errors" :key="err.id" class="text-sm text-error">
                            {{ err.message ?? err.errorString ?? 'Ukendt fejl' }}
                        </li>
                    </ul>
                </template>

                <!-- Transactions Content -->
                <template v-if="type === 'transactions' && run.transactions">
                    <div class="space-y-3">
                        <template v-for="(txs, account) in groupTransactionsByAccount(run.transactions)" :key="account">
                            <div>
                                <h4 class="font-medium text-sm mb-2 capitalize">{{ account }}</h4>
                                <div class="space-y-2">
                                    <div
                                        v-for="tx in txs"
                                        :key="tx.id"
                                        class="text-sm p-2 bg-elevated/50 rounded border border-default"
                                    >
                                        <div class="font-medium">{{ tx.id }}</div>
                                        <div class="text-muted text-sm">{{ tx.counterpart ?? tx.references?.[0] ?? '-' }}</div>
                                        <div class="font-medium">
                                            {{ Number(tx.amount).toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </template>

                <!-- Documents Content -->
                <template v-if="type === 'docs' && run.documents">
                    <div class="space-y-3">
                        <template v-for="(docsOfType, docType) in groupDocsByType(run.documents)" :key="String(docType)">
                            <div>
                                <h4 class="font-medium text-sm mb-2 capitalize">{{ docType }}</h4>
                                <ul class="list-disc pl-5 space-y-1">
                                    <li v-for="doc in docsOfType" :key="doc.id" class="text-sm">
                                        <template v-if="doc.content && isClient">
                                            <a
                                                :href="getDocUrl(doc) ?? undefined"
                                                :download="doc.filename"
                                                class="text-blue-600 hover:underline font-medium"
                                            >
                                                {{ doc.filename }}
                                            </a>
                                        </template>
                                        <template v-else>
                                            <span class="text-muted">{{ doc.filename }}</span>
                                        </template>
                                        <span class="text-muted text-xs ml-1">({{ doc.mimeType ?? doc.fileExtension }})</span>
                                    </li>
                                </ul>
                            </div>
                        </template>
                    </div>
                </template>
            </div>
        </template>
    </UPopover>
</template>