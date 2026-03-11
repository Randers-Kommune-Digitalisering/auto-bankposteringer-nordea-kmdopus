<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import RulesFileUpload from '~/components/rules/FileUpload.vue'
import { useManualBookingForm } from '~/composables/useManualBookingForm'
import type { OpenTransaction, TransactionSummary } from '~/types/transactions'
import type { ManualBookingFormState as ManualFormState } from '#engine/manual-booking/domain/manualBooking'

const props = defineProps<{
	open: boolean
	transaction: OpenTransaction | null
}>()
const transaction = toRef(props, 'transaction')

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void
	(e: 'processed'): void
}>()

const open = computed({
	get: () => props.open,
	set: (value: boolean) => emit('update:open', value)
})

const toast = useToast()
const formRef = ref()
const isSubmitting = ref(false)

const {
	manualBookingFormSchema,
	formState,
	accountingDimensionDefinitions,
	accountingDimensionValues,
	cprTypeOptions,
	handleAttachmentUpdate,
	buildManualBookingPayload
} = useManualBookingForm({
	transaction,
	isOpen: open
})

const summary = computed<TransactionSummary | null>(() => transaction.value?.summary ?? null)

async function handleSubmit(event?: FormSubmitEvent<ManualFormState>) {
	if (!transaction.value) return

	const payload = buildManualBookingPayload(event?.data ?? formState)

	try {
		isSubmitting.value = true
		await $fetch(`/api/transactions/${transaction.value.id}/process`, {
			method: 'POST',
			body: payload
		})
		toast.add({
			title: 'Postering sendt',
			description: `Transaktion ${transaction.value.id} er sendt til ERP.`,
			color: 'primary'
		})
		emit('processed')
	} catch (error: any) {
		const description = error?.data?.message ?? error?.message ?? 'Uventet fejl'
		toast.add({
			title: 'Kunne ikke bogføre',
			description,
			color: 'error'
		})
	} finally {
		isSubmitting.value = false
	}
}
</script>

<template>
	<UModal v-model:open="open" :title="transaction ? 'Konter transaktion' : 'Vælg transaktion'">
		<template #body>
			<div v-if="!transaction" class="py-8 text-center text-sm text-gray-500">
				Vælg en transaktion for at starte behandlingen.
			</div>
			<div v-else class="space-y-4">
				<BookingSummaryCard v-if="summary" :summary="summary" />

					<UForm
						ref="formRef"
						:schema="manualBookingFormSchema"
						:state="formState"
						:disabled="isSubmitting"
						class="space-y-4"
						@submit="handleSubmit"
					>
						<div class="grid gap-4 md:grid-cols-2">
								<UFormField
									v-for="def in accountingDimensionDefinitions"
									:key="def.id"
									:label="def.key"
									name="dimensions"
									:required="def.required"
								>
									<UInput v-model="accountingDimensionValues[def.key]" :placeholder="def.key" />
								</UFormField>
							<UFormField label="Posteringstekst" name="text">
								<UInput v-model="formState.text" placeholder="Tekst fra bank" />
							</UFormField>
						</div>

						<div class="grid gap-4 md:grid-cols-2">
							<UFormField label="CPR-type" name="cprType">
								<USelectMenu
									v-model="formState.cprType"
									:items="cprTypeOptions"
									valueKey="value"
									labelKey="label"
									placeholder="Vælg type"
								/>
							</UFormField>
							<UFormField label="CPR-nummer" name="cprNumber">
								<UInput v-model="formState.cprNumber" :disabled="formState.cprType !== 'statisk'" />
							</UFormField>
						</div>

						<UFormField label="Notifikation sendes til" name="notifyTo">
							<UInput v-model="formState.notifyTo" type="email" placeholder="f.eks. bogholderi@kommune.dk" />
						</UFormField>

						<UFormField label="Noter" name="note">
							<UTextarea v-model="formState.note" placeholder="Valgfri note" />
						</UFormField>

						<RulesFileUpload @update="handleAttachmentUpdate" />

						<div class="flex items-center justify-end gap-3 pt-4">
							<UButton
								variant="soft"
								color="neutral"
								@click="open = false"
								:disabled="isSubmitting"
							>
								Luk
							</UButton>
							<UButton
								type="submit"
								color="primary"
								icon="i-lucide-send"
								:loading="isSubmitting"
							>
								Send til ERP
							</UButton>
						</div>
					</UForm>
				</div>
		</template>
	</UModal>
</template>
