<script setup lang="ts">
    import { onBeforeUnmount } from 'vue'
    import type { RunListItem } from '~/types/runs'

    interface Props {
        type: 'error' | 'docs' | 'erpResponses'
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
        const content: any = doc.content
        if (content instanceof Blob) {
            return content as Blob
        }

        if (typeof doc.content === 'string') {
            const fallbackMime = doc.mimeType ?? 'application/octet-stream'

            try {
                const normalizedContent = doc.content.includes(',')
                    ? doc.content.split(',').at(-1) ?? ''
                    : doc.content
                const binary = atob(normalizedContent)
                const bytes = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i)
                }
                return new Blob([bytes], { type: fallbackMime })
            } catch (error) {
                // Not base64 (or corrupted). Fall back to treating content as plain text.
                const likelyText = fallbackMime.startsWith('text/') || fallbackMime.includes('xml')
                return new Blob([doc.content], { type: likelyText ? fallbackMime : 'text/plain' })
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

    const getTitle = () => {
        switch (props.type) {
            case 'error':
                return `Fejl (${props.run.errors?.length || 0})`
            case 'docs':
                return `Dokumenter (${props.run.documents?.length || 0})`
            case 'erpResponses':
                return `Bilagsnumre (${props.run.erpResponses?.length || 0})`
        }
    }

    const getIcon = () => {
        switch (props.type) {
            case 'error':
                return 'i-lucide-alert-circle'
            case 'docs':
                return 'i-lucide-file'
            case 'erpResponses':
                return 'i-lucide-receipt'
        }
    }

    const getColor = () => {
        switch (props.type) {
            case 'error':
                return 'error'
            case 'docs':
                return 'neutral'
            case 'erpResponses':
                return 'neutral'
        }
    }

    const getCount = () => {
        switch (props.type) {
            case 'error':
                return props.run.errors?.length || 0
            case 'docs':
                return props.run.documents?.length || 0
            case 'erpResponses':
                return props.run.erpResponses?.length || 0
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

                <!-- ERP Responses Content (Bilagsnumre) -->
                <template v-if="type === 'erpResponses' && run.erpResponses">
                    <ul class="list-disc pl-5 space-y-1">
                        <li v-for="resp in run.erpResponses" :key="resp.id" class="text-sm">
                            <span class="font-medium">{{ resp.id }}</span>
                        </li>
                    </ul>
                </template>
            </div>
        </template>
    </UPopover>
</template>