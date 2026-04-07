<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { nextTick, watch } from 'vue'
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

type ComparableManualBookingPayload = ReturnType<typeof buildManualBookingPayload>

const savedSnapshot = ref<string | null>(null)

const serializePayload = (payload: ComparableManualBookingPayload) =>
	JSON.stringify({
		...payload,
		lines: (payload.lines ?? []).map((line) => ({
			...line,
			dimensions: (line.dimensions ?? []).slice().sort((a, b) => a.key.localeCompare(b.key)),
		})),
	})

const currentSnapshot = computed(() => serializePayload(buildManualBookingPayload(formState)))

const hasUnsavedChanges = computed(() => {
	if (!props.open) return false
	if (!savedSnapshot.value) return false
	return savedSnapshot.value !== currentSnapshot.value
})

const open = computed({
	get: () => props.open,
	set: (value: boolean) => {
		if (!value && props.open && hasUnsavedChanges.value) {
			if (process.client) {
				const ok = window.confirm(
					'Du har ændringer, som ikke er gemt\n\nVil du lukke uden at gemme?',
				)
				if (!ok) return
			}
		}
		emit('update:open', value)
	},
})

const toast = useToast()
const formRef = ref()
const isSubmitting = ref(false)
const isSavingDraft = ref(false)
const isLoadingDraft = ref(false)

const {
	manualBookingFormSchema,
	formState,
	accountingDimensionDefinitions,
	dimensionValuesByLine,
	accountingDimensionPending,
	accountingDimensionError,
	isAccountingDimensionConfigReady,
	cprTypeOptions,
	transactionAmountAbs,
	totalLinesAmount,
	addLine,
	removeLine,
	handleAttachmentUpdate,
	applyManualBookingPayload,
	buildManualBookingPayload
} = useManualBookingForm({
	transaction,
	isOpen: open
})

const summary = computed<TransactionSummary | null>(() => transaction.value?.summary ?? null)

const dimensionLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)

const currency = new Intl.NumberFormat('da-DK', {
	style: 'currency',
	currency: 'DKK'
})

const sumOre = computed(() => Math.round((totalLinesAmount.value ?? 0) * 100))
const txOre = computed(() => Math.round((transactionAmountAbs.value ?? 0) * 100))
const diffOre = computed(() => sumOre.value - txOre.value)

const isSumExact = computed(() => diffOre.value === 0)
const hasSumMismatch = computed(() => !isSumExact.value)

const formattedLineSum = computed(() => currency.format(totalLinesAmount.value ?? 0))
const formattedTransactionAmount = computed(() => currency.format(transactionAmountAbs.value ?? 0))
const formattedRemaining = computed(() => currency.format((transactionAmountAbs.value ?? 0) - (totalLinesAmount.value ?? 0)))
const formattedDiff = computed(() => currency.format(Math.abs((diffOre.value ?? 0) / 100)))

const sumAlertTitle = computed(() => {
	if (isSumExact.value) return ''
	return diffOre.value > 0
		? 'Anvist beløb er for højt'
		: 'Anvist beløb er for lavt'
})

const sumAlertDescription = computed(() => {
	if (isSumExact.value) return ''
	return diffOre.value > 0
		? `Linjesummen overstiger transaktionen med ${formattedDiff.value}`
		: `Linjesummen mangler ${formattedDiff.value} for at matche transaktionen`
})

watch(
	() => [open.value, transaction.value?.id] as const,
	async ([isOpen, txId]) => {
		if (!isOpen || !txId) return
		try {
			isLoadingDraft.value = true
			const response = await $fetch<{ draft: any }>(`/api/transactions/${txId}/draft`)
			if (response?.draft) {
				applyManualBookingPayload(response.draft)
			}
			await nextTick()
			savedSnapshot.value = currentSnapshot.value
		} catch (error) {
			console.warn('Kunne ikke hente kladde', error)
		} finally {
			isLoadingDraft.value = false
		}
	},
	{ immediate: true }
)

