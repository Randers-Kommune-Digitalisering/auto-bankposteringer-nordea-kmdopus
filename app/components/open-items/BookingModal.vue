<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { nextTick, onBeforeUnmount, watch } from 'vue'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import RulesFileUpload from '~/components/rules/FileUpload.vue'
import { useManualBookingForm } from '~/composables/useManualBookingForm'
import { MANUAL_BOOKING_LOCK_RENEW_INTERVAL_MS } from '#engine/manual-booking/domain/bookingLease'
import type { OpenTransaction, TransactionSummary } from '~/types/transactions'
import type {
	ManualBookingFormState as ManualFormState,
	ManualBookingPayloadInput,
} from '#engine/manual-booking/domain/manualBooking'

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

type ComparableManualBookingPayload = ReturnType<typeof buildManualBookingPayload> &
	Pick<ManualBookingPayloadInput, 'confirmClosedPeriodRebooking'>

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
const closedPeriodWarning = ref<{ originalBookingDate: string; effectiveBookingDate: string } | null>(null)
const pendingClosedPeriodPayload = ref<ComparableManualBookingPayload | null>(null)
const bookingLockState = ref<'idle' | 'pending' | 'owned' | 'conflict' | 'error'>('idle')
const bookingLockOwnerName = ref('')
const bookingLockError = ref('')
const isBookingReadOnly = computed(() => bookingLockState.value !== 'owned')
let bookingLockHeartbeat: ReturnType<typeof setInterval> | undefined
let activeBookingLockTransactionId: string | null = null
let bookingLockGeneration = 0

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
const groupTransactions = computed<OpenTransaction[]>(() => props.groupTransactions ?? [])
const isGroupMode = computed(() => groupTransactions.value.length > 1)
const groupTransactionIds = computed(() => groupTransactions.value.map((entry) => entry.id))
const largeGroupThreshold = 100
const isGroupExpanded = ref(false)
const isExpandingGroup = ref(false)
const isGroupLinesOpen = ref(false)

const groupTotalAmount = computed(() =>
	groupTransactions.value.reduce((sum, entry) => sum + Math.abs(Number(entry.amount) || 0), 0),
)
const isLargeGroup = computed(() => groupTransactions.value.length > largeGroupThreshold)

function stopBookingLockHeartbeat() {
	if (bookingLockHeartbeat) {
		clearInterval(bookingLockHeartbeat)
		bookingLockHeartbeat = undefined
	}
}

async function postBookingLockAction(transactionId: string, action: 'acquire' | 'renew' | 'release') {
	return await $fetch<{ acquired?: boolean; ownerName?: string }>(`/api/transactions/${transactionId}/lock`, {
		method: 'POST',
		body: { action },
	})
}

async function releaseBookingLock(transactionId: string) {
	try {
		await postBookingLockAction(transactionId, 'release')
	} catch {
		// The persisted lease expires if the release request cannot reach the server.
	}
}

async function renewBookingLock(transactionId: string, generation: number) {
	try {
		const result = await postBookingLockAction(transactionId, 'renew')
		if (generation !== bookingLockGeneration) return
		if (result.acquired) return

		bookingLockOwnerName.value = result.ownerName || 'anden bruger'
		bookingLockState.value = 'conflict'
		stopBookingLockHeartbeat()
	} catch {
		if (generation !== bookingLockGeneration) return
		bookingLockError.value = 'Låsestatus kunne ikke bekræftes. Luk og åbn posten igen.'
		bookingLockState.value = 'error'
		stopBookingLockHeartbeat()
	}
}

watch(
	() => [open.value, transaction.value?.id] as const,
	async ([isOpen, transactionId]) => {
		const generation = ++bookingLockGeneration
		stopBookingLockHeartbeat()
		const previousLockId = activeBookingLockTransactionId
		activeBookingLockTransactionId = null
		if (previousLockId) await releaseBookingLock(previousLockId)
		if (generation !== bookingLockGeneration) return

		bookingLockOwnerName.value = ''
		bookingLockError.value = ''
		if (!isOpen || !transactionId) {
			bookingLockState.value = 'idle'
			return
		}

		bookingLockState.value = 'pending'
		try {
			const result = await postBookingLockAction(transactionId, 'acquire')
			if (generation !== bookingLockGeneration) {
				if (result.acquired) void releaseBookingLock(transactionId)
				return
			}
			if (!result.acquired) {
				bookingLockOwnerName.value = result.ownerName || 'anden bruger'
				bookingLockState.value = 'conflict'
				return
			}

			activeBookingLockTransactionId = transactionId
			bookingLockState.value = 'owned'
			bookingLockHeartbeat = setInterval(() => {
				void renewBookingLock(transactionId, generation)
			}, MANUAL_BOOKING_LOCK_RENEW_INTERVAL_MS)
		} catch (error: any) {
			if (generation !== bookingLockGeneration) return
			bookingLockError.value = error?.data?.message ?? 'Låsestatus kunne ikke indlæses.'
			bookingLockState.value = 'error'
		}
	},
	{ immediate: true },
)

