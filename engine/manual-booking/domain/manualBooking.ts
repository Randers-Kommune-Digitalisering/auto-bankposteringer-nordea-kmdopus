import { z } from 'zod'

export const cprTypeValues = ['ingen', 'statisk', 'dynamisk'] as const
export type CprType = (typeof cprTypeValues)[number]

const attachmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  data: z.string().min(1),
})

const accountingDimensionSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
})

const bookingLineSchema = z.object({
  amount: z.number().finite(),
  dimensions: z.array(accountingDimensionSchema).optional(),
  text: z.string().optional(),
})

const baseManualBookingShape = {
  lines: z.array(bookingLineSchema).min(1),
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
