import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  throw createError({ statusCode: 405, statusMessage: 'Bankkonti oprettes automatisk via bankindlæsning' })
})
