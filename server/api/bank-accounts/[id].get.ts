import { eq } from 'drizzle-orm'
import { account } from '~/lib/db/schema/index'
import db from '~/lib/db'
import { createError, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, max-age=60')

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing account ID' })
  }

  try {
    const account = await db.query.account.findFirst({
      where: (fields) => eq(fields.id, id)
    })

    if (!account) {
      throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }

    return account
  } catch (err) {
    console.error('Failed fetching account:', err)
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }
})
