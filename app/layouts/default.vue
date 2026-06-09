<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import { requiredRolesForPath } from '~/lib/authz/policy'
import type { AppRole } from '~/lib/authz/roles'

const { loggedIn, user, logout } = useOidcAuth()
const { loaded, refresh, hasAny } = useAuthz()

const open = ref(false)

const route = useRoute()

if (!loaded.value) {
  refresh()
}

function normalizePath(path: string): string {
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path
  try {
    return decodeURI(trimmed)
  } catch {
    return trimmed
  }
}

function findLabelByPath(items: NavigationMenuItem[] | undefined, path: string): string | undefined {
  const normalizedPath = normalizePath(path)

  for (const item of items ?? []) {
    const itemPath = typeof item.to === 'string' ? normalizePath(item.to) : undefined

    if (itemPath && itemPath === normalizedPath) {
      return item.label
    }

    if (item.children?.length) {
      const childLabel = findLabelByPath(item.children as NavigationMenuItem[], path)
      if (childLabel) {
        return childLabel
      }
    }

    if (itemPath && itemPath !== '/' && normalizedPath.startsWith(`${itemPath}/`)) {
      return item.label
    }
  }
}

const primaryLinks = [
  {
    label: 'Dashboard',
    icon: 'solar:clipboard-bold-duotone',
    to: '/',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Konteringsregler',
    icon: 'solar:notebook-bookmark-bold-duotone',
    to: '/konteringsregler',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Åbne poster',
    icon: 'solar:inbox-bold-duotone',
    to: '/aabne-poster',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Kontoudtog',
    icon: 'solar:card-transfer-bold-duotone',
    to: '/kontoudtog',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Kørsler',
    icon: 'solar:alarm-bold-duotone',
    to: '/koersler',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Indstillinger',
    to: '/indstillinger',
    icon: 'solar:settings-bold-duotone',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Regeladministration',
        to: '/indstillinger/regler',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Tags',
        to: '/indstillinger/tags',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Bankintegration',
        to: '/indstillinger/bank',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'ERP-integration',
        to: '/indstillinger/erp',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Notifikation',
        to: '/indstillinger/notifikation',
        onSelect: () => {
          open.value = false
        }
      },
    ]
  },
  {
    label: 'Fejlhåndtering',
    to: '/fejlhaandtering',
    icon: 'solar:shield-warning-bold-duotone',
    type: 'trigger',
    children: [
      {
        label: 'Kø og genkørsel',
        to: '/fejlhaandtering/koe',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'ERP-afvisninger',
        to: '/fejlhaandtering/erp',
        onSelect: () => {
          open.value = false
        }
      }
    ]
  }
] satisfies NavigationMenuItem[]

const userLabel = computed(() => {
  return user.value?.userName
    ?? (user.value?.userInfo?.preferred_username as string | undefined)
    ?? 'Bruger'
})

const links = computed(() => {
  const visiblePrimaryLinks = primaryLinks
    .map((item) => {
      const childItems = (item.children as NavigationMenuItem[] | undefined)
        ?.filter((child) => {
          const to = typeof child.to === 'string' ? child.to : undefined
          if (!to) return true
          const requiredRoles = requiredRolesForPath(to)
          return hasAny(requiredRoles as AppRole[] | undefined)
        })

      const withChildren = childItems ? { ...item, children: childItems } : item
      return withChildren
    })
    .filter((item) => {
      const to = typeof item.to === 'string' ? item.to : undefined
      const requiredRoles = to ? requiredRolesForPath(to) : undefined
      const hasVisibleChildren = Array.isArray(item.children) && item.children.length > 0
      const canSeeItem = hasAny(requiredRoles as AppRole[] | undefined)
      return canSeeItem || hasVisibleChildren
    })

  const secondaryLinks: NavigationMenuItem[] = [
    {
      label: userLabel.value,
      icon: 'solar:user-bold-duotone',
    },
  ]

  return [visiblePrimaryLinks, secondaryLinks]
})

const APP_TITLE = 'FOBI'

const activePageLabel = computed(() => {
  const allItems = links.value.flat()
  return findLabelByPath(allItems, route.path)
})

useHead(() => ({
  title: activePageLabel.value ? `${APP_TITLE} · ${activePageLabel.value}` : APP_TITLE
}))
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #default="{ collapsed }">
        <!-- Header -->
        <template v-if="!collapsed">
          <div class="flex items-center justify-center w-full px-3 py-3 border-b border-default">
            <span class="font-semibold text-xl truncate">
              FOBI
            </span>
          </div>
        </template>

        <!-- Primær navigation -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          :ui="{ 
            linkLeadingIcon: 'size-6',
            childLinkIcon: 'size-6'
          }" 
          orientation="vertical"
          tooltip
          popover
          class="mt-2"
        />

        <!-- Sekundær navigation / bund -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />

        <!-- Separator + ColorModeButton nederst -->
        <div class="border-t border-default mt-4 pt-3 flex justify-center">
          <UColorModeButton size="xl"/>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

