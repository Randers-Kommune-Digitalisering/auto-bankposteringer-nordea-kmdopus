import { computed, reactive, ref, watch, watchEffect } from 'vue'
import type { Ref } from 'vue'
import {
	cprTypeValues,
	manualBookingFormSchema as baseManualBookingFormSchema,
	type CprType,
	type ManualBookingFormState as ManualFormState
} from '#engine/manual-booking/domain/manualBooking'
import type { ManualPostingAttachment, OpenTransaction } from '~/types/transactions'

type AccountingDimensionDefinition = {
	id: string
	key: string
	required: boolean
	sortOrder: number
}

type AccountingDimensionsResponse = {
	erpSupplier: string
	dimensions: AccountingDimensionDefinition[]
}

export type AttachmentPayload = {
	names: string[]
	extensions: string[]
	base64: string[]
}

const defaultState = (transactionAmount?: number): ManualFormState => ({
	lines: [
		{
			amount: typeof transactionAmount === 'number' ? Math.abs(transactionAmount) : 0,
			dimensions: [],
			text: 'Tekst fra bank'
		}
	],
	text: 'Tekst fra bank',
	cprType: 'ingen' as CprType,
	cprNumber: '',
	notifyTo: '',
	note: ''
})

const sanitize = (value?: string): string | undefined => {
	if (value == null) return undefined
	const trimmed = value.trim()
	return trimmed.length ? trimmed : undefined
}

