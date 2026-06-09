import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'

import { requireRoles } from '~~/server/auth/keycloakAuth'
import { createKeycloakAdminClient, resolveRolesByName } from '~~/server/auth/keycloakAdminClient'

const roleBodySchema = z.object({
	roleNames: z.array(z.string().trim().min(1)).min(1),
})

const addMemberBodySchema = z.object({
	userId: z.string().trim().min(1).optional(),
	email: z.email().optional(),
}).superRefine((value, ctx) => {
	const hasUserId = Boolean(value.userId)
	const hasEmail = Boolean(value.email)
	if (hasUserId === hasEmail) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'Angiv præcist én af userId eller email',
			path: ['userId'],
		})
	}
})

const bodySchema = z.union([roleBodySchema, addMemberBodySchema])

export default defineEventHandler(async (event) => {
	await requireRoles(event, ['sys_admin'])

	const groupId = event.context.params?.groupid
	if (!groupId) throw createError({ statusCode: 400, statusMessage: 'Manglende groupid' })

	const parsed = bodySchema.safeParse(await readBody(event))
	if (!parsed.success) {
		throw createError({ statusCode: 400, statusMessage: 'Ugyldig request body', data: parsed.error.flatten() })
	}

	const client = createKeycloakAdminClient()

	if ('roleNames' in parsed.data) {
		const allRoles = await client.listClientRoles()
		const toAdd = resolveRolesByName(allRoles, parsed.data.roleNames)
		await client.addGroupClientRoles(groupId, toAdd)

		const updated = await client.listGroupClientRoles(groupId)
		return {
			success: true,
			mode: 'add-roles',
			groupId,
			roleNames: updated.map(r => r.name).filter((v): v is string => typeof v === 'string' && v.length > 0),
		}
	}

	let userId = parsed.data.userId
	if (!userId) {
		const email = parsed.data.email as string
		const users = await client.findUsersByEmail(email)
		const exactUsers = users.filter(u => (u.email ?? '').toLowerCase() === email.toLowerCase())
		if (exactUsers.length !== 1 || !exactUsers[0]?.id) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Bruger blev ikke fundet entydigt på email',
				data: { matches: exactUsers.length },
			})
		}
		userId = exactUsers[0].id
	}

	await client.addUserToGroup(userId, groupId)

	const updatedGroups = await client.listUserGroups(userId)
	return {
		success: true,
		mode: 'add-member',
		groupId,
		userId,
		groupIds: updatedGroups.map(g => g.id),
	}
})
