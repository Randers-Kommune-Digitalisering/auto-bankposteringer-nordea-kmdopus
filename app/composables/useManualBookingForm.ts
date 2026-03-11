import { computed, reactive, ref, watch, watchEffect } from 'vue'
import type { Ref } from 'vue'
import {
	cprTypeValues,
	manualBookingFormSchema,
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

const defaultState = (): ManualFormState => ({
	dimensions: [],
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
	const formState = reactive<ManualFormState>(defaultState())
	const attachments = ref<AttachmentPayload | null>(null)

	const { data: accountingDimensionConfig } = useFetch<AccountingDimensionsResponse>(
		'/api/settings/accounting-dimensions',
		{ key: 'accounting-dimensions' },
	)

	const accountingDimensionDefinitions = computed<AccountingDimensionDefinition[]>(
		() => accountingDimensionConfig.value?.dimensions ?? [],
	)

	const accountingDimensionValues = reactive<Record<string, string>>({})

	const syncDimensionsToFormState = () => {
		formState.dimensions = Object.entries(accountingDimensionValues)
			.map(([key, value]) => ({ key, value: value.trim() }))
			.filter((d) => d.value.length > 0)
	}

	watchEffect(() => {
		for (const def of accountingDimensionDefinitions.value) {
			if (accountingDimensionValues[def.key] == null) {
				accountingDimensionValues[def.key] = ''
			}
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

	const resetForm = () => {
		Object.assign(formState, defaultState())
		attachments.value = null
		for (const key of Object.keys(accountingDimensionValues)) {
			delete accountingDimensionValues[key]
		}
		for (const def of accountingDimensionDefinitions.value) {
			accountingDimensionValues[def.key] = ''
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

	const buildManualBookingPayload = (data: ManualFormState) => ({
		dimensions: (data.dimensions ?? []).map((d) => ({
			key: sanitize(d.key) ?? '',
			value: sanitize(d.value) ?? '',
		})).filter((d) => d.key.length > 0 && d.value.length > 0),
		text: sanitize(data.text),
		cprType: data.cprType,
		cprNumber: sanitize(data.cprNumber),
		notifyTo: sanitize(data.notifyTo),
		note: sanitize(data.note),
		attachments: attachmentList.value.length ? attachmentList.value : undefined
	})

	return {
		manualBookingFormSchema,
		formState,
		accountingDimensionDefinitions,
		accountingDimensionValues,
		cprTypeOptions,
		attachmentList,
		handleAttachmentUpdate,
		buildManualBookingPayload
	}
}
