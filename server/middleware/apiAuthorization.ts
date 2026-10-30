import { defineEventHandler, getRequestURL } from 'h3'
import { requireAnyAppRole } from '~~/server/auth/requireAppRoles'
import { getApiRequiredRoles } from '~~/server/auth/apiAuthorizationPolicy'

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)
  if (!pathname.startsWith('/api/')) return

  const requiredRoles = getApiRequiredRoles(pathname, event.method)
  if (requiredRoles) {
    await requireAnyAppRole(event, requiredRoles)
  }
})