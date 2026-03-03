import { z } from 'zod'

export const cprTypeValues = ['ingen', 'statisk', 'dynamisk'] as const
export type CprType = (typeof cprTypeValues)[number]

const attachmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  data: z.string().min(1),
})

const baseManualBookingShape = {
  primaryAccount: z.string().min(1, 'Primær konto er påkrævet'),
  secondaryAccount: z.string().optional(),
  tertiaryAccount: z.string().optional(),
  text: z.string().optional(),
  cprType: z.enum(cprTypeValues),
  cprNumber: z.string().optional(),
  notifyTo: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email('Ugyldig email').optional(),
  ),
  note: z.string().optional(),
} satisfies z.ZodRawShape

export const manualBookingFormSchema = z.object(baseManualBookingShape)

export const manualBookingPayloadSchema = z.object({
  ...baseManualBookingShape,
  attachments: z.array(attachmentSchema).optional(),
})

export type ManualBookingFormState = z.infer<typeof manualBookingFormSchema>
export type ManualBookingPayloadInput = z.infer<typeof manualBookingPayloadSchema>