onBeforeUnmount(() => {
	bookingLockGeneration++
	stopBookingLockHeartbeat()
	if (activeBookingLockTransactionId) void releaseBookingLock(activeBookingLockTransactionId)
})

const dimensionLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)

const currency = new Intl.NumberFormat('da-DK', {
	style: 'currency',
	currency: 'DKK'
})

function formatSignedAmount(amount: number): string {
	const value = Number(amount) || 0
	if (value < 0) return `-${currency.format(Math.abs(value))}`
	if (value > 0) return `+${currency.format(value)}`
	return currency.format(0)
}

type SourceValue = {
	value: string
	source: string
}

function toSourceTokens(entry: OpenTransaction): SourceValue[] {
	const details = Array.isArray(entry.referenceDetails) ? entry.referenceDetails : []
	const tokens: SourceValue[] = []

	for (const detail of details) {
		const source = String(detail?.source ?? '').trim() || 'Ukendt XML-felt'
		for (const rawToken of String(detail?.value ?? '').split(';')) {
			const value = rawToken.trim()
			if (!value.length) continue
			tokens.push({ value, source })
		}
	}

	return tokens
}

function extractTriad500Values(entry: OpenTransaction): string[] {
	const values: string[] = []
	const seen = new Set<string>()

	for (const token of toSourceTokens(entry)) {
		if (!token.source.toLowerCase().endsWith('/addtlntryinf')) continue
		const match = /^500:[^:]*:(.*)$/i.exec(token.value)
		const value = String(match?.[1] ?? '').trim()
		if (!value.length) continue
		const dedupeKey = value.toLowerCase()
		if (seen.has(dedupeKey)) continue
		seen.add(dedupeKey)
		values.push(value)
	}

	return values
}

function extractRmtInfValues(entry: OpenTransaction): SourceValue[] {
	const values: SourceValue[] = []
	const seen = new Set<string>()

	for (const token of toSourceTokens(entry)) {
		const source = token.source.toLowerCase()
		const isRmtInf = source.includes('/rmtinf/') || source.includes('/purp/prtry')
		if (!isRmtInf) continue

		const dedupeKey = `${token.value.toLowerCase()}|${source}`
		if (seen.has(dedupeKey)) continue
		seen.add(dedupeKey)
		values.push(token)
	}

	return values
}

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

function collapsedGroupPayload() {
	return {
		lines: [{
			amount: groupTotalAmount.value,
			text: '',
			dimensions: [],
		}],
		text: '',
		cprType: 'ingen' as const,
		cprNumber: '',
		note: '',
	}
}

async function expandGroupLines() {
	if (isBookingReadOnly.value || !isGroupMode.value || isGroupExpanded.value || isExpandingGroup.value) return

	if (isLargeGroup.value && process.client) {
		const confirmed = window.confirm(
			`Samleposten indeholder ${groupTransactions.value.length} linjer. Hvis linjerne spredes ud, kan det forringe sidens performance betydeligt. Vil du fortsætte?`,
		)
		if (!confirmed) return
	}

	isExpandingGroup.value = true
	try {
		applyManualBookingPayload({
			lines: groupTransactions.value.map((entry) => ({
				amount: Math.abs(Number(entry.amount) || 0),
				text: '',
				dimensions: [],
			})),
			text: '',
			cprType: 'ingen' as const,
			cprNumber: '',
			note: '',
		})
		isGroupExpanded.value = true
		await nextTick()
	} finally {
		isExpandingGroup.value = false
	}
}

