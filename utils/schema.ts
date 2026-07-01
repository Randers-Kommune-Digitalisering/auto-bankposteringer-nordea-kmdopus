import { z } from 'zod'

export const ibanSchema = z
  .string()
  .min(15)
  .max(34)
  .superRefine((iban, ctx) => {
    const normalized = iban.replace(/\s+/g, '').toUpperCase()
    if (normalized.startsWith('DK')) {
      if (!/^DK\d{16}$/.test(normalized)) {
        ctx.addIssue({ code: 'custom', message: 'Ugyldig IBAN' })
      }
      return
    }
    if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(normalized)) {
      ctx.addIssue({ code: 'custom', message: 'Ugyldig IBAN' })
    }
  })