import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'

import { requireRoles } from '~~/server/auth/keycloakAuth'
import { createKeycloakAdminClient, resolveRolesByName } from '~~/server/auth/keycloakAdminClient'

const bodySchema = z.object({
	roleNames: z.array(z.string().trim().min(1)).min(1),
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
	const allRoles = await client.listClientRoles()
	const toRemove = resolveRolesByName(allRoles, parsed.data.roleNames)
	await client.removeUserClientRoles(userId, toRemove)

	const updated = await client.listUserClientRoles(userId)
	return {
		success: true,
		userId,
		roleNames: updated.map(r => r.name).filter((v): v is string => typeof v === 'string' && v.length > 0),
	}
})
