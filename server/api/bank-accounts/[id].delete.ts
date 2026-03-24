import { createError, defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  throw createError({ statusCode: 405, statusMessage: 'Bankkonti håndteres automatisk via bankindlæsning' })
})
