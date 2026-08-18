<script setup lang="ts">
const props = defineProps<{
  page: number
  pageSize: number
  total: number
  shown: number
  pending?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:page', value: number): void
}>()

const first = computed(() => props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1)
const last = computed(() => Math.min(props.page * props.pageSize, props.total))
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
</script>

<template>
  <div class="flex items-center border-t border-default pt-4 mt-auto">
    <div class="flex-1 text-sm text-muted">
      <USkeleton v-if="props.pending" class="h-4 w-56" />
      <span v-else>Viser transaktioner {{ first }}-{{ last }} af {{ props.total }} transaktioner</span>
    </div>
    <div v-if="props.total > props.pageSize" class="flex flex-1 justify-center">
      <UPagination
        :default-page="props.page"
        :items-per-page="props.pageSize"
        :total="props.total"
        :page-count="pageCount"
        @update:page="(value) => emit('update:page', value)"
      />
    </div>
    <div class="flex-1" />
  </div>
</template>
