import { computed, reactive, ref, watch, watchEffect } from 'vue'
import type { Ref } from 'vue'
import {
	cprTypeValues,
	manualBookingFormSchema as baseManualBookingFormSchema,
	type CprType,
	type ManualBookingFormState as ManualFormState
} from '#engine/manual-booking/domain/manualBooking'
import type { ManualPostingAttachment, OpenTransaction } from '~/types/transactions'
import { accountingDimensionFormatHint } from '~/lib/presenters/accountingDimensionFormatHints'

type AccountingDimensionConstraint = {
	id: string
	ifKey: string
	kind: 'requires_any_of' | 'requires_all_of' | 'requires_exactly_one_of' | 'forbids_any_of'
	members: string[]
	ifValueRegex?: string | null
}

type AccountingDimensionDefinition = {
	id: string
	key: string
	required: boolean
	sortOrder: number
	valueRegex?: string | null
	valueRegexFlags?: string | null
}

type AccountingDimensionsResponse = {
	erpSupplier: string
	dimensions: AccountingDimensionDefinition[]
	constraints: AccountingDimensionConstraint[]
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

	const accountingDimensionConstraints = computed<AccountingDimensionConstraint[]>(
		() => accountingDimensionConfig.value?.constraints ?? [],
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

	const constraintLabel = (key: string) => toDisplayLabel(key)

	const manualBookingFormSchema = computed(() =>
		baseManualBookingFormSchema.superRefine((data, ctx) => {
			const defs = accountingDimensionDefinitions.value
			if (!defs.length) return
			const defByKey = new Map(defs.map(d => [d.key, d] as const))

			for (let lineIndex = 0; lineIndex < (data.lines?.length ?? 0); lineIndex++) {
				const line = data.lines?.[lineIndex]
				const dimensions = line?.dimensions ?? []

				// Format validation per dimension (data-driven)
				for (const d of dimensions) {
					const def = defByKey.get(d.key)
					if (!def?.valueRegex) continue
					const flags = def.valueRegexFlags ?? ''
					try {
						const re = new RegExp(def.valueRegex, flags)
						if (!re.test(String(d.value ?? '').trim())) {
							ctx.addIssue({
								code: 'custom',
								message: `${toDisplayLabel(def.key)} har ugyldigt format` + (() => {
									const hint = accountingDimensionFormatHint(def.key)
									return hint ? ` (${hint})` : ''
								})(),
								path: ['lines', lineIndex, 'dimensions', def.key],
							})
						}
					} catch {
						ctx.addIssue({
							code: 'custom',
							message: `Ugyldig regex for konteringsdimension '${def.key}': ${def.valueRegex}`,
							path: ['lines', lineIndex, 'dimensions', def.key],
						})
					}
				}
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

				// ERP dimension constraints (same semantics as backend)
				const valueByKey = new Map(
					dimensions
						.map((d) => [d.key, String(d.value ?? '').trim()] as const)
						.filter(([, v]) => v.length > 0),
				)
				const keys = new Set(valueByKey.keys())
				const constraintsByIfKey = new Map<string, AccountingDimensionConstraint[]>()
				for (const c of accountingDimensionConstraints.value) {
					const bucket = constraintsByIfKey.get(c.ifKey) ?? []
					bucket.push(c)
					constraintsByIfKey.set(c.ifKey, bucket)
				}

				for (const [ifKey, group] of constraintsByIfKey.entries()) {
					if (!keys.has(ifKey)) continue

					const v = valueByKey.get(ifKey) ?? ''
					const regexConstraints = group.filter(c => (c.ifValueRegex ?? null) != null)
					let matchingRegex: AccountingDimensionConstraint[] = []

					for (const c of regexConstraints) {
						try {
							const re = new RegExp(c.ifValueRegex as string)
							if (re.test(v)) matchingRegex.push(c)
						} catch {
							ctx.addIssue({
								code: 'custom',
								message: `Ugyldig regex i konteringsconstraint: ${c.ifValueRegex}`,
								path: ['lines', lineIndex, 'dimensions', ifKey],
							})
							matchingRegex = []
							break
						}
					}

					const applicable = matchingRegex.length
						? matchingRegex
						: group.filter(c => (c.ifValueRegex ?? null) == null)

					for (const c of applicable) {

						if (c.kind === 'requires_any_of') {
						const ok = c.members.some(m => keys.has(m))
						if (!ok) {
								for (const member of c.members) {
									ctx.addIssue({
										code: 'custom',
										message: `Udfyld mindst én af: ${c.members.map(constraintLabel).join(' / ')} (når ${constraintLabel(c.ifKey)} er udfyldt)`,
										path: ['lines', lineIndex, 'dimensions', member],
									})
								}
						}
							continue
						}

						if (c.kind === 'requires_all_of') {
						const missing = c.members.filter(m => !keys.has(m))
						if (missing.length) {
								for (const member of missing) {
									ctx.addIssue({
										code: 'custom',
										message: `Udfyld også ${constraintLabel(member)} (når ${constraintLabel(c.ifKey)} er udfyldt)`,
										path: ['lines', lineIndex, 'dimensions', member],
									})
								}
						}
							continue
						}

						if (c.kind === 'requires_exactly_one_of') {
						const present = c.members.filter(m => keys.has(m))
						if (present.length === 0) {
								for (const member of c.members) {
									ctx.addIssue({
										code: 'custom',
										message: `Udfyld enten ${constraintLabel(c.members[0] ?? '')} eller ${constraintLabel(c.members[1] ?? '')} (ikke begge)`,
										path: ['lines', lineIndex, 'dimensions', member],
									})
								}
						} else if (present.length > 1) {
								for (const member of present) {
									ctx.addIssue({
										code: 'custom',
										message: `Udfyld kun ét af felterne: ${c.members.map(constraintLabel).join(' / ')}`,
										path: ['lines', lineIndex, 'dimensions', member],
									})
								}
						}
						}

						if (c.kind === 'forbids_any_of') {
						const present = c.members.filter(m => keys.has(m))
						if (present.length) {
								for (const member of present) {
									ctx.addIssue({
										code: 'custom',
										message: `${constraintLabel(member)} må ikke udfyldes sammen med ${constraintLabel(c.ifKey)}`,
										path: ['lines', lineIndex, 'dimensions', member],
									})
								}
						}
						}
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