watch(
	() => [open.value, transaction.value?.id] as const,
	async ([isOpen, txId]) => {
		if (!isOpen || !txId) return
		if (isGroupMode.value) {
			isGroupExpanded.value = false
			applyManualBookingPayload(collapsedGroupPayload())
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
	if (!transaction.value || isBookingReadOnly.value) return
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
	await submitBooking(payload)
}

async function submitBooking(payload: ComparableManualBookingPayload) {
	if (isBookingReadOnly.value) return
	const isGroup = isGroupMode.value
	const transactionId = transaction.value?.id
	if (!isGroup && !transactionId) return
	try {
		isSubmitting.value = true
		if (isGroup) {
			await $fetch('/api/transactions/group/process', {
				method: 'POST',
				body: {
					transactionIds: groupTransactionIds.value,
					payload,
				},
			})
		} else if (transactionId) {
			await $fetch(`/api/transactions/${transactionId}/process`, {
				method: 'POST',
				body: payload
			})
		}
		toast.add({
			title: 'Postering sendt',
			description: isGroup
				? `Samlepost med ${groupTransactionIds.value.length} transaktioner er sendt til ERP`
				: `Transaktion ${transactionId} er sendt til ERP`,
			color: 'primary'
		})
		await refreshNuxtData('open-transactions')
		savedSnapshot.value = currentSnapshot.value
		emit('processed')
	} catch (error: any) {
		const warning = error?.data?.data?.code === 'BOOKING_PERIOD_CLOSED'
		if (warning && !payload.confirmClosedPeriodRebooking) {
			pendingClosedPeriodPayload.value = payload
			closedPeriodWarning.value = {
				originalBookingDate: error.data.data.originalBookingDate,
				effectiveBookingDate: error.data.data.effectiveBookingDate,
			}
			return
		}
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

async function confirmClosedPeriodRebooking() {
	const payload = pendingClosedPeriodPayload.value
	closedPeriodWarning.value = null
	pendingClosedPeriodPayload.value = null
	if (!payload) return
	await submitBooking({ ...payload, confirmClosedPeriodRebooking: true })
}

async function handleSaveDraft() {
	if (isBookingReadOnly.value || isGroupMode.value) return
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
	if (isBookingReadOnly.value || !isGroupMode.value) return
	if ((formState.lines?.length ?? 0) <= 1) {
		isGroupExpanded.value = false
		return
	}

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
				text: firstLineText ?? '',
				dimensions: [],
			},
		],
	})
	isGroupExpanded.value = false

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
					v-if="bookingLockState === 'conflict'"
					color="warning"
					variant="soft"
					:icon="appConfig.ui.icons.lock"
					:title="`Posten behandles af ${bookingLockOwnerName}`"
					description="Posten vises i læsetilstand. Kontakt brugeren, hvis vedkommende skal afslutte redigeringen."
				/>
				<UAlert
					v-else-if="bookingLockState === 'pending'"
					color="neutral"
					variant="soft"
					title="Kontrollerer bookinglås"
					description="Posten kan ikke ændres, før låsestatus er bekræftet."
				/>
				<UAlert
					v-else-if="bookingLockState === 'error'"
					color="error"
					variant="soft"
					:icon="appConfig.ui.icons.warning"
					title="Bookinglåsen kunne ikke bekræftes"
					:description="bookingLockError"
				/>
				<UAlert
					v-if="isGroupMode"
					variant="soft"
					color="primary"
					:icon="appConfig.ui.icons.layers"
					:title="`Samlepost med ${groupTransactionIds.length} transaktioner`"
					:description="isGroupExpanded
						? 'Linjerne er spredt ud, så de kan justeres individuelt før afsendelse.'
						: 'Samleposten er samlet til én bogføringslinje. Spred kun linjerne ud, hvis individuel justering er nødvendig.'"
				>
					<template #actions>
						<UButton
							v-if="!isGroupExpanded"
							size="xs"
							variant="solid"
							color="primary"
							:icon="appConfig.ui.icons.layers"
							:loading="isExpandingGroup"
							:disabled="isBookingReadOnly"
							@click="expandGroupLines"
						>
							Spred linjer
						</UButton>
						<UButton
							size="xs"
							variant="soft"
							color="primary"
							:icon="appConfig.ui.icons.arrowRight"
							@click="() => { isGroupLinesOpen = true }"
						>
							Vis linjer
						</UButton>
					</template>
				</UAlert>
				<UAlert
					v-if="accountingDimensionError"
					variant="soft"
					color="error"
					title="Konteringsdimensioner"
					description="Kunne ikke indlæse konteringsdimensioner. Prøv at genindlæse siden."
				/>
				<BookingSummaryCard v-if="summary" :summary="summary" />

				<UCard v-if="transaction?.id || transaction?.runId" variant="soft" :ui="{ body: 'space-y-3 p-4' }">

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
						:disabled="isSubmitting || isSavingDraft || isBookingReadOnly"
						class="space-y-4 w-full"
						@submit="handleSubmit"
					>
						<fieldset :disabled="isSubmitting || isSavingDraft || isBookingReadOnly" class="contents">
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
									:disabled="isBookingReadOnly"
									@click="addLine"
								>
									Tilføj linje
								</UButton>
								<UButton
									v-if="isGroupMode && formState.lines.length > 1"
									color="neutral"
									variant="soft"
									:icon="appConfig.ui.icons.layers"
									:disabled="isBookingReadOnly"
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
										:disabled="isBookingReadOnly"
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
						</UCard>

						<RulesFileUpload @update="(value) => { if (!isBookingReadOnly) handleAttachmentUpdate(value) }" />

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
								:disabled="isBookingReadOnly || isSubmitting || isSavingDraft || hasSumMismatch || accountingDimensionPending || !!accountingDimensionError"
							>
								Send til ERP
							</UButton>
						</div>
						</fieldset>
					</UForm>
				</div>
		</template>
	</UModal>

	<UModal v-model:open="isGroupLinesOpen" title="Linjer i samlepost" :ui="{ body: 'space-y-3' }">
		<template #body>
			<div v-if="!groupTransactions.length" class="text-sm text-muted">Ingen linjer at vise.</div>
			<div v-else class="max-h-[60vh] space-y-2 overflow-auto pr-1">
				<div
					v-for="entry in groupTransactions"
					:key="entry.id"
					class="rounded-md border border-default/70 bg-default px-3 py-2"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="text-sm font-medium">{{ formatSignedAmount(entry.amount) }}</div>
						<UBadge variant="soft" color="neutral" size="sm">{{ entry.id }}</UBadge>
					</div>
					<div class="mt-1 text-xs text-muted">{{ entry.counterpart ?? '-' }}</div>

					<div class="mt-2 space-y-2">
						<div class="text-[11px] font-semibold uppercase tracking-wide text-muted">Reference (500)</div>
						<div v-if="extractTriad500Values(entry).length" class="space-y-1">
							<UBadge
								v-for="(value, index) in extractTriad500Values(entry)"
								:key="`triad500-${entry.id}-${index}`"
								variant="soft"
								color="success"
								size="sm"
								class="block max-w-full whitespace-normal break-all"
							>
								{{ value }}
							</UBadge>
						</div>
						<div v-else class="text-xs text-muted">-</div>

						<div class="text-[11px] font-semibold uppercase tracking-wide text-muted">RmtInf</div>
						<div v-if="extractRmtInfValues(entry).length" class="space-y-1">
							<UBadge
								v-for="(token, index) in extractRmtInfValues(entry)"
								:key="`rmtinf-${entry.id}-${index}`"
								variant="soft"
								color="secondary"
								size="sm"
								:title="token.source"
								class="block max-w-full whitespace-normal break-all"
							>
								{{ token.value }}
							</UBadge>
						</div>
						<div v-else class="text-xs text-muted">-</div>
					</div>
				</div>
			</div>
		</template>
	</UModal>

	<UModal :open="!!closedPeriodWarning" title="Bogføringsperioden er afsluttet" @update:open="(value) => { if (!value) closedPeriodWarning = null }">
		<template #body>
			<div class="space-y-4">
				<p class="text-sm text-muted">
					Posteringen har bogføringsdato {{ closedPeriodWarning?.originalBookingDate }}, som ligger i en afsluttet periode.
				</p>
				<p class="text-sm text-muted">
					Hvis du fortsætter, bliver den bogført med dato {{ closedPeriodWarning?.effectiveBookingDate }}.
				</p>
				<div class="flex justify-end gap-2">
					<UButton color="neutral" variant="soft" @click="() => { closedPeriodWarning = null }">
						Annuller
					</UButton>
					<UButton color="primary" :loading="isSubmitting" @click="confirmClosedPeriodRebooking">
						Fortsæt med dags dato
					</UButton>
				</div>
			</div>
		</template>
	</UModal>
</template>
