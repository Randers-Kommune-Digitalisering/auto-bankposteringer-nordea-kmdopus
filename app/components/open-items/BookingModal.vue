<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { nextTick, watch } from 'vue'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import RulesFileUpload from '~/components/rules/FileUpload.vue'
import { useManualBookingForm } from '~/composables/useManualBookingForm'
import { formatTransactionFieldHint } from '~/lib/presenters/transactionFieldHints'
import type { OpenTransaction, TransactionSummary } from '~/types/transactions'
import type { ManualBookingFormState as ManualFormState } from '#engine/manual-booking/domain/manualBooking'

const appConfig = useAppConfig()

const props = defineProps<{
	open: boolean
	transaction: OpenTransaction | null
	groupTransactions?: OpenTransaction[] | null
}>()
const transaction = toRef(props, 'transaction')

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void
	(e: 'processed'): void
	(e: 'draft-saved', payload: { transactionId: string; note: string | null }): void
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
const summaryReferenceKeys = computed<Set<string>>(() => {
	const sections = (summary.value?.sections ?? []) as Array<{ key: string; chips?: Array<{ value: string; source?: string }> }>
	const chipSections = sections.filter((section) => ['reference', 'teknisk'].includes(section.key))
	if (!chipSections.length) return new Set<string>()

	const keys = new Set<string>()
	for (const section of chipSections) {
		for (const token of splitTriadTokens((section.chips ?? []).map((entry) => entry.value))) {
		const normalized = normalizeReferenceToken(token)
		if (!normalized) continue
		keys.add(normalized.toLowerCase())
		}
	}

	return keys
})
const rawReferences = computed<string[]>(() => {
	const refs = transaction.value?.references
	if (!Array.isArray(refs)) return []
	return refs
		.filter((entry): entry is string => typeof entry === 'string')
		.map((entry) => entry.trim())
		.filter(Boolean)
})
const groupTransactions = computed<OpenTransaction[]>(() => props.groupTransactions ?? [])
const isGroupMode = computed(() => groupTransactions.value.length > 1)
const groupTransactionIds = computed(() => groupTransactions.value.map((entry) => entry.id))

type TriadBadge = {
	value: string
	hint: string
}

type ReferenceBadge = {
	value: string
	hint?: string
}

function splitTriadTokens(values: string[]): string[] {
	return values
		.flatMap((value) => String(value ?? '').split(';'))
		.map((value) => value.trim())
		.filter(Boolean)
}

function parseTriadToken(token: string): { code: string; label: string; value: string } | null {
	const match = /^(\d{2,3}):([^:]+):(.*)$/.exec(token)
	if (!match) return null
	const code = String(match[1] ?? '').trim()
	const label = String(match[2] ?? '').trim()
	const value = String(match[3] ?? '').trim()
	if (!code || !label || !value) return null
	return { code, label, value }
}

const triadBadges = computed<TriadBadge[]>(() => {
	if (!rawReferences.value.length) return []

	const seen = new Set<string>()
	const badges: TriadBadge[] = []
	for (const token of splitTriadTokens(rawReferences.value)) {
		const triad = parseTriadToken(token)
		if (!triad) continue
		if (triad.code === '500' || triad.code === '502') continue
		if (isNoisyTriad(triad)) continue
		const key = `${triad.code}:${triad.label}:${triad.value}`.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		badges.push({
			value: triad.value,
			hint: `${triad.code}: ${triad.label}`,
		})
	}
	return badges
})

const referenceBadges = computed<ReferenceBadge[]>(() => {
	if (!rawReferences.value.length) return []

	const seen = new Set<string>()
	const badges: ReferenceBadge[] = []
	for (const token of splitTriadTokens(rawReferences.value)) {
		const triad = parseTriadToken(token)
		if (triad) continue
		const normalized = normalizeReferenceToken(token)
		if (!normalized) continue
		if (summaryReferenceKeys.value.has(normalized.toLowerCase())) continue
		const dedupKey = normalized.toLowerCase()
		if (seen.has(dedupKey)) continue
		seen.add(dedupKey)
		badges.push({ value: normalized, hint: 'Reference' })
	}

	return badges
})

const combinedReferenceBadges = computed<ReferenceBadge[]>(() => {
	const seen = new Set<string>()
	const merged: ReferenceBadge[] = []

	for (const entry of triadBadges.value) {
		const key = `triad:${entry.value}:${entry.hint}`.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		merged.push({ value: entry.value, hint: entry.hint })
	}

	for (const entry of referenceBadges.value) {
		const key = `ref:${entry.value}`.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		merged.push(entry)
	}

	return merged
})

function isNoisyTriad(triad: { code: string; label: string; value: string }): boolean {
	const label = triad.label.trim().toUpperCase()
	const value = triad.value.trim().toUpperCase()
	if (!label || !value) return true

	if (label === 'FILE INFORMATION') return true
	if (label === 'TRANSACTION-DETAILKEY') return true
	if (label === 'ADVICE REFERENCE') return true
	if (label === 'NOTICE NUMBER') return true
	if (label === 'REFERENCE' && /^(KON|KIM)\s+KONTO\b/.test(value)) return true

	return false
}

