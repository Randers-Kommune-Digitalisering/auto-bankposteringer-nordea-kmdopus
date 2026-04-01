import { defineEventHandler } from 'h3'
import { requireAuth } from '../auth/keycloakAuth'

export default defineEventHandler(async (event) => {
  const ctx = await requireAuth(event)
  return { roles: ctx.roles, username: ctx.username }
})