async function handleSubmit(event?: FormSubmitEvent<ManualFormState>) {
	if (!transaction.value) return
	if (!isAccountingDimensionConfigReady.value) {
		toast.add({
			title: 'Kan ikke sende endnu',
			description: accountingDimensionError.value
				? 'Konteringsdimensioner kunne ikke indlæses'
				: 'Konteringsdimensioner indlæses stadig…',
			color: 'error',
		})
		return
	}

	const payload = buildManualBookingPayload(event?.data ?? formState)

	try {
		isSubmitting.value = true
		await $fetch(`/api/transactions/${transaction.value.id}/process`, {
			method: 'POST',
			body: payload
		})
		toast.add({
			title: 'Postering sendt',
			description: `Transaktion ${transaction.value.id} er sendt til ERP`,
			color: 'primary'
		})
		savedSnapshot.value = currentSnapshot.value
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

async function handleSaveDraft() {
	if (!transaction.value) return
	if (!isAccountingDimensionConfigReady.value) {
		toast.add({
			title: 'Kan ikke gemme endnu',
			description: accountingDimensionError.value
				? 'Konteringsdimensioner kunne ikke indlæses'
				: 'Konteringsdimensioner indlæses stadig…',
			color: 'error',
		})
		return
	}
	const payload = buildManualBookingPayload(formState)
	try {
		isSavingDraft.value = true
		await $fetch(`/api/transactions/${transaction.value.id}/draft`, {
			method: 'PUT' as any,
			body: payload
		})
		toast.add({
			title: 'Kladde gemt',
			description: `Ændringer til transaktion ${transaction.value.id} er gemt uden at sende til ERP`,
			color: 'primary'
		})
		savedSnapshot.value = currentSnapshot.value
	} catch (error: any) {
		const description = error?.data?.message ?? error?.message ?? 'Uventet fejl'
		toast.add({
			title: 'Kunne ikke gemme',
			description,
			color: 'error'
		})
	} finally {
		isSavingDraft.value = false
	}
}
</script>

<template>
	<UModal v-model:open="open" :title="transaction ? 'Konter transaktion' : 'Vælg transaktion'">
		<template #body>
			<div v-if="!transaction" class="py-8 text-center text-sm text-gray-500">
				Vælg en transaktion for at starte behandlingen
			</div>
			<div v-else class="space-y-4">
				<div
					v-if="(formState.note ?? '').trim().length > 0"
					class="rounded-md border border-default bg-default px-3 py-2 text-sm border-l-4 border-l-primary/60"
				>
					<span class="font-semibold text-default">Noter:</span>
					<span class="ml-2 text-muted whitespace-pre-wrap">{{ formState.note }}</span>
				</div>

				<UAlert
					v-if="accountingDimensionError"
					variant="soft"
					color="error"
					title="Konteringsdimensioner"
					description="Kunne ikke indlæse konteringsdimensioner. Prøv at genindlæse siden."
				/>
				<BookingSummaryCard v-if="summary" :summary="summary" />

				<div v-if="isLoadingDraft" class="flex justify-center py-2">
					<USkeleton class="h-6 w-40" />
				</div>

					<UForm
						ref="formRef"
						:schema="manualBookingFormSchema"
						:state="formState"
						:disabled="isSubmitting || isSavingDraft"
						class="space-y-4 w-full"
						@submit="handleSubmit"
					>
						<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
								<div class="text-gray-600">Linjesum</div>
								<div class="text-right font-medium">{{ formattedLineSum }}</div>
								<div class="text-gray-600">Transaktion</div>
								<div class="text-right font-medium">{{ formattedTransactionAmount }}</div>
								<div class="text-gray-600">Resterende</div>
								<div class="text-right" :class="hasSumMismatch ? 'font-semibold text-red-600' : 'text-gray-700'">
									{{ formattedRemaining }}
								</div>
							</div>
							<UButton
								color="primary"
								variant="soft"
								icon="solar:add-circle-bold-duotone"
								@click="addLine"
							>
								Tilføj linje
							</UButton>
						</div>

						<UAlert
							v-if="hasSumMismatch"
							color="error"
							variant="soft"
							icon="solar:danger-triangle-bold-duotone"
							class="text-xs"
							:title="sumAlertTitle"
							:description="sumAlertDescription"
						/>
            
            <USeparator class="my-4" />

						<div class="space-y-4">
							<UCard
								v-for="(line, lineIndex) in formState.lines"
								:key="lineIndex"
								variant="soft"
								:ui="{ body: 'space-y-4 p-4' }"
								class="w-full"
							>
								<div class="flex items-center justify-between gap-2">
									<div class="font-semibold">Linje {{ lineIndex + 1 }}</div>
									<UButton
										v-if="formState.lines.length > 1"
										color="neutral"
										variant="soft"
										icon="solar:trash-bin-trash-bold-duotone"
										@click="removeLine(lineIndex)"
									>
										Fjern
									</UButton>
								</div>

								<div class="grid gap-4 md:grid-cols-2 items-end">
									<UFormField :label="'Beløb'" :name="`lines.${lineIndex}.amount`" required>
										<UInputNumber
											v-model="line.amount"
											placeholder="DKK"
											:min="0"
											currency="DKK"
											currencyDisplay="symbol"
											class="min-w-fit"
										/>
									</UFormField>

									<UFormField :name="`lines.${lineIndex}.text`">
										<UiFloatingLabelInput v-model="line.text" label="Posteringstekst" color="neutral" class="w-full" />
									</UFormField>
								</div>

								<div class="grid gap-4 md:grid-cols-2 items-end">

									<UFormField
										v-for="def in accountingDimensionDefinitions"
										:key="def.id + '-' + lineIndex"
										:name="`lines.${lineIndex}.dimensions.${def.key}`"
										:required="def.required"
									>
										<UiFloatingLabelInput
											:model-value="dimensionValuesByLine[lineIndex]?.[def.key] ?? ''"
											@update:model-value="(value) => { if (!dimensionValuesByLine[lineIndex]) dimensionValuesByLine[lineIndex] = {}; dimensionValuesByLine[lineIndex][def.key] = String(value ?? '') }"
											:label="dimensionLabel(def.key)"
											color="neutral"
											class="w-full"
										/>
									</UFormField>
								</div>
							</UCard>
						</div>

						<UCard variant="soft" :ui="{ body: 'space-y-4 p-4' }" class="w-full">
							<div class="grid gap-4 md:grid-cols-2 items-end">
								<UFormField label="CPR-type" name="cprType">
									<USelectMenu
										v-model="formState.cprType"
										:items="cprTypeOptions"
										valueKey="value"
										labelKey="label"
										placeholder="Vælg type"
										class="w-full"
									/>
								</UFormField>
								<UFormField name="cprNumber">
									<UiFloatingLabelInput
										v-model="formState.cprNumber"
										label="CPR-nummer"
										color="neutral"
										:disabled="formState.cprType !== 'statisk'"
										class="w-full"
									/>
								</UFormField>
							</div>
						</UCard>

						<USeparator class="my-4" />

						<UCard variant="soft" :ui="{ body: 'space-y-4 p-4' }" class="w-full">
							<UFormField label="Noter" name="note">
								<UTextarea
									v-model="formState.note"
									placeholder="Gem interne noter uden at sende til ERP"
									class="w-full"
								/>
							</UFormField>

							<UFormField name="notifyTo">
								<UiFloatingLabelInput
									v-model="formState.notifyTo"
									label="Notifikation sendes til"
									type="email"
									color="neutral"
									class="w-full"
								/>
							</UFormField>
						</UCard>

						<RulesFileUpload @update="handleAttachmentUpdate" />

						<div class="flex items-center justify-end gap-3 pt-4">
							<UButton
								variant="soft"
								color="primary"
								icon="solar:diskette-bold-duotone"
								:loading="isSavingDraft"
								:disabled="isSubmitting || isSavingDraft || hasSumMismatch || accountingDimensionPending || !!accountingDimensionError"
								@click="handleSaveDraft"
							>
								Gem
							</UButton>
							<UButton
								type="submit"
								color="primary"
								icon="solar:plain-bold-duotone"
								:loading="isSubmitting"
								:disabled="isSubmitting || isSavingDraft || hasSumMismatch || accountingDimensionPending || !!accountingDimensionError"
							>
								Send til ERP
							</UButton>
						</div>
					</UForm>
				</div>
		</template>
	</UModal>
</template>
