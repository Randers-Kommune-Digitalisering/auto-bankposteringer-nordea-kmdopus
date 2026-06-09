import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'

import { requireRoles } from '~~/server/auth/keycloakAuth'
import { createKeycloakAdminClient, resolveRolesByName } from '~~/server/auth/keycloakAdminClient'

const bodySchema = z.object({
	roleNames: z.array(z.string().trim().min(1)).default([]),
})

export default defineEventHandler(async (event) => {
	await requireRoles(event, ['sys_admin'])

	const userId = event.context.params?.userid
	if (!userId) throw createError({ statusCode: 400, statusMessage: 'Manglende userid' })

	const parsed = bodySchema.safeParse(await readBody(event))
	if (!parsed.success) {
		throw createError({ statusCode: 400, statusMessage: 'Ugyldig request body', data: parsed.error.flatten() })
	}

	const client = createKeycloakAdminClient()
	const [allRoles, currentRoles] = await Promise.all([
		client.listClientRoles(),
		client.listUserClientRoles(userId),
	])

	const requested = resolveRolesByName(allRoles, parsed.data.roleNames)
	const requestedNames = new Set(requested.map(r => r.name))
	const currentNames = new Set(currentRoles.map(r => r.name))

	const toAdd = requested.filter(r => !currentNames.has(r.name))
	const toRemove = currentRoles.filter(r => !requestedNames.has(r.name))

	await Promise.all([
		toAdd.length ? client.addUserClientRoles(userId, toAdd) : Promise.resolve(),
		toRemove.length ? client.removeUserClientRoles(userId, toRemove) : Promise.resolve(),
	])

	const updated = await client.listUserClientRoles(userId)
	return {
		success: true,
		userId,
		roleNames: updated.map(r => r.name).filter((v): v is string => typeof v === 'string' && v.length > 0),
	}
})