function normalizeReferenceToken(token: string): string | null {
	const value = token.trim()
	if (!value) return null
	if (/^(KON|KIM)\s+KONTO\b/i.test(value)) return null
	if (/^\d{1,4}$/.test(value)) return null
	return value
}

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
		if (isGroupMode.value) {
			const payload = {
				lines: groupTransactions.value.map((entry) => ({
					amount: Math.abs(Number(entry.amount) || 0),
					text: '',
					dimensions: [],
				})),
				text: '',
				cprType: 'ingen' as const,
				cprNumber: '',
				notifyTo: '',
				note: '',
			}
			applyManualBookingPayload(payload)
			await nextTick()
			savedSnapshot.value = currentSnapshot.value
			return
		}
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
		if (isGroupMode.value) {
			await $fetch('/api/transactions/group/process', {
				method: 'POST',
				body: {
					transactionIds: groupTransactionIds.value,
					payload,
				},
			})
		} else {
			await $fetch(`/api/transactions/${transaction.value.id}/process`, {
				method: 'POST',
				body: payload
			})
		}
		toast.add({
			title: 'Postering sendt',
			description: isGroupMode.value
				? `Samlepost med ${groupTransactionIds.value.length} transaktioner er sendt til ERP`
				: `Transaktion ${transaction.value.id} er sendt til ERP`,
			color: 'primary'
		})
		await refreshNuxtData('open-transactions')
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
	if (isGroupMode.value) return
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
		emit('draft-saved', {
			transactionId: transaction.value.id,
			note: (formState.note ?? '').trim() || null,
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

function collapseAllLines() {
	if (!isGroupMode.value) return
	if ((formState.lines?.length ?? 0) <= 1) return

	const mergedAmount = (formState.lines ?? []).reduce(
		(acc, line) => acc + Math.abs(Number(line.amount) || 0),
		0,
	)
	const firstLineText = (formState.lines ?? [])
		.map((line) => String(line.text ?? '').trim())
		.find((value) => value.length > 0)

	applyManualBookingPayload({
		...buildManualBookingPayload(formState),
		lines: [
			{
				amount: mergedAmount,
				text: firstLineText ?? 'Tekst fra bank',
				dimensions: [],
			},
		],
	})

	toast.add({
		title: 'Linjer samlet',
		description: 'Alle linjer er samlet til én linje. Tilpas kontering efter behov.',
		color: 'primary',
	})
}
</script>

<template>
	<UModal v-model:open="open" :title="transaction ? (isGroupMode ? 'Konter samlepost' : 'Konter transaktion') : 'Vælg transaktion'">
		<template #body>
			<div v-if="!transaction" class="py-8 text-center text-sm text-gray-500">
				Vælg en transaktion for at starte behandlingen
			</div>
			<div v-else class="space-y-4">
				<UAlert
					v-if="isGroupMode"
					variant="soft"
					color="primary"
					:icon="appConfig.ui.icons.layers"
					:title="`Samlepost med ${groupTransactionIds.length} transaktioner`"
					description="Hver transaktion er forudfyldt som en finanslinje. Justér linjer efter behov før afsendelse."
				/>
				<UAlert
					v-if="accountingDimensionError"
					variant="soft"
					color="error"
					title="Konteringsdimensioner"
					description="Kunne ikke indlæse konteringsdimensioner. Prøv at genindlæse siden."
				/>
				<BookingSummaryCard v-if="summary" :summary="summary" />

				<UCard v-if="combinedReferenceBadges.length || transaction?.id || transaction?.runId" variant="soft" :ui="{ body: 'space-y-3 p-4' }">
					<div v-if="combinedReferenceBadges.length" class="text-xs font-semibold uppercase tracking-wide text-muted">Supplerende systemfelter</div>
					<div v-if="combinedReferenceBadges.length" class="flex flex-wrap gap-2">
						<UBadge
							v-for="(entry, index) in combinedReferenceBadges"
							:key="`ref-${index}`"
							variant="soft"
							color="warning"
							size="lg"
							:title="formatTransactionFieldHint(entry.hint)"
							class="max-w-full min-w-0 whitespace-normal break-all"
						>
							{{ entry.value }}
						</UBadge>
					</div>

					<div v-if="transaction?.id" class="text-xs font-semibold uppercase tracking-wide text-muted">Transaktions-ID</div>
					<div v-if="transaction?.id" class="flex flex-wrap gap-2">
						<UBadge variant="soft" color="warning" size="lg" class="max-w-full min-w-0 whitespace-normal break-all">
							{{ transaction.id }}
						</UBadge>
					</div>

					<div v-if="transaction?.runId" class="text-xs font-semibold uppercase tracking-wide text-muted">Kørsels-ID</div>
					<div v-if="transaction?.runId" class="flex flex-wrap gap-2">
						<UBadge variant="soft" color="warning" size="lg" class="max-w-full min-w-0 whitespace-normal break-all">
							{{ transaction.runId }}
						</UBadge>
					</div>
				</UCard>

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
							<div class="flex flex-col gap-2 md:items-end">
								<UButton
									color="primary"
									variant="soft"
									:icon="appConfig.ui.icons.plus"
									@click="addLine"
								>
									Tilføj linje
								</UButton>
								<UButton
									v-if="isGroupMode && formState.lines.length > 1"
									color="neutral"
									variant="soft"
									:icon="appConfig.ui.icons.layers"
									@click="collapseAllLines"
								>
									Saml alle linjer
								</UButton>
							</div>
						</div>

						<UAlert
							v-if="hasSumMismatch"
							color="error"
							variant="soft"
							:icon="appConfig.ui.icons.warning"
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
										:icon="appConfig.ui.icons.trash"
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
								v-if="!isGroupMode"
								variant="soft"
								color="primary"
								:icon="appConfig.ui.icons.save"
								:loading="isSavingDraft"
								:disabled="isSubmitting || isSavingDraft || hasSumMismatch || accountingDimensionPending || !!accountingDimensionError"
								@click="handleSaveDraft"
							>
								Gem
							</UButton>
							<UButton
								type="submit"
								color="primary"
								:icon="appConfig.ui.icons.send"
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
