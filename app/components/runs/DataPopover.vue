<script setup lang="ts">
    import type { RunListItem } from '~/types/runs'

    interface Props {
        type: 'error' | 'erpDocuments'
        run: RunListItem
        open: boolean
    }

    interface Emits {
        (e: 'update:open', value: boolean): void
    }

    const appConfig = useAppConfig()
    const dtf = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' })

    const props = defineProps<Props>()
    const emit = defineEmits<Emits>()

    const getTitle = () => {
        switch (props.type) {
            case 'error':
                return `Fejl (${props.run.errors?.length || 0})`
            case 'erpDocuments':
                return `Bilagsnumre (${props.run.erpDocuments?.length || 0})`
        }
    }

    const getIcon = () => {
        switch (props.type) {
            case 'error':
                return appConfig.ui.icons.warning
            case 'erpDocuments':
                return appConfig.ui.icons.hash
        }
    }

    const getColor = () => {
        switch (props.type) {
            case 'error':
                return 'error'
            case 'erpDocuments':
                return 'neutral'
        }
    }

    const getCount = () => {
        switch (props.type) {
            case 'error':
                return props.run.errors?.length || 0
            case 'erpDocuments':
                return props.run.erpDocuments?.length || 0
        }
    }

    const formatDateTime = (value: string | null | undefined) => {
        if (!value) return '—'
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) return String(value)
        return dtf.format(d)
    }
</script>

<template>
    <UPopover :open="open" @update:open="(val) => emit('update:open', val)">
        <UButton
            :icon="getIcon()"
            :label="`${getCount()}`"
            :color="getColor()"
            variant="soft"
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
                            <span class="text-muted">{{ formatDateTime(err.createdAt) }}:</span>
                            <span class="ml-1">{{ err.message ?? err.errorString ?? 'Ukendt fejl' }}</span>
                        </li>
                    </ul>
                </template>

                <!-- ERP document references (bilagsnumre) -->
                <template v-if="type === 'erpDocuments' && run.erpDocuments">
                    <ul class="list-disc pl-5 space-y-1">
                        <li v-for="document in run.erpDocuments" :key="document.documentId" class="text-sm">
                            <span class="font-medium">{{ document.documentId }}</span>
                        </li>
                    </ul>
                </template>
            </div>
        </template>
    </UPopover>
</template>