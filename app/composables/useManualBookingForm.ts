import { computed, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { z } from 'zod'
import { cprTypeValues, type CprType } from '~/lib/db/schema'
import type { ManualPostingAttachment, OpenTransaction } from '~/types/transactions'

export type AttachmentPayload = {	extensions: string[]
	base64: string[]
}

export const manualBookingFormSchema = z
	.object({
		primaryAccount: z.string().min(1, 'Primær konto er påkrævet'),
		secondaryAccount: z.string().optional(),
		tertiaryAccount: z.string().optional(),
		text: z.string().optional(),
		cprType: z.enum(cprTypeValues),
		cprNumber: z.string().optional(),
		notifyTo: z.string().email('Ugyldig email').optional(),
		note: z.string().optional()
	})
	.superRefine((data, ctx) => {
		if (data.cprType === 'statisk' && !data.cprNumber?.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'CPR-nummer er påkrævet, når CPR-type er statisk',
				path: ['cprNumber']
			})
		}
	})

export type ManualFormState = z.infer<typeof manualBookingFormSchema>

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
			if (names[i] && extensions[i] && base64[i]) {
				result.push({ name: names[i], type: extensions[i], data: base64[i] })
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
