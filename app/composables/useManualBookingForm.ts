import { computed, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { cprTypeValues, type CprType } from '#shared/manualBooking'
import {
	manualBookingFormSchema,
	type ManualBookingFormState as ManualFormState
} from '#shared/manualBooking'
import type { ManualPostingAttachment, OpenTransaction } from '~/types/transactions'

export type AttachmentPayload = {
	names: string[]
	extensions: string[]
	base64: string[]
}

const defaultState = (): ManualFormState => ({
	primaryAccount: '',
	secondaryAccount: '',
	tertiaryAccount: '',
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
		primaryAccount: sanitize(data.primaryAccount) ?? '',
		secondaryAccount: sanitize(data.secondaryAccount),
		tertiaryAccount: sanitize(data.tertiaryAccount),
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
		cprTypeOptions,
		attachmentList,
		handleAttachmentUpdate,
		buildManualBookingPayload
	}
}
