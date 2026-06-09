import { createError, defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'

import { requireRoles } from '~~/server/auth/keycloakAuth'
import { createKeycloakAdminClient } from '~~/server/auth/keycloakAdminClient'

const querySchema = z.object({
	max: z.coerce.number().int().min(1).max(500).optional().default(100),
	first: z.coerce.number().int().min(0).optional().default(0),
	includeRoleMappings: z
		.union([z.literal('0'), z.literal('1'), z.literal('true'), z.literal('false')])
		.optional()
		.default('1')
		.transform(v => v === '1' || v === 'true'),
})

export default defineEventHandler(async (event) => {
	await requireRoles(event, ['sys_admin'])

	const parsed = querySchema.safeParse(getQuery(event))
	if (!parsed.success) {
		throw createError({ statusCode: 400, statusMessage: 'Ugyldig query', data: parsed.error.flatten() })
	}

	const { max, first, includeRoleMappings } = parsed.data
	const client = createKeycloakAdminClient()

	const [clientRoles, users, groups] = await Promise.all([
		client.listClientRoles(),
		client.listUsers(max, first),
		client.listGroups(max, first),
	])

	const usersWithMappings = includeRoleMappings
		? await Promise.all(
				users.map(async (user) => {
					const [userRoles, userGroups] = await Promise.all([
						client.listUserClientRoles(user.id),
						client.listUserGroups(user.id),
					])

					return {
						...user,
						roleNames: userRoles.map(r => r.name).filter(Boolean),
						groups: userGroups.map(g => ({ id: g.id, name: g.name, path: g.path })),
					}
				}),
			)
		: users.map(user => ({ ...user }))

	const groupsWithMappings = includeRoleMappings
		? await Promise.all(
				groups.map(async (group) => {
					const groupRoles = await client.listGroupClientRoles(group.id)
					return {
						...group,
						roleNames: groupRoles.map(r => r.name).filter(Boolean),
					}
				}),
			)
		: groups.map(group => ({ ...group }))

	return {
		realm: client.realm,
		clientId: client.targetClientId,
		users: usersWithMappings,
		groups: groupsWithMappings,
		roles: clientRoles.map(role => ({
			id: role.id,
			name: role.name,
			description: role.description,
			composite: role.composite ?? false,
		})),
	}
})