export function useManualBookingForm(options: {
	transaction: Ref<OpenTransaction | null>
	isOpen: Ref<boolean>
}) {
	const formState = reactive<ManualFormState>(defaultState(options.transaction.value?.amount))
	const attachments = ref<AttachmentPayload | null>(null)

	const { data: accountingDimensionConfig } = useFetch<AccountingDimensionsResponse>(
		'/api/settings/accounting-dimensions',
		{ key: 'accounting-dimensions' },
	)

	const accountingDimensionDefinitions = computed<AccountingDimensionDefinition[]>(
		() => accountingDimensionConfig.value?.dimensions ?? [],
	)

	const dimensionValuesByLine = reactive<Array<Record<string, string>>>([])

	const ensureLineDimensionValues = (lineIndex: number): Record<string, string> => {
		if (!dimensionValuesByLine[lineIndex]) {
			dimensionValuesByLine[lineIndex] = reactive<Record<string, string>>({})
		}
		const values = dimensionValuesByLine[lineIndex] as Record<string, string>
		for (const def of accountingDimensionDefinitions.value) {
			if (values[def.key] == null) {
				values[def.key] = ''
			}
		}
		return values
	}

	const syncDimensionsToFormState = () => {
		for (let i = 0; i < formState.lines.length; i++) {
			const line = formState.lines[i]
			if (!line) continue
			const values = ensureLineDimensionValues(i)
			line.dimensions = Object.entries(values)
				.map(([key, value]) => ({ key, value: value.trim() }))
				.filter((d) => d.value.length > 0)
		}
	}

	watchEffect(() => {
		// ensure per-line dimension keys exist
		for (let i = 0; i < formState.lines.length; i++) {
			ensureLineDimensionValues(i)
		}
		syncDimensionsToFormState()
	})

	const attachmentList = computed<ManualPostingAttachment[]>(() => {
		if (!attachments.value) return []
		const result: ManualPostingAttachment[] = []
		const { names, extensions, base64 } = attachments.value
		for (let i = 0; i < base64.length; i++) {
			const name = names[i]
			const type = extensions[i]
			const data = base64[i]
			if (name && type && data) {
				result.push({ name, type, data })
			}
		}
		return result
	})

	const cprTypeOptions = computed(() =>
		cprTypeValues.map((value) => ({
			label: value.charAt(0).toUpperCase() + value.slice(1),
			value
		}))
	)

	const toDisplayLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)

	const manualBookingFormSchema = computed(() =>
		baseManualBookingFormSchema.superRefine((data, ctx) => {
			const defs = accountingDimensionDefinitions.value
			if (!defs.length) return

			for (let lineIndex = 0; lineIndex < (data.lines?.length ?? 0); lineIndex++) {
				const line = data.lines?.[lineIndex]
				const dimensions = line?.dimensions ?? []
				for (const def of defs) {
					if (!def.required) continue
					const hasValue = dimensions.some((d) => d.key === def.key && String(d.value ?? '').trim().length > 0)
					if (!hasValue) {
						ctx.addIssue({
							code: 'custom',
							message: `${toDisplayLabel(def.key)} er påkrævet`,
							path: ['lines', lineIndex, 'dimensions', def.key],
						})
					}
				}
			}
		}),
	)

	const transactionAmountAbs = computed(() =>
		Math.abs(options.transaction.value?.amount ?? 0)
	)

	const totalLinesAmount = computed(() =>
		(formState.lines ?? []).reduce((acc, line) => acc + Math.abs(Number(line.amount) || 0), 0)
	)

	const addLine = () => {
		const remaining = transactionAmountAbs.value - totalLinesAmount.value
		formState.lines.push({
			amount: remaining > 0 ? remaining : 0,
			dimensions: [],
			text: 'Tekst fra bank'
		})
		ensureLineDimensionValues(formState.lines.length - 1)
	}

	const removeLine = (index: number) => {
		if (formState.lines.length <= 1) return
		formState.lines.splice(index, 1)
		dimensionValuesByLine.splice(index, 1)
	}

	const resetForm = () => {
		Object.assign(formState, defaultState(options.transaction.value?.amount))
		attachments.value = null
		dimensionValuesByLine.splice(0, dimensionValuesByLine.length)
		for (let i = 0; i < formState.lines.length; i++) {
			ensureLineDimensionValues(i)
		}
		syncDimensionsToFormState()
	}

	watch(
		() => options.transaction.value?.id,
		() => {
			resetForm()
		},
		{ immediate: true }
	)

	watch(
		() => options.isOpen.value,
		(value) => {
			if (!value) {
				resetForm()
			}
		}
	)

	const handleAttachmentUpdate = (value: AttachmentPayload | null) => {
		attachments.value = value
	}

	const applyManualBookingPayload = (payload: {
		lines: Array<{ amount: number; dimensions?: Array<{ key: string; value: string }>; text?: string | null }>
		text?: string | null
		cprType: CprType
		cprNumber?: string | null
		notifyTo?: string | null
		note?: string | null
		attachments?: ManualPostingAttachment[]
	}) => {
		formState.text = payload.text ?? ''
		formState.cprType = payload.cprType
		formState.cprNumber = payload.cprNumber ?? ''
		formState.notifyTo = payload.notifyTo ?? ''
		formState.note = payload.note ?? ''

		const nextLines = (payload.lines ?? []).length
			? payload.lines
			: [{ amount: transactionAmountAbs.value, dimensions: [] }]

		formState.lines.splice(0, formState.lines.length, ...nextLines.map((l) => ({
			amount: Number(l.amount) || 0,
			dimensions: (l.dimensions ?? []).map((d) => ({ key: d.key, value: d.value })),
			text: l.text ?? 'Tekst fra bank',
		})))

		dimensionValuesByLine.splice(0, dimensionValuesByLine.length)
		for (let i = 0; i < formState.lines.length; i++) {
			ensureLineDimensionValues(i)
			const dims = nextLines[i]?.dimensions ?? []
			const values = ensureLineDimensionValues(i)
			for (const d of dims) {
				if (d?.key) {
					values[d.key] = d.value ?? ''
				}
			}
		}
		syncDimensionsToFormState()

		if (payload.attachments?.length) {
			attachments.value = {
				names: payload.attachments.map((a) => a.name),
				extensions: payload.attachments.map((a) => a.type),
				base64: payload.attachments.map((a) => a.data),
			}
		} else {
			attachments.value = null
		}
	}

	const buildManualBookingPayload = (data: ManualFormState) => {
		const fallbackText = sanitize(data.text) ?? sanitize(data.lines?.[0]?.text)
		return {
		lines: (data.lines ?? []).map((line) => ({
			amount: Number(line.amount) || 0,
			text: sanitize(line.text),
			dimensions: (line.dimensions ?? [])
				.map((d) => ({
					key: sanitize(d.key) ?? '',
					value: sanitize(d.value) ?? '',
				}))
				.filter((d) => d.key.length > 0 && d.value.length > 0)
				.sort((a, b) => a.key.localeCompare(b.key)),
		})),
		text: fallbackText,
		cprType: data.cprType,
		cprNumber: sanitize(data.cprNumber),
		notifyTo: sanitize(data.notifyTo),
		note: sanitize(data.note),
		attachments: attachmentList.value.length ? attachmentList.value : undefined
		}
	}

	return {
		manualBookingFormSchema,
		formState,
		accountingDimensionDefinitions,
		dimensionValuesByLine,
		cprTypeOptions,
		attachmentList,
		transactionAmountAbs,
		totalLinesAmount,
		addLine,
		removeLine,
		handleAttachmentUpdate,
		applyManualBookingPayload,
		buildManualBookingPayload
	}
}
